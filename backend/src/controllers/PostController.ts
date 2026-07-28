import { Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../middleware/authenticate';
import { ModerationService } from '../services/ModerationService';
import { BadRequestError, NotFoundError } from '../lib/errors';
import { indexPost, deletePost as deleteSearchPost } from '../services/SearchService';

export async function createPost(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { content, platform, scheduledAt, organizationId, mediaUrls } = req.body as {
      content: string;
      platform: string;
      scheduledAt?: string;
      organizationId: string;
      mediaUrls?: string[];
    };

    // Run moderation before persisting. ModerationService itself decides
    // fail-open vs fail-closed behaviour (via MODERATION_MODE) when the
    // provider is unavailable — do not swallow that decision here.
    const moderation = await ModerationService.moderate(content);

    if (moderation.blocked) {
      throw new BadRequestError(
        `Content blocked by moderation policy: ${moderation.reason ?? 'policy violation'}`,
        'CONTENT_BLOCKED',
      );
    }

    const post = await prisma.post.create({
      data: {
        id: randomUUID(),
        organizationId,
        content,
        platform,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        ...(mediaUrls && { mediaUrls }),
      },
    });

    // Fire-and-forget — don't block the response on indexing
    indexPost({
      id: post.id,
      organizationId: post.organizationId,
      content: post.content,
      platform: post.platform,
      scheduledAt: post.scheduledAt?.toISOString() ?? null,
      createdAt: post.createdAt.toISOString(),
    });

    res.status(201).json({
      ...post,
      moderation: moderation.flagged
        ? { flagged: true, reason: moderation.reason }
        : { flagged: false },
    });
  } catch (err) {
    next(err);
  }
}

export async function updatePost(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const { content, platform, scheduledAt, mediaUrls } = req.body as {
      content?: string;
      platform?: string;
      scheduledAt?: string;
      mediaUrls?: string[];
    };

    const activeOrgId = req.activeOrgId;

    const existing = await prisma.post.findFirst({
      where: { id, organizationId: activeOrgId },
    });

    if (!existing) {
      throw new NotFoundError('Post not found');
    }

    if (content !== undefined) {
      const moderation = await ModerationService.moderate(content);

      if (moderation.blocked) {
        throw new BadRequestError(
          `Content blocked by moderation policy: ${moderation.reason ?? 'policy violation'}`,
          'CONTENT_BLOCKED',
        );
      }
    }

    const post = await prisma.post.update({
      where: { id },
      data: {
        ...(content !== undefined && { content }),
        ...(platform !== undefined && { platform }),
        ...(scheduledAt !== undefined && { scheduledAt: new Date(scheduledAt) }),
        ...(mediaUrls !== undefined && { mediaUrls }),
      },
    });

    res.json(post);
  } catch (err) {
    next(err);
  }
}

export async function deletePost(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const activeOrgId = req.activeOrgId;

    const existing = await prisma.post.findFirst({
      where: { id, organizationId: activeOrgId },
    });

    if (!existing) {
      throw new NotFoundError('Post not found');
    }

    await prisma.post.delete({ where: { id } });

    // Remove from search index (fire-and-forget)
    deleteSearchPost(id);

    res.status(204).end();
  } catch (err) {
    next(err);
  }
}
