import ffmpeg from 'fluent-ffmpeg';
import path from 'path';
import fs from 'fs/promises';
import { TranscodingJob, VideoQuality, VideoFormat, TranscodedOutput, TranscodingOptions } from '../types/video';
import { v4 as uuidv4 } from 'uuid';
import { createLogger } from '../lib/logger';

const logger = createLogger('VideoService');

class VideoService {
  private jobs: Map<string, TranscodingJob> = new Map();

  // Default quality presets
  private readonly DEFAULT_QUALITIES: VideoQuality[] = [
    { name: '1080p', width: 1920, height: 1080, bitrate: '5000k' },
    { name: '720p', width: 1280, height: 720, bitrate: '2500k' },
    { name: '480p', width: 854, height: 480, bitrate: '1000k' },
    { name: '360p', width: 640, height: 360, bitrate: '500k' },
  ];

  // Default format presets
  private readonly DEFAULT_FORMATS: VideoFormat[] = [
    { extension: 'mp4', codec: 'libx264', audioCodec: 'aac' },
    { extension: 'webm', codec: 'libvpx-vp9', audioCodec: 'libopus' },
  ];

  /**
   * Create a new transcoding job
   */
  public async createTranscodingJob(
    inputPath: string,
    options: TranscodingOptions = {}
  ): Promise<string> {
    const jobId = uuidv4();
    const outputDir = options.outputDir || path.join(path.dirname(inputPath), 'transcoded', jobId);

    // Ensure output directory exists
    await fs.mkdir(outputDir, { recursive: true });

    const job: TranscodingJob = {
      id: jobId,
      inputPath,
      outputDir,
      status: 'pending',
      progress: 0,
      qualities: options.qualities || this.DEFAULT_QUALITIES,
      formats: options.formats || this.DEFAULT_FORMATS,
      createdAt: new Date(),
      updatedAt: new Date(),
      outputs: [],
    };

    this.jobs.set(jobId, job);

    // Start processing in background
    this.processJob(jobId).catch((error) => {
      console.error(`Job ${jobId} failed:`, error);
      this.updateJobStatus(jobId, 'failed', error.message);
    });

    return jobId;
  }

  /**
   * Get job status
   */
  public getJob(jobId: string): TranscodingJob | undefined {
    return this.jobs.get(jobId);
  }

  /**
   * Get all jobs
   */
  public getAllJobs(): TranscodingJob[] {
    return Array.from(this.jobs.values());
  }

  /**
   * Process a transcoding job
   */
  private async processJob(jobId: string): Promise<void> {
    const job = this.jobs.get(jobId);
    if (!job) {
      throw new Error(`Job ${jobId} not found`);
    }

    this.updateJobStatus(jobId, 'processing');

    const totalTasks = job.qualities.length * job.formats.length;
    let completedTasks = 0;

    const outputs: TranscodedOutput[] = [];

    // Process each quality and format combination
    for (const quality of job.qualities) {
      for (const format of job.formats) {
        try {
          const output = await this.transcodeVideo(job, quality, format);
          outputs.push(output);

          completedTasks++;
          const progress = Math.round((completedTasks / totalTasks) * 100);
          this.updateJobProgress(jobId, progress);
        } catch (error) {
          console.error(`Failed to transcode ${quality.name} ${format.extension}:`, error);
          // Continue with other formats even if one fails
        }
      }
    }

    // Update job with outputs
    job.outputs = outputs;
    job.updatedAt = new Date();

    if (outputs.length === 0) {
      this.updateJobStatus(jobId, 'failed', 'All transcoding attempts failed');
    } else {
      this.updateJobStatus(jobId, 'completed');
    }
  }

  /**
   * Transcode video to specific quality and format
   */
  private async transcodeVideo(
    job: TranscodingJob,
    quality: VideoQuality,
    format: VideoFormat
  ): Promise<TranscodedOutput> {
    const outputFilename = `video_${quality.name}.${format.extension}`;
    const outputPath = path.join(job.outputDir, outputFilename);

    return new Promise((resolve, reject) => {
      ffmpeg(job.inputPath)
        .videoCodec(format.codec)
        .audioCodec(format.audioCodec)
        .size(`${quality.width}x${quality.height}`)
        .videoBitrate(quality.bitrate)
        .audioBitrate('128k')
        .audioChannels(2)
        .audioFrequency(44100)
        .format(format.extension)
        .on('start', (commandLine: string) => {
          logger.info(`Starting transcoding: ${outputFilename}`, { commandLine });
        })
        .on('progress', (progress: { percent?: number }) => {
          if (progress.percent) {
            logger.info(`Processing ${outputFilename}: ${Math.round(progress.percent)}%`);
          }
        })
        .on('end', async () => {
          logger.info(`Completed: ${outputFilename}`);

          // Get file size
          const stats = await fs.stat(outputPath);

          resolve({
            quality: quality.name,
            format: format.extension,
            path: outputPath,
            size: stats.size,
          });
        })
        .on('error', (err: Error) => {
          console.error(`Error transcoding ${outputFilename}:`, err);
          reject(err);
        })
        .save(outputPath);
    });
  }

  /**
   * Update job status
   */
  private updateJobStatus(jobId: string, status: TranscodingJob['status'], error?: string): void {
    const job = this.jobs.get(jobId);
    if (job) {
      job.status = status;
      job.updatedAt = new Date();
      if (error) {
        job.error = error;
      }
    }
  }

  /**
   * Update job progress
   */
  private updateJobProgress(jobId: string, progress: number): void {
    const job = this.jobs.get(jobId);
    if (job) {
      job.progress = progress;
      job.updatedAt = new Date();
    }
  }

  /**
   * Cancel a job
   */
  public async cancelJob(jobId: string): Promise<boolean> {
    const job = this.jobs.get(jobId);
    if (!job) {
      return false;
    }

    if (job.status === 'processing') {
      // In a real implementation, you'd need to track and kill the FFmpeg process
      this.updateJobStatus(jobId, 'failed', 'Job cancelled by user');
    }

    return true;
  }

  /**
   * Clean up old jobs
   */
  public async cleanupOldJobs(maxAgeMs: number = 24 * 60 * 60 * 1000): Promise<number> {
    const now = Date.now();
    let cleaned = 0;

    for (const [jobId, job] of this.jobs.entries()) {
      const age = now - job.createdAt.getTime();
      if (age > maxAgeMs && (job.status === 'completed' || job.status === 'failed')) {
        this.jobs.delete(jobId);
        cleaned++;
      }
    }

    return cleaned;
  }
}

export const videoService = new VideoService();
