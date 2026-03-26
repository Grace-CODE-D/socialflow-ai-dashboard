import 'reflect-metadata';
import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { requestIdMiddleware } from './middleware/requestId';
import { errorHandler, notFoundHandler } from './middleware/error';
import { initRateLimiters, authLimiter, aiLimiter, generalLimiter } from './middleware/rateLimit';
import authRoutes from './routes/auth';
import aiRoutes from './routes/ai';
import healthRoutes from './routes/health';
import jobsRoutes from './routes/jobs';
import webhookRoutes from './routes/webhooks';
import realtimeRoutes from './routes/realtime';
import ttsRoutes from './routes/tts';
import youtubeRoutes from './routes/youtube';
import facebookRoutes from './routes/facebook';
import exportsRoutes from './routes/exports';
import imagesRoutes from './routes/images';

// Initialise rate limiters (resolves Redis store in production)
export const rateLimitersReady = initRateLimiters();

const app: Application = express();

// Security middleware
app.use(helmet());

// CORS — allow EventSource connections
app.use(cors());

// Request ID middleware (must be first to ensure all logs have request ID)
app.use(requestIdMiddleware);

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging middleware (after request ID so logs include the ID)
app.use(morgan('combined'));

// ── Routes ───────────────────────────────────────────────────────────────────

// Health — no rate limiting (cheap, public)
app.use('/api/health', healthRoutes);
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Auth — strict limiter (brute-force protection)
app.use('/api/auth', (req, res, next) => authLimiter(req, res, next), authRoutes);

// AI generation — per-minute limiter (high-cost endpoints)
app.use('/api/ai', (req, res, next) => aiLimiter(req, res, next), aiRoutes);
app.use('/api/tts', (req, res, next) => aiLimiter(req, res, next), ttsRoutes);

// General API — standard limiter
app.use('/api', (req, res, next) => generalLimiter(req, res, next), jobsRoutes);
app.use('/api/youtube', (req, res, next) => generalLimiter(req, res, next), youtubeRoutes);
app.use('/api/facebook', (req, res, next) => generalLimiter(req, res, next), facebookRoutes);
app.use('/api/exports', (req, res, next) => generalLimiter(req, res, next), exportsRoutes);
app.use('/api/images', (req, res, next) => generalLimiter(req, res, next), imagesRoutes);

// 404 handler - must be after all routes
app.use(notFoundHandler);

// Global error handler - must be last
app.use(errorHandler);

export default app;
