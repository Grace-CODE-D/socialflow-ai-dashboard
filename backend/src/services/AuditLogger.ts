import { createLogger } from '../lib/logger';
import { AuditLog, AuditLogStore, AuditAction } from '../models/AuditLog';

const logger = createLogger('audit');

export interface AuditContext {
  actorId: string;
  action: AuditAction;
  resourceType?: string;
  resourceId?: string;
  metadata?: Record<string, unknown>;
  ip?: string;
  userAgent?: string;
}

/**
 * AuditLogger — single entry point for recording audit events.
 *
 * Usage:
 *   auditLogger.log({ actorId: userId, action: 'post:delete', resourceType: 'post', resourceId: id });
 */
class AuditLogger {
  log(ctx: AuditContext): AuditLog {
    const entry = AuditLogStore.append(ctx);
    logger.info('audit', {
      id: entry.id,
      actorId: entry.actorId,
      action: entry.action,
      resourceType: entry.resourceType,
      resourceId: entry.resourceId,
    });
    return entry;
  }
}

export const auditLogger = new AuditLogger();
