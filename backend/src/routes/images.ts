import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import { ImageOptimizationService } from '../services/ImageOptimizationService';

const router = Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads', 'images');
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid image format'));
    }
  },
});

/**
 * POST /api/images/upload
 * Upload and optimize image
 */
router.post('/upload', upload.single('image'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image provided' });
    }

    const { width, height, quality, format } = req.query;
    const options = {
      width: width ? parseInt(width as string) : undefined,
      height: height ? parseInt(height as string) : undefined,
      quality: quality ? parseInt(quality as string) : 80,
      format: (format as 'webp' | 'jpeg' | 'png') || 'webp',
    };

    const { buffer, format: resultFormat, cacheKey } = await ImageOptimizationService.optimize(
      req.file.path,
      options
    );

    res.setHeader('Content-Type', `image/${resultFormat}`);
    res.setHeader('Cache-Control', 'public, max-age=31536000');
    res.setHeader('X-Cache-Key', cacheKey);
    res.send(buffer);
  } catch (error) {
    console.error('Image optimization error:', error);
    res.status(500).json({ error: 'Failed to optimize image' });
  }
});

/**
 * GET /api/images/proxy
 * Proxy and optimize image from file path
 * Query: path (required), width, height, quality, format
 */
router.get('/proxy', async (req: Request, res: Response) => {
  try {
    const { path: imagePath, width, height, quality, format } = req.query;

    if (!imagePath || typeof imagePath !== 'string') {
      return res.status(400).json({ error: 'path parameter required' });
    }

    // Security: prevent directory traversal
    const normalizedPath = path.normalize(imagePath);
    if (normalizedPath.includes('..')) {
      return res.status(400).json({ error: 'Invalid path' });
    }

    const fullPath = path.join(process.cwd(), 'uploads', normalizedPath);

    const options = {
      width: width ? parseInt(width as string) : undefined,
      height: height ? parseInt(height as string) : undefined,
      quality: quality ? parseInt(quality as string) : 80,
      format: (format as 'webp' | 'jpeg' | 'png') || 'webp',
    };

    const { buffer, format: resultFormat, cacheKey } = await ImageOptimizationService.optimize(
      fullPath,
      options
    );

    res.setHeader('Content-Type', `image/${resultFormat}`);
    res.setHeader('Cache-Control', 'public, max-age=31536000');
    res.setHeader('X-Cache-Key', cacheKey);
    res.send(buffer);
  } catch (error) {
    console.error('Image proxy error:', error);
    res.status(500).json({ error: 'Failed to proxy image' });
  }
});

/**
 * GET /api/images/cache/size
 * Get cache size
 */
router.get('/cache/size', async (req: Request, res: Response) => {
  try {
    const size = await ImageOptimizationService.getCacheSize();
    res.json({ cacheSize: size, cacheSizeMB: (size / 1024 / 1024).toFixed(2) });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get cache size' });
  }
});

/**
 * DELETE /api/images/cache
 * Clear cache
 */
router.delete('/cache', async (req: Request, res: Response) => {
  try {
    await ImageOptimizationService.clearCache();
    res.json({ message: 'Cache cleared' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to clear cache' });
  }
});

export default router;
