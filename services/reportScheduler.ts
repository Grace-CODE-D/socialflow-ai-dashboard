import {
  ReportConfig,
  ReportDelivery,
  ReportSchedule,
  ReportStatus,
  ReportDistributionList,
  ReportData,
} from '../types';
import { ExportService } from './exportService';
import { EmailService } from './emailService';

export class ReportScheduler {
  private static scheduledJobs: Map<string, NodeJS.Timeout> = new Map();
  private static reportConfigs: Map<string, ReportConfig> = new Map();
  private static distributionLists: Map<string, ReportDistributionList> = new Map();
  private static deliveryHistory: ReportDelivery[] = [];

  /**
   * Initialize scheduler with existing configs
   */
  static initialize(configs: ReportConfig[], lists: ReportDistributionList[]): void {
    configs.forEach(config => {
      this.reportConfigs.set(config.id, config);
      if (config.active) {
        this.scheduleReport(config);
      }
    });

    lists.forEach(list => {
      this.distributionLists.set(list.id, list);
    });
  }

  /**
   * Schedule a report for automated generation
   */
  static scheduleReport(config: ReportConfig): void {
    // Clear existing schedule if any
    this.unscheduleReport(config.id);

    if (!config.active) return;

    const nextRun = this.calculateNextRun(config);
    const delay = nextRun.getTime() - Date.now();

    const timeout = setTimeout(() => {
      this.executeReport(config);
      // Reschedule for next occurrence
      this.scheduleReport(config);
    }, delay);

    this.scheduledJobs.set(config.id, timeout);
    
    // Update config with next run time
    config.nextRun = nextRun;
    this.reportConfigs.set(config.id, config);
  }

  /**
   * Unschedule a report
   */
  static unscheduleReport(configId: string): void {
    const timeout = this.scheduledJobs.get(configId);
    if (timeout) {
      clearTimeout(timeout);
      this.scheduledJobs.delete(configId);
    }
  }

  /**
   * Calculate next run time based on schedule
   */
  private static calculateNextRun(config: ReportConfig): Date {
    const now = new Date();
    const nextRun = new Date(now);

    switch (config.schedule) {
      case ReportSchedule.DAILY:
        if (config.scheduleTime) {
          const [hours, minutes] = config.scheduleTime.split(':').map(Number);
          nextRun.setHours(hours, minutes, 0, 0);
          if (nextRun <= now) {
            nextRun.setDate(nextRun.getDate() + 1);
          }
        } else {
          nextRun.setDate(nextRun.getDate() + 1);
        }
        break;

      case ReportSchedule.WEEKLY:
        if (config.scheduleDayOfWeek !== undefined) {
          const daysUntilNext = (config.scheduleDayOfWeek - now.getDay() + 7) % 7 || 7;
          nextRun.setDate(now.getDate() + daysUntilNext);
          if (config.scheduleTime) {
            const [hours, minutes] = config.scheduleTime.split(':').map(Number);
            nextRun.setHours(hours, minutes, 0, 0);
          }
        }
        break;

      case ReportSchedule.MONTHLY:
        if (config.scheduleDayOfMonth) {
          nextRun.setDate(config.scheduleDayOfMonth);
          if (nextRun <= now) {
            nextRun.setMonth(nextRun.getMonth() + 1);
          }
          if (config.scheduleTime) {
            const [hours, minutes] = config.scheduleTime.split(':').map(Number);
            nextRun.setHours(hours, minutes, 0, 0);
          }
        }
        break;
    }

    return nextRun;
  }

