import { TranscodingJob } from '../types/video';
import { createLogger } from '../lib/logger';

const logger = createLogger('VideoQueue');

interface QueueJob {
  id: string;
  priority: number;
  addedAt: Date;
  startedAt?: Date;
  processor: () => Promise<void>;
}

/**
 * High CPU worker queue for video transcoding
 * Processes jobs sequentially to avoid overwhelming the CPU
 */
class VideoQueue {
  private queue: QueueJob[] = [];
  private processing = false;
  private maxConcurrent = 1; // Process one video at a time for CPU-intensive tasks
  private activeJobs = 0;

  /**
   * Add a job to the queue
   */
  public async addJob(
    jobId: string,
    processor: () => Promise<void>,
    priority: number = 0
  ): Promise<void> {
    const queueJob: QueueJob = {
      id: jobId,
      priority,
      addedAt: new Date(),
      processor,
    };

    // Insert job based on priority (higher priority first)
    const insertIndex = this.queue.findIndex((job) => job.priority < priority);
    if (insertIndex === -1) {
      this.queue.push(queueJob);
    } else {
      this.queue.splice(insertIndex, 0, queueJob);
    }

    logger.info(`Job ${jobId} added to queue`, { priority });

    // Start processing if not already running
    if (!this.processing) {
      this.processQueue();
    }
  }

  /**
   * Process jobs in the queue
   */
  private async processQueue(): Promise<void> {
    if (this.processing) {
      return;
    }

    this.processing = true;

    while (this.queue.length > 0 && this.activeJobs < this.maxConcurrent) {
      const job = this.queue.shift();
      if (!job) {
        break;
      }

      this.activeJobs++;
      job.startedAt = new Date();

      logger.info(`Starting job ${job.id}`, { queueLength: this.queue.length });

      try {
        await job.processor();
        logger.info(`Job ${job.id} completed successfully`);
      } catch (error) {
        logger.error(`Job ${job.id} failed`, { error });
      } finally {
        this.activeJobs--;
      }
    }

    this.processing = false;

    // Continue processing if there are more jobs
    if (this.queue.length > 0) {
      this.processQueue();
    }
  }

  /**
   * Get queue status
   */
  public getStatus() {
    return {
      queueLength: this.queue.length,
      activeJobs: this.activeJobs,
      maxConcurrent: this.maxConcurrent,
      jobs: this.queue.map((job) => ({
        id: job.id,
        priority: job.priority,
        addedAt: job.addedAt,
      })),
    };
  }

  /**
   * Set max concurrent jobs
   */
  public setMaxConcurrent(max: number): void {
    this.maxConcurrent = Math.max(1, max);
  }
}

export const videoQueue = new VideoQueue();
