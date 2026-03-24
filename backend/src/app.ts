import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import healthRoutes from './routes/health';
import statusRoutes from './routes/status';

const app: Express = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' })); // allow base64 image payloads
app.use(morgan('dev'));

// Routes
app.use('/api/health', healthRoutes);
app.use('/status', statusRoutes);

export default app;
