import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import healthRoutes from './routes/health';
import authRoutes from './routes/auth';
import { corsOptions } from './config/cors';

const app: Express = express();

// Middleware
app.use(helmet());
app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // handle pre-flight for all routes
app.use(express.json());
app.use(morgan('dev'));

// Routes
app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);

export default app;
