import { Router, Request, Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/authMiddleware';
import { AuditLogStore } from '../models/AuditLog';

const router = Router();

/**
 * GET /api/audit
 * Returns the most recent audit log entries (admin view).
 * Query: limit (default 100, max 500)
 */
router.get('/', authMiddleware, (req: Request, res: Response) => {
  const limit = Math.min(Number(req.query.limit) || 100, 500);
  return res.json(AuditLogStore.recent(limit));
});

/**
 * GET /api/audit/me
 * Returns audit log entries for the authenticated user.
 */
router.get('/me', authMiddleware, (req: AuthRequest, res: Response) => {
  const limit = Math.min(Number(req.query.limit) || 100, 500);
  return res.json(AuditLogStore.forActor(req.userId!, limit));
});

/**
 * GET /api/audit/resource/:type/:id
 * Returns audit log entries for a specific resource.
 */
router.get('/resource/:type/:id', authMiddleware, (req: Request, res: Response) => {
  return res.json(AuditLogStore.forResource(req.params.type, req.params.id));
});

export default router;
