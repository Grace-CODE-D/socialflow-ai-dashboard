import app from './app';
import { getBackendPort } from './config/runtime';
import { startWorkerMonitor, stopWorkerMonitor } from './monitoring/workerMonitorInstance';

const PORT = getBackendPort();

const bootstrap = async (): Promise<void> => {
  try {
    await startWorkerMonitor();
  } catch (error) {
    console.error(
      `[worker-monitor] Failed to start monitor: ${error instanceof Error ? error.message : String(error)}`,
    );
  }

  const server = app.listen(PORT, () => {
    console.log(`🚀 SocialFlow Backend is running on http://localhost:${PORT}`);
  });

  const shutdown = async (signal: string): Promise<void> => {
    console.log(`[server] Received ${signal}. Starting graceful shutdown...`);

    try {
      await stopWorkerMonitor();
    } catch (error) {
      console.error(
        `[worker-monitor] Failed to stop monitor: ${error instanceof Error ? error.message : String(error)}`,
      );
    }

    server.close(() => {
      console.log('[server] Shutdown complete');
      process.exit(0);
    });
  };

  process.on('SIGINT', () => {
    void shutdown('SIGINT');
  });

  process.on('SIGTERM', () => {
    void shutdown('SIGTERM');
  });
};

void bootstrap();
