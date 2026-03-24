import { Router, Request, Response } from 'express';
import { getWorkerMonitorStatus } from '../monitoring/workerMonitorInstance';

const router = Router();

router.get('/', (_req: Request, res: Response) => {
  const workerMonitor = getWorkerMonitorStatus();

  res.json({
    status: 'healthy',
    service: 'SocialFlow AI Backend',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    workerMonitor,
  });
});

export default router;
