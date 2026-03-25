# Implementation: Video Transformation Pipeline (Transcoding)

## Issue #336

### Overview
Implemented a background task system to transcode uploaded videos into multiple qualities and formats using FFmpeg and fluent-ffmpeg library.

### Features Implemented

1. **VideoService** (`backend/src/services/VideoService.ts`)
   - Manages video transcoding jobs
   - Supports multiple quality presets (1080p, 720p, 480p, 360p)
   - Supports multiple formats (MP4/H.264, WebM/VP9)
   - Progress tracking for each job
   - Automatic cleanup of old jobs
   - Job cancellation support

2. **VideoQueue** (`backend/src/queues/VideoQueue.ts`)
   - High CPU worker queue for sequential processing
   - Priority-based job scheduling
   - Configurable concurrency (default: 1 job at a time)
   - Queue status monitoring

3. **Video Routes** (`backend/src/routes/video.ts`)
   - `POST /api/video/upload` - Upload video and start transcoding
   - `GET /api/video/job/:jobId` - Get job status and progress
   - `GET /api/video/jobs` - List all jobs
   - `DELETE /api/video/job/:jobId` - Cancel a job
   - `GET /api/video/queue/status` - Get queue status

4. **Type Definitions** (`backend/src/types/video.ts`)
   - TranscodingJob interface
   - VideoQuality and VideoFormat interfaces
   - TranscodedOutput interface

### Technical Details

#### Dependencies Added
```json
{
  "dependencies": {
    "fluent-ffmpeg": "^2.1.2",
    "multer": "^1.4.5-lts.1",
    "uuid": "^9.0.1"
  },
  "devDependencies": {
    "@types/fluent-ffmpeg": "^2.1.24",
    "@types/multer": "^1.4.11",
    "@types/uuid": "^9.0.8"
  }
}
```

#### Quality Presets
- **1080p**: 1920x1080, 5000k bitrate
- **720p**: 1280x720, 2500k bitrate
- **480p**: 854x480, 1000k bitrate
- **360p**: 640x360, 500k bitrate

#### Format Presets
- **MP4**: H.264 video codec, AAC audio codec
- **WebM**: VP9 video codec, Opus audio codec

#### File Upload Configuration
- Maximum file size: 500MB
- Allowed MIME types: video/mp4, video/mpeg, video/quicktime, video/x-msvideo, video/webm
- Upload directory: `uploads/videos/`
- Transcoded output: `uploads/transcoded/{jobId}/`

### API Usage Examples

#### Upload a Video
```bash
curl -X POST http://localhost:3001/api/video/upload \
  -F "video=@/path/to/video.mp4" \
  -F 'options={"qualities":[{"name":"720p","width":1280,"height":720,"bitrate":"2500k"}]}'
```

Response:
```json
{
  "message": "Video uploaded successfully. Transcoding started.",
  "jobId": "550e8400-e29b-41d4-a716-446655440000",
  "status": "pending"
}
```

#### Check Job Status
```bash
curl http://localhost:3001/api/video/job/550e8400-e29b-41d4-a716-446655440000
```

Response:
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "processing",
  "progress": 45,
  "inputPath": "/path/to/input.mp4",
  "outputDir": "/path/to/output",
  "qualities": [...],
  "formats": [...],
  "outputs": [
    {
      "quality": "720p",
      "format": "mp4",
      "path": "/path/to/output/video_720p.mp4",
      "size": 15728640
    }
  ],
  "createdAt": "2024-03-24T10:00:00.000Z",
  "updatedAt": "2024-03-24T10:05:00.000Z"
}
```

### Setup Instructions

1. **Install FFmpeg**
   ```bash
   # Ubuntu/Debian
   sudo apt-get install ffmpeg
   
   # macOS
   brew install ffmpeg
   
   # Windows
   # Download from https://ffmpeg.org/download.html
   ```

2. **Install Dependencies**
   ```bash
   cd backend
   npm install
   ```

3. **Start the Server**
   ```bash
   npm run dev
   ```

4. **Verify Setup**
   ```bash
   # Check if FFmpeg is installed
   ffmpeg -version
   
   # Test the API
   curl http://localhost:3001/api/video/queue/status
   ```

### Architecture Decisions

1. **Sequential Processing**: The queue processes one video at a time by default to prevent CPU overload. This can be adjusted via `setMaxConcurrent()`.

2. **Job-Based System**: Each upload creates a job that can be tracked, cancelled, and monitored independently.

3. **Multiple Outputs**: Each job produces multiple quality/format combinations, allowing adaptive streaming support.

4. **Progress Tracking**: FFmpeg progress events are captured and exposed through the API.

5. **Automatic Cleanup**: Completed and failed jobs older than 24 hours are automatically removed.

### Files Created/Modified

#### Created
- `backend/src/services/VideoService.ts` - Core transcoding service
- `backend/src/queues/VideoQueue.ts` - Job queue management
- `backend/src/routes/video.ts` - API endpoints
- `backend/src/types/video.ts` - TypeScript interfaces
- `backend/src/utils/initDirectories.ts` - Directory initialization
- `backend/src/services/README.md` - Service documentation
- `backend/examples/video-transcoding-example.ts` - Usage examples

#### Modified
- `backend/package.json` - Added dependencies
- `backend/src/app.ts` - Registered video routes
- `backend/src/server.ts` - Added directory initialization
- `backend/tsconfig.json` - Added node types
- `.gitignore` - Added uploads directory

### Testing

Example test script is provided in `backend/examples/video-transcoding-example.ts`:

```bash
# Run the example
ts-node backend/examples/video-transcoding-example.ts /path/to/video.mp4
```

### Performance Considerations

- **CPU Usage**: Transcoding is CPU-intensive. The queue limits concurrent jobs to prevent overload.
- **Disk Space**: Multiple quality/format outputs require significant storage.
- **Memory**: Large video files are streamed to minimize memory usage.
- **Network**: Upload size is limited to 500MB to prevent timeout issues.

### Future Enhancements

1. Add support for custom FFmpeg parameters
2. Implement thumbnail generation
3. Add video metadata extraction
4. Support for HLS/DASH adaptive streaming
5. Integration with cloud storage (S3, etc.)
6. Webhook notifications on job completion
7. Video preview generation
8. Batch upload support

### Commit Message
```
feat: implement video transcoding pipeline with FFmpeg

- Add VideoService for managing transcoding jobs
- Implement high CPU worker queue for background processing
- Support multiple quality presets (1080p, 720p, 480p, 360p)
- Support multiple formats (MP4/H.264, WebM/VP9)
- Add progress tracking and job management
- Include API endpoints for upload, status, and cancellation
- Add automatic cleanup of old jobs
- Configure multer for video file uploads

Closes #336
```

### Related Documentation
- [Video Service README](backend/src/services/README.md)
- [Example Usage](backend/examples/video-transcoding-example.ts)
