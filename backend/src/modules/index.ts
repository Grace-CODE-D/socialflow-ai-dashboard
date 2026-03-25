import { Router } from 'express';
import { healthRoutes } from './health';
import { authRoutes } from './auth';
import { organizationRoutes } from './organization';
import { webhookRoutes } from './webhook';
import { analyticsRoutes } from './analytics';

/**
 * Module Registry
 * Centralized registration of all domain modules
 */

export function registerModules(app: any): void {
  // Health module
  app.use('/api/health', healthRoutes);

  // Auth module
  app.use('/api/auth', authRoutes);

  // Organization module
  app.use('/api/organizations', organizationRoutes);

  // Webhook module
  app.use('/api/webhooks', webhookRoutes);

  // Analytics module
  app.use('/api/analytics', analyticsRoutes);

  // Social module routes (YouTube, Facebook)
  app.use('/api/youtube', require('./social/routes.youtube').default);
  app.use('/api/facebook', require('./social/routes.facebook').default);

  // Content module routes
  app.use('/api/video', require('./content/routes.video').default);
  app.use('/api/translation', require('./content/routes.translation').default);
  app.use('/api/tts', require('./content/routes.tts').default);

  // Billing module
  app.use('/api/billing', require('./billing/routes').default);
}

export * from './health';
export * from './social';
export * from './content';
export * from './billing';
export * from './auth';
export * from './organization';
export * from './webhook';
export * from './analytics';