  /**
   * Execute report generation and delivery
   */
  static async executeReport(config: ReportConfig): Promise<void> {
    const delivery: ReportDelivery = {
      id: `delivery-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      reportConfigId: config.id,
      reportName: config.name,
      format: config.format,
      status: ReportStatus.GENERATING,
      recipients: this.getRecipientEmails(config.distributionLists),
      generatedAt: new Date(),
    };

    this.deliveryHistory.push(delivery);

    try {
      // Generate report data (this would fetch real data in production)
      const reportData = await this.generateReportData(config);

      // Export to requested format
      const blob = await ExportService.exportReport(reportData, config.format);
      
      delivery.fileSize = blob.size;
      delivery.status = ReportStatus.COMPLETED;

      // Send via email
      if (delivery.recipients.length > 0) {
        await EmailService.sendReport(
          delivery.recipients,
          config.name,
          reportData,
          blob,
          config.format
        );
        delivery.status = ReportStatus.DELIVERED;
        delivery.deliveredAt = new Date();
      }

      // Update last run time
      config.lastRun = new Date();
      this.reportConfigs.set(config.id, config);

    } catch (error) {
      delivery.status = ReportStatus.FAILED;
      delivery.error = error instanceof Error ? error.message : 'Unknown error';
      console.error('Report execution failed:', error);
    }
  }

  /**
   * Get all recipient emails from distribution lists
   */
  private static getRecipientEmails(listIds: string[]): string[] {
    const emails: string[] = [];
    listIds.forEach(listId => {
      const list = this.distributionLists.get(listId);
      if (list) {
        list.recipients
          .filter(r => r.active)
          .forEach(r => emails.push(r.email));
      }
    });
    return [...new Set(emails)]; // Remove duplicates
  }

  /**
   * Generate report data (mock implementation)
   */
  private static async generateReportData(config: ReportConfig): Promise<ReportData> {
    // In production, this would fetch real analytics data
    const now = new Date();
    const dateRange = this.getDateRange(config);

    return {
      title: config.name,
      generatedAt: now,
      dateRange,
      metrics: {
        totalPosts: 156,
        totalEngagement: 45230,
        totalReach: 125000,
        totalImpressions: 342000,
        engagementRate: 3.62,
        topPlatform: 'instagram' as any,
      },
      platformBreakdown: [
        { platform: 'instagram' as any, posts: 65, engagement: 22000, reach: 58000 },
        { platform: 'tiktok' as any, posts: 42, engagement: 15000, reach: 38000 },
        { platform: 'facebook' as any, posts: 28, engagement: 5230, reach: 18000 },
        { platform: 'x' as any, posts: 21, engagement: 3000, reach: 11000 },
      ],
      performanceTrends: this.generateTrendData(dateRange),
    };
  }

  /**
   * Get date range based on config
   */
  private static getDateRange(config: ReportConfig): { start: Date; end: Date } {
    const end = new Date();
    const start = new Date();

    switch (config.dateRange) {
      case 'last7days':
        start.setDate(start.getDate() - 7);
        break;
      case 'last30days':
        start.setDate(start.getDate() - 30);
        break;
      case 'lastMonth':
        start.setMonth(start.getMonth() - 1);
        start.setDate(1);
        end.setDate(0);
        break;
      case 'custom':
        if (config.customDateRange) {
          return config.customDateRange;
        }
        break;
    }

    return { start, end };
  }

  /**
   * Generate trend data for date range
   */
  private static generateTrendData(dateRange: { start: Date; end: Date }) {
    const trends = [];
    const current = new Date(dateRange.start);

    while (current <= dateRange.end) {
      trends.push({
        date: current.toLocaleDateString(),
        engagement: Math.floor(Math.random() * 5000) + 1000,
        reach: Math.floor(Math.random() * 15000) + 3000,
        posts: Math.floor(Math.random() * 10) + 1,
      });
      current.setDate(current.getDate() + 1);
    }

    return trends;
  }

  /**
   * Add or update report configuration
   */
  static saveReportConfig(config: ReportConfig): void {
    this.reportConfigs.set(config.id, config);
    if (config.active) {
      this.scheduleReport(config);
    } else {
      this.unscheduleReport(config.id);
    }
  }

  /**
   * Delete report configuration
   */
  static deleteReportConfig(configId: string): void {
    this.unscheduleReport(configId);
    this.reportConfigs.delete(configId);
  }

  /**
   * Add or update distribution list
   */
  static saveDistributionList(list: ReportDistributionList): void {
    this.distributionLists.set(list.id, list);
  }

  /**
   * Delete distribution list
   */
  static deleteDistributionList(listId: string): void {
    this.distributionLists.delete(listId);
  }

  /**
   * Get all report configs
   */
  static getAllReportConfigs(): ReportConfig[] {
    return Array.from(this.reportConfigs.values());
  }

  /**
   * Get all distribution lists
   */
  static getAllDistributionLists(): ReportDistributionList[] {
    return Array.from(this.distributionLists.values());
  }

  /**
   * Get delivery history
   */
  static getDeliveryHistory(limit?: number): ReportDelivery[] {
    const history = [...this.deliveryHistory].sort(
      (a, b) => b.generatedAt.getTime() - a.generatedAt.getTime()
    );
    return limit ? history.slice(0, limit) : history;
  }

  /**
   * Get delivery status for a specific report config
   */
  static getConfigDeliveries(configId: string): ReportDelivery[] {
    return this.deliveryHistory
      .filter(d => d.reportConfigId === configId)
      .sort((a, b) => b.generatedAt.getTime() - a.generatedAt.getTime());
  }
}
