import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import healthRoutes from './routes/health';
import jobsRoutes from './routes/jobs';
import { requestIdMiddleware } from './middleware/requestId';
import { errorHandler, notFoundHandler } from './middleware/error';

const app: Application = express();

// Security middleware
app.use(helmet());

// CORS
app.use(cors());

// Request ID middleware (must be first to ensure all logs have request ID)
app.use(requestIdMiddleware);

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging middleware (after request ID so logs include the ID)
app.use(morgan('combined'));

// Routes
app.use('/api/health', healthRoutes);
app.use('/api', jobsRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

import youtubeRoutes from './routes/youtube';
app.use('/api/youtube', youtubeRoutes);

// 404 handler - must be after all routes
app.use(notFoundHandler);

// Global error handler - must be last
app.use(errorHandler);

export default app;
