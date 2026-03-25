# Video Transcoding Pipeline

## Overview

The video transcoding pipeline processes uploaded videos into multiple qualities and formats using FFmpeg. It uses a job-based queue system to handle CPU-intensive transcoding tasks efficiently.

## Architecture

### Components

1. **VideoService** (`VideoService.ts`)
   - Manages transcoding jobs
   - Handles FFmpeg operations
   - Tracks job status and progress

2. **VideoQueue** (`VideoQueue.ts`)
   - High CPU worker queue
   - Sequential processing to avoid CPU overload
   - Priority-based job scheduling

3. **Video Routes** (`routes/video.ts`)
   - Upload endpoint with multer
   - Job status and management endpoints
   - Queue monitoring

## Features

- Multiple quality presets (1080p, 720p, 480p, 360p)
- Multiple format support (MP4/H.264, WebM/VP9)
- Progress tracking
- Job cancellation
- Automatic cleanup of old jobs
- File size limits (500MB max)

## API Endpoints

### Upload Video
```
POST /api/video/upload
Content-Type: multipart/form-data

Body:
- video: video file
- options: JSON string (optional)
  {
    "qualities": [...],
    "formats": [...],
    "outputDir": "custom/path"
  }

Response: 202 Accepted
{
  "message": "Video uploaded successfully. Transcoding started.",
  "jobId": "uuid",
  "status": "pending"
}
```

### Get Job Status
```
GET /api/video/job/:jobId

Response: 200 OK
{
  "id": "uuid",
  "status": "processing",
  "progress": 45,
  "outputs": [...],
  ...
}
```

### Get All Jobs
```
GET /api/video/jobs

Response: 200 OK
{
  "jobs": [...]
}
```

### Cancel Job
```
DELETE /api/video/job/:jobId

Response: 200 OK
{
  "message": "Job cancelled successfully"
}
```

### Get Queue Status
```
GET /api/video/queue/status

Response: 200 OK
{
  "queueLength": 3,
  "activeJobs": 1,
  "maxConcurrent": 1,
  "jobs": [...]
}
```

## Setup

### Prerequisites

1. Install FFmpeg on your system:
   ```bash
   # Ubuntu/Debian
   sudo apt-get install ffmpeg
   
   # macOS
   brew install ffmpeg
   
   # Windows
   # Download from https://ffmpeg.org/download.html
   ```

2. Install dependencies:
   ```bash
   cd backend
   npm install
   ```

### Configuration

The service uses default quality and format presets, but you can customize them when creating a job:

```typescript
const options = {
  qualities: [
    { name: '1080p', width: 1920, height: 1080, bitrate: '5000k' },
    { name: '720p', width: 1280, height: 720, bitrate: '2500k' }
  ],
  formats: [
    { extension: 'mp4', codec: 'libx264', audioCodec: 'aac' }
  ]
};
```

## Usage Example

```typescript
// Upload a video
const formData = new FormData();
formData.append('video', videoFile);
formData.append('options', JSON.stringify({
  qualities: [
    { name: '720p', width: 1280, height: 720, bitrate: '2500k' }
  ]
}));

const response = await fetch('http://localhost:3000/api/video/upload', {
  method: 'POST',
  body: formData
});

const { jobId } = await response.json();

// Poll for status
const checkStatus = async () => {
  const statusResponse = await fetch(`http://localhost:3000/api/video/job/${jobId}`);
  const job = await statusResponse.json();
  
  console.log(`Status: ${job.status}, Progress: ${job.progress}%`);
  
  if (job.status === 'completed') {
    console.log('Transcoded files:', job.outputs);
  }
};
```

## Performance Considerations

- The queue processes one video at a time by default to prevent CPU overload
- Adjust `maxConcurrent` in VideoQueue if you have more CPU cores available
- Large files are handled efficiently through streaming
- Progress updates are logged during transcoding

## Error Handling

- Invalid file types are rejected at upload
- Failed transcoding attempts are logged but don't stop other formats
- Jobs can be cancelled while processing
- Old completed/failed jobs are automatically cleaned up after 24 hours
