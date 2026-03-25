import { Response, NextFunction } from 'express';
import { AuthRequest } from './authMiddleware';
import { auditLogger } from '../services/AuditLogger';
import { AuditAction } from '../models/AuditLog';

/**
 * Middleware factory that records an audit log entry after the response is sent.
 * Must be used after `authMiddleware` (requires req.userId).
 *
 * Usage:
 *   router.delete('/:id', authMiddleware, audit('post:delete', 'post', (req) => req.params.id), handler)
 */
export function audit(
  action: AuditAction,
  resourceType?: string,
  resourceId?: (req: AuthRequest) => string | undefined
) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    res.on('finish', () => {
      // Only log on successful (2xx) responses
      if (res.statusCode >= 200 && res.statusCode < 300) {
        auditLogger.log({
          actorId: req.userId ?? 'anonymous',
          action,
          resourceType,
          resourceId: resourceId?.(req),
          ip: req.ip,
          userAgent: req.headers['user-agent'],
        });
      }
    });
    next();
  };
}
