import { Router } from 'express';
import { z } from 'zod';
import { authMiddleware } from '../middleware/authMiddleware';
import { validate } from '../middleware/validate';
import { createPost } from '../controllers/PostController';

const router = Router();

const createPostSchema = z.object({
  content: z.string().min(1).max(5000),
  platform: z.enum(['twitter', 'linkedin', 'instagram', 'tiktok', 'facebook', 'youtube']),
  organizationId: z.string().uuid(),
  scheduledAt: z.string().datetime().optional(),
});

router.use(authMiddleware);

router.post('/', validate(createPostSchema), createPost);

export default router;
