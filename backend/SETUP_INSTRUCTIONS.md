# Video Transcoding Setup Instructions

## Installation Steps

### 1. Install FFmpeg (System Requirement)

FFmpeg must be installed on your system before the transcoding pipeline will work.

**Ubuntu/Debian:**
```bash
sudo apt-get update
sudo apt-get install ffmpeg
```

**macOS:**
```bash
brew install ffmpeg
```

**Windows:**
Download from [https://ffmpeg.org/download.html](https://ffmpeg.org/download.html) and add to PATH.

**Verify Installation:**
```bash
ffmpeg -version
```

### 2. Install Node.js Dependencies

```bash
cd backend
npm install
```

This will install:
- `fluent-ffmpeg` - FFmpeg wrapper for Node.js
- `multer` - File upload middleware
- `uuid` - Unique ID generation
- Type definitions for all above

### 3. Start the Backend

```bash
npm run dev
```

The server will:
- Start on port 3001
- Create required directories (`uploads/videos`, `uploads/transcoded`)
- Initialize the video transcoding service

### 4. Verify Setup

Check if the video service is healthy:
```bash
curl http://localhost:3001/api/video/health
```

Expected response:
```json
{
  "status": "healthy",
  "ffmpeg": { "available": true, "version": "..." },
  "codecs": { "libx264": true, "libvpx-vp9": true, ... }
}
```

## Quick Test

Upload a test video:
```bash
curl -X POST http://localhost:3001/api/video/upload \
  -F "video=@test-video.mp4"
```

## What Was Implemented

✅ VideoService with FFmpeg integration  
✅ High CPU worker queue for background processing  
✅ Multiple quality presets (1080p, 720p, 480p, 360p)  
✅ Multiple format support (MP4/H.264, WebM/VP9)  
✅ Progress tracking and job management  
✅ API endpoints for upload, status, and cancellation  
✅ Health check endpoint  
✅ Automatic directory initialization  
✅ Comprehensive documentation  

## Next Steps

1. Run `npm install` in the backend directory
2. Ensure FFmpeg is installed on your system
3. Start the backend server
4. Test with a sample video upload

For detailed API documentation, see `VIDEO_TRANSCODING_QUICKSTART.md`.
