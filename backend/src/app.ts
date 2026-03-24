import './config/runtime';
import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import aiRoutes from './routes/ai';
import healthRoutes from './routes/health';
import statusRoutes from './routes/status';
import videoRoutes from './routes/video';
import predictiveRoutes from './routes/predictive';

const app: Express = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' })); // allow base64 image payloads
app.use(morgan('dev'));

// Routes
app.use('/ai', aiRoutes);
app.use('/api/health', healthRoutes);
app.use('/status', statusRoutes);
app.use('/api/video', videoRoutes);
app.use('/api/predictive', predictiveRoutes);

export default app;
