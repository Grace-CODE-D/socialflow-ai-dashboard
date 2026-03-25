#!/bin/bash

# Setup script for video transcoding pipeline

echo "🎬 Setting up Video Transcoding Pipeline..."

# Check if FFmpeg is installed
if ! command -v ffmpeg &> /dev/null; then
    echo "❌ FFmpeg is not installed!"
    echo ""
    echo "Please install FFmpeg:"
    echo "  Ubuntu/Debian: sudo apt-get install ffmpeg"
    echo "  macOS: brew install ffmpeg"
    echo "  Windows: Download from https://ffmpeg.org/download.html"
    echo ""
    exit 1
fi

echo "✅ FFmpeg is installed"
ffmpeg -version | head -n 1

# Install npm dependencies
echo ""
echo "📦 Installing dependencies..."
cd "$(dirname "$0")/.."
npm install

# Create upload directories
echo ""
echo "📁 Creating upload directories..."
mkdir -p uploads/videos
mkdir -p uploads/transcoded

echo ""
echo "✅ Setup complete!"
echo ""
echo "To start the server:"
echo "  npm run dev"
echo ""
echo "To test the API:"
echo "  curl http://localhost:3001/api/video/queue/status"
