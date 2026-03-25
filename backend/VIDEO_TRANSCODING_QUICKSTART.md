# Video Transcoding Pipeline - Quick Start

## Prerequisites

1. **Install FFmpeg** (required for video processing)
   ```bash
   # Ubuntu/Debian
   sudo apt-get update && sudo apt-get install ffmpeg
   
   # macOS
   brew install ffmpeg
   
   # Verify installation
   ffmpeg -version
   ```

2. **Install Node.js dependencies**
   ```bash
   cd backend
   npm install
   ```

## Quick Start

### 1. Start the Backend Server
```bash
cd backend
npm run dev
```

The server will start on `http://localhost:3001`

### 2. Test FFmpeg Integration
```bash
curl http://localhost:3001/api/video/health
```

Expected response:
```json
{
  "status": "healthy",
  "ffmpeg": {
    "available": true,
    "version": "4.4.2"
  },
  "codecs": {
    "libx264": true,
    "libvpx-vp9": true,
    "aac": true,
    "libopus": true
  }
}
```

### 3. Upload a Video
```bash
curl -X POST http://localhost:3001/api/video/upload \
  -F "video=@/path/to/your/video.mp4"
```

Response:
```json
{
  "message": "Video uploaded successfully. Transcoding started.",
  "jobId": "550e8400-e29b-41d4-a716-446655440000",
  "status": "pending"
}
```

### 4. Check Job Status
```bash
curl http://localhost:3001/api/video/job/550e8400-e29b-41d4-a716-446655440000
```

### 5. Monitor Queue
```bash
curl http://localhost:3001/api/video/queue/status
```

## Custom Transcoding Options

You can customize quality and format settings:

```bash
curl -X POST http://localhost:3001/api/video/upload \
  -F "video=@video.mp4" \
  -F 'options={"qualities":[{"name":"720p","width":1280,"height":720,"bitrate":"2500k"}],"formats":[{"extension":"mp4","codec":"libx264","audioCodec":"aac"}]}'
```

## Default Output

By default, each uploaded video is transcoded into:
- 4 qualities: 1080p, 720p, 480p, 360p
- 2 formats: MP4 (H.264/AAC), WebM (VP9/Opus)
- Total: 8 output files per video

## Troubleshooting

### FFmpeg Not Found
If you get "FFmpeg not available" errors:
1. Verify FFmpeg is installed: `ffmpeg -version`
2. Ensure FFmpeg is in your PATH
3. Restart the backend server after installing FFmpeg

### Upload Fails
- Check file size (max 500MB)
- Verify file is a valid video format
- Check disk space in uploads directory

### Slow Processing
- Transcoding is CPU-intensive and takes time
- Default queue processes one video at a time
- Monitor progress via the job status endpoint

## Architecture

```
Client Upload
     ↓
Video Route (multer)
     ↓
VideoService.createTranscodingJob()
     ↓
VideoQueue (High CPU Worker)
     ↓
FFmpeg Transcoding (fluent-ffmpeg)
     ↓
Multiple Quality/Format Outputs
```

## Next Steps

- See `backend/src/services/README.md` for detailed documentation
- Check `backend/examples/video-transcoding-example.ts` for programmatic usage
- Review `backend/src/config/video.config.ts` for configuration options
