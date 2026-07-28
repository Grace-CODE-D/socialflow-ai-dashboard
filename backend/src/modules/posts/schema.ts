import { z } from 'zod';

export const createPostSchema = z.object({
  content: z.string().min(1).max(5000),
  platform: z.enum(['twitter', 'linkedin', 'instagram', 'tiktok', 'facebook', 'youtube']),
  organizationId: z.string().uuid(),
  scheduledAt: z.string().datetime().optional(),
});
