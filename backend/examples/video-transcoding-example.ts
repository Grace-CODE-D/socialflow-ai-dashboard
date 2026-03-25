/**
 * Example usage of the video transcoding pipeline
 * 
 * This demonstrates how to use the video transcoding API
 */

import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';

const API_BASE_URL = 'http://localhost:3001';

/**
 * Upload and transcode a video
 */
async function uploadVideo(videoPath: string) {
  const formData = new FormData();
  formData.append('video', fs.createReadStream(videoPath));
  
  // Optional: customize transcoding options
  const options = {
    qualities: [
      { name: '1080p', width: 1920, height: 1080, bitrate: '5000k' },
      { name: '720p', width: 1280, height: 720, bitrate: '2500k' },
    ],
    formats: [
      { extension: 'mp4', codec: 'libx264', audioCodec: 'aac' },
    ],
  };
  
  formData.append('options', JSON.stringify(options));

  try {
    const response = await axios.post(`${API_BASE_URL}/api/video/upload`, formData, {
      headers: formData.getHeaders(),
    });

    console.log('Upload successful:', response.data);
    return response.data.jobId;
  } catch (error) {
    console.error('Upload failed:', error);
    throw error;
  }
}

/**
 * Check job status
 */
async function checkJobStatus(jobId: string) {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/video/job/${jobId}`);
    return response.data;
  } catch (error) {
    console.error('Failed to get job status:', error);
    throw error;
  }
}

/**
 * Poll job until completion
 */
async function waitForCompletion(jobId: string, pollInterval: number = 2000) {
  return new Promise((resolve, reject) => {
    const interval = setInterval(async () => {
      try {
        const job = await checkJobStatus(jobId);
        
        console.log(`Job ${jobId}: ${job.status} - ${job.progress}%`);
        
        if (job.status === 'completed') {
          clearInterval(interval);
          console.log('Transcoding completed!');
          console.log('Outputs:', job.outputs);
          resolve(job);
        } else if (job.status === 'failed') {
          clearInterval(interval);
          reject(new Error(`Job failed: ${job.error}`));
        }
      } catch (error) {
        clearInterval(interval);
        reject(error);
      }
    }, pollInterval);
  });
}

/**
 * Get queue status
 */
async function getQueueStatus() {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/video/queue/status`);
    console.log('Queue status:', response.data);
    return response.data;
  } catch (error) {
    console.error('Failed to get queue status:', error);
    throw error;
  }
}

/**
 * Cancel a job
 */
async function cancelJob(jobId: string) {
  try {
    const response = await axios.delete(`${API_BASE_URL}/api/video/job/${jobId}`);
    console.log('Job cancelled:', response.data);
    return response.data;
  } catch (error) {
    console.error('Failed to cancel job:', error);
    throw error;
  }
}

/**
 * Main example
 */
async function main() {
  const videoPath = process.argv[2];
  
  if (!videoPath) {
    console.error('Usage: ts-node video-transcoding-example.ts <path-to-video>');
    process.exit(1);
  }

  if (!fs.existsSync(videoPath)) {
    console.error(`Video file not found: ${videoPath}`);
    process.exit(1);
  }

  console.log(`Uploading video: ${videoPath}`);
  
  // Upload video
  const jobId = await uploadVideo(videoPath);
  console.log(`Job created: ${jobId}`);
  
  // Check queue status
  await getQueueStatus();
  
  // Wait for completion
  await waitForCompletion(jobId);
  
  console.log('Done!');
}

// Run if executed directly
if (require.main === module) {
  main().catch(console.error);
}

export { uploadVideo, checkJobStatus, waitForCompletion, getQueueStatus, cancelJob };
