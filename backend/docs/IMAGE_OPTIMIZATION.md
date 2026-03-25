# WebP Image Optimization & CDN Proxy

## Overview

Automatically converts uploaded images to WebP format and serves them via a CDN-optimized proxy endpoint with intelligent caching.

## Features

- **Automatic WebP Conversion** - Reduces image size by 25-35%
- **Intelligent Caching** - Cache-busting with MD5 hashing
- **Responsive Resizing** - Optional width/height parameters
- **Quality Control** - Configurable compression quality
- **Format Support** - JPEG, PNG, WebP, GIF input; WebP/JPEG/PNG output
- **Security** - Directory traversal prevention

## API Endpoints

### POST /api/images/upload

Upload and optimize image.

**Query Parameters:**
- `width` (optional) - Target width in pixels
- `height` (optional) - Target height in pixels
- `quality` (optional) - Compression quality 1-100 (default: 80)
- `format` (optional) - Output format: webp, jpeg, png (default: webp)

**Example:**
```bash
curl -F "image=@photo.jpg" \
  "http://localhost:3000/api/images/upload?width=800&quality=85&format=webp"
```

**Response:**
- Binary image data
- Headers: `Content-Type: image/webp`, `Cache-Control: public, max-age=31536000`

### GET /api/images/proxy

Proxy and optimize image from file path.

**Query Parameters:**
- `path` (required) - Relative path to image in uploads directory
- `width` (optional) - Target width
- `height` (optional) - Target height
- `quality` (optional) - Compression quality (default: 80)
- `format` (optional) - Output format (default: webp)

**Example:**
```bash
curl "http://localhost:3000/api/images/proxy?path=images/photo.jpg&width=600&format=webp"
```

### GET /api/images/cache/size

Get cache size statistics.

**Response:**
```json
{
  "cacheSize": 1048576,
  "cacheSizeMB": "1.00"
}
```

### DELETE /api/images/cache

Clear all cached images.

**Response:**
```json
{
  "message": "Cache cleared"
}
```

## Performance

### Size Reduction

| Format | Original | WebP | Reduction |
|--------|----------|------|-----------|
| JPEG | 500KB | 350KB | 30% |
| PNG | 800KB | 480KB | 40% |
| GIF | 1.2MB | 600KB | 50% |

### Caching Strategy

- **Cache Key**: MD5 hash of file path + optimization options
- **Cache Location**: `uploads/images/cache/`
- **TTL**: 1 year (31536000 seconds)
- **Automatic**: First request generates and caches, subsequent requests serve from cache

## Usage Examples

### Upload and Convert to WebP

```bash
curl -F "image=@photo.jpg" \
  "http://localhost:3000/api/images/upload?format=webp&quality=85" \
  -o optimized.webp
```

### Resize and Optimize

```bash
curl -F "image=@large.png" \
  "http://localhost:3000/api/images/upload?width=1200&height=800&quality=80" \
  -o thumbnail.webp
```

### Proxy Existing Image

```bash
curl "http://localhost:3000/api/images/proxy?path=images/banner.jpg&width=1920&format=webp" \
  -o banner-optimized.webp
```

### Node.js Integration

```typescript
import fetch from 'node-fetch';
import fs from 'fs';

async function optimizeImage(imagePath: string) {
  const response = await fetch(
    `http://localhost:3000/api/images/proxy?path=${imagePath}&format=webp&quality=85`
  );
  const buffer = await response.buffer();
  fs.writeFileSync('optimized.webp', buffer);
}
```

## Configuration

### Cache Directory

Default: `uploads/images/cache/`

### Quality Presets

- **High Quality**: 90-95 (for photography)
- **Standard**: 80-85 (recommended)
- **Compressed**: 70-75 (for thumbnails)

### Supported Formats

**Input**: JPEG, PNG, WebP, GIF
**Output**: WebP (default), JPEG, PNG

## Security

- Directory traversal prevention via path normalization
- File type validation on upload
- 50MB file size limit
- Allowed MIME types: image/jpeg, image/png, image/webp, image/gif

## Performance Tips

1. **Use WebP Format** - 25-35% smaller than JPEG
2. **Optimize Quality** - 80 is usually sufficient
3. **Resize Large Images** - Reduce dimensions for thumbnails
4. **Monitor Cache** - Use `/api/images/cache/size` to track storage
5. **Clear Cache Periodically** - Use `/api/images/cache` endpoint

## Troubleshooting

### "Invalid image format" Error

Ensure the image is in a supported format (JPEG, PNG, WebP, GIF).

### Large Cache Size

Clear cache: `DELETE /api/images/cache`

### Slow Optimization

- Reduce image dimensions
- Lower quality setting
- Check disk I/O performance

## Future Enhancements

- [ ] S3/Cloud storage backend
- [ ] Automatic format detection
- [ ] AVIF format support
- [ ] Progressive image loading
- [ ] Image CDN integration
- [ ] Batch optimization
