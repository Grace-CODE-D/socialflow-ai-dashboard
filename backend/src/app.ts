import 'reflect-metadata';
import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { requestIdMiddleware } from './middleware/requestId';
import { compressionMiddleware } from './middleware/compression';
import { errorHandler, notFoundHandler } from './middleware/error';
import { initRateLimiters } from './middleware/rateLimit';
import { sliMiddleware } from './middleware/sliMiddleware';
import v1Router from './routes/v1';
import metricsRouter from './routes/metrics';

// Initialise rate limiters (resolves Redis store in production)
export const rateLimitersReady = initRateLimiters();

const app: Application = express();

// ── Core middleware ───────────────────────────────────────────────────────────

// Response compression (Gzip/Brotli) — before body parsing so all responses are eligible
app.use(compressionMiddleware);

// CORS — allow EventSource connections
app.use(cors());
app.use(requestIdMiddleware);
app.use(sliMiddleware);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('combined'));

// ── Versioned API ─────────────────────────────────────────────────────────────

// Current stable version
app.use('/api/v1', v1Router);

// Legacy /api prefix — deprecated alias for backward compatibility.
// Adds a Deprecation header so clients know to migrate to /api/v1.
app.use('/api', (req: Request, res: Response, next: NextFunction) => {
  res.set('Deprecation', 'true');
  res.set('Link', '</api/v1>; rel="successor-version"');
  next();
}, v1Router);

// Bare /health for load-balancer probes (no versioning needed)
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Prometheus metrics scrape endpoint
app.use('/metrics', metricsRouter);

// ── Error handling ────────────────────────────────────────────────────────────

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
