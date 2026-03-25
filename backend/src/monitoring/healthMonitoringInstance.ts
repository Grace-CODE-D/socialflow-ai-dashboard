import { HealthMonitor } from '../services/healthMonitor';
import { createNotificationManager } from '../services/notificationProvider';
import { createLogger } from '../lib/logger';

const logger = createLogger('healthMonitoringInstance');

let healthMonitorInstance: HealthMonitor | null = null;

export function getHealthMonitor(): HealthMonitor {
  if (!healthMonitorInstance) {
    const notificationManager = createNotificationManager();
    healthMonitorInstance = new HealthMonitor(notificationManager);
    logger.info('Health monitor instance created');
  }
  return healthMonitorInstance;
}

export function initializeHealthMonitoring(): void {
  const monitor = getHealthMonitor();
  // Import here to avoid circular dependencies
  const { healthService } = require('../services/healthService');
  healthService.setHealthMonitor(monitor);
  logger.info('Health monitoring initialized');
}
