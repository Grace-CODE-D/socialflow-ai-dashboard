import app from './app';
import { SocketService } from './services/SocketService';
import { initializeWorkers } from './jobs/workers';
import { queueManager } from './queues/queueManager';
import { getBackendPort } from './config/runtime';
import { startDataPruningJob, stopDataPruningJob } from './jobs/dataPruningJob';
import { startYouTubeSyncJob, stopYouTubeSyncJob } from './jobs/youtubeSyncJob';
import { startWorkerMonitor, stopWorkerMonitor } from './monitoring/workerMonitorInstance';
import { createLogger } from './lib/logger';
import { prisma } from './lib/prisma';
import { Server } from 'http';

const logger = createLogger('server');
const PORT = getBackendPort();

let serverInstance: Server | null = null;
let isShuttingDown = false;

/**
 * Graceful shutdown handler
 * Closes all connections and cleans up resources before exiting
 */
const gracefulShutdown = async (signal: string, exitCode: number = 0): Promise<void> => {
  // Prevent multiple shutdown calls
  if (isShuttingDown) {
    logger.warn('Shutdown already in progress, ignoring duplicate signal');
    return;
  }

  isShuttingDown = true;
  logger.info(`Received ${signal}. Starting graceful shutdown...`);

  // Set a timeout to force exit if graceful shutdown takes too long
  const forceExitTimeout = setTimeout(() => {
    logger.error('Graceful shutdown timeout exceeded, forcing exit');
    process.exit(1);
  }, 30000); // 30 seconds timeout

  try {
    // Stop accepting new connections
    if (serverInstance) {
      await new Promise<void>((resolve, reject) => {
        serverInstance!.close((err) => {
          if (err) {
            logger.error('Error closing HTTP server', { error: err });
            reject(err);
          } else {
            logger.info('HTTP server closed');
            resolve();
          }
        });
      });
    }

    // Stop worker monitor
    try {
      await stopWorkerMonitor();
      logger.info('Worker monitor stopped');
    } catch (error) {
      logger.error('Failed to stop worker monitor', {
        error: error instanceof Error ? error.message : String(error),
      });
    }

    // Stop data pruning job
    try {
      await stopDataPruningJob();
      logger.info('Data pruning job stopped');
    } catch (error) {
      logger.error('Failed to stop data pruning job', {
        error: error instanceof Error ? error.message : String(error),
      });
    }

    // Stop YouTube sync job
    try {
      await stopYouTubeSyncJob();
      logger.info('YouTube sync job stopped');
    } catch (error) {
      logger.error('Failed to stop YouTube sync job', {
        error: error instanceof Error ? error.message : String(error),
      });
    }

    // Close job queues and workers
    try {
      await queueManager.closeAll();
      logger.info('All queues and workers closed successfully');
    } catch (error) {
      logger.error('Failed to close queues', {
        error: error instanceof Error ? error.message : String(error),
      });
    }

    // Close database connections
    try {
      await prisma.$disconnect();
      logger.info('Database connections closed');
    } catch (error) {
      logger.error('Failed to close database connections', {
        error: error instanceof Error ? error.message : String(error),
      });
    }

    clearTimeout(forceExitTimeout);
    logger.info('Shutdown complete');
    process.exit(exitCode);
  } catch (error) {
    clearTimeout(forceExitTimeout);
    logger.error('Error during graceful shutdown', {
      error: error instanceof Error ? error.message : String(error),
    });
    process.exit(1);
  }
};

/**
 * Global uncaught exception handler
 * Logs the error and initiates graceful shutdown
 */
process.on('uncaughtException', (error: Error) => {
  logger.error('UNCAUGHT EXCEPTION - Application will terminate', {
    error: error.message,
    stack: error.stack,
    name: error.name,
  });

  // Give some time for logs to flush before exiting
  setTimeout(() => {
    void gracefulShutdown('uncaughtException', 1);
  }, 1000);
});

/**
 * Global unhandled promise rejection handler
 * Logs the rejection and initiates graceful shutdown
 */
process.on('unhandledRejection', (reason: unknown, promise: Promise<unknown>) => {
  logger.error('UNHANDLED REJECTION - Application will terminate', {
    reason: reason instanceof Error ? reason.message : String(reason),
    stack: reason instanceof Error ? reason.stack : undefined,
    promise: String(promise),
  });

  // Give some time for logs to flush before exiting
  setTimeout(() => {
    void gracefulShutdown('unhandledRejection', 1);
  }, 1000);
});

/**
 * Handle process termination signals
 */
process.on('SIGINT', () => {
  void gracefulShutdown('SIGINT', 0);
});

process.on('SIGTERM', () => {
  void gracefulShutdown('SIGTERM', 0);
});

/**
 * Bootstrap the application
 */
const bootstrap = async (): Promise<void> => {
  try {
    // Initialize job queue workers
    logger.info('Initializing job queue workers...');
    initializeWorkers();

    // Start worker monitor
    try {
      await startWorkerMonitor();
      logger.info('Worker monitor started');
    } catch (error) {
      logger.error('Failed to start worker monitor', {
        error: error instanceof Error ? error.message : String(error),
      });
    }

    // Start data pruning job
    try {
      await startDataPruningJob();
      logger.info('Data pruning job started');
    } catch (error) {
      logger.error('Failed to start data pruning job', {
        error: error instanceof Error ? error.message : String(error),
      });
    }

    // Start YouTube analytics sync job
    try {
      await startYouTubeSyncJob();
      logger.info('YouTube analytics sync job started');
    } catch (error) {
      logger.error('Failed to start YouTube sync job', {
        error: error instanceof Error ? error.message : String(error),
      });
    }

    // Start HTTP server
    serverInstance = app.listen(PORT, () => {
      logger.info(`🚀 SocialFlow Backend is running on http://localhost:${PORT}`);
      logger.info('📬 Job Queue System initialized');
    });

    // Initialize Socket.io
    SocketService.initialize(serverInstance);

    // Handle server errors
    serverInstance.on('error', (error: Error) => {
      logger.error('Server error', { error: error.message, stack: error.stack });
    });
  } catch (error) {
    logger.error('Failed to bootstrap application', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    process.exit(1);
  }
};

void bootstrap();
