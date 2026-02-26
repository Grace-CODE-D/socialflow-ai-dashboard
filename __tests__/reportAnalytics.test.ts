/**
 * Component Tests for Executive Reporting
 * 
 * Test Coverage:
 * - Report generation
 * - Export formats (PDF, Excel, CSV, JSON)
 * - Report customization
 * - Scheduled delivery
 * - Report analytics
 */

import {
  getReportViews,
  getReportDownloads,
  getPopularMetrics,
  getReportTemplates,
  getReportEngagement,
  generateUsageInsights,
  trackReportView,
  trackReportDownload
} from '../services/reportAnalyticsService';

// Mock test utilities
const mockConsoleLog = jest.fn();
const originalConsoleLog = console.log;

beforeEach(() => {
  console.log = mockConsoleLog;
  mockConsoleLog.mockClear();
});

afterEach(() => {
  console.log = originalConsoleLog;
});

describe('Report Analytics Service', () => {
  
  describe('Report Generation', () => {
    test('should generate report views data', async () => {
      const views = await getReportViews(30);
      
      expect(views).toBeDefined();
      expect(Array.isArray(views)).toBe(true);
      expect(views.length).toBeGreaterThan(0);
      
      // Validate structure
      const view = views[0];
      expect(view).toHaveProperty('id');
      expect(view).toHaveProperty('reportId');
      expect(view).toHaveProperty('reportName');
      expect(view).toHaveProperty('viewedBy');
      expect(view).toHaveProperty('viewedAt');
      expect(view).toHaveProperty('duration');
      expect(view).toHaveProperty('device');
    });

    test('should generate report downloads data', async () => {
      const downloads = await getReportDownloads(30);
      
      expect(downloads).toBeDefined();
      expect(Array.isArray(downloads)).toBe(true);
      expect(downloads.length).toBeGreaterThan(0);
      
      // Validate structure
      const download = downloads[0];
      expect(download).toHaveProperty('id');
      expect(download).toHaveProperty('reportId');
      expect(download).toHaveProperty('format');
      expect(download).toHaveProperty('downloadedBy');
      expect(download).toHaveProperty('downloadedAt');
      expect(download).toHaveProperty('fileSize');
    });

    test('should track report view', async () => {
      await trackReportView('report_123', 'user@test.com');
      
      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining('Tracked view: Report report_123 by user@test.com')
      );
    });

    test('should track report download', async () => {
      await trackReportDownload('report_123', 'user@test.com', 'pdf');
      
      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining('Tracked download: Report report_123 as pdf by user@test.com')
      );
    });
  });

  describe('Export Formats', () => {
    test('should support PDF format', async () => {
      const downloads = await getReportDownloads(30);
      const pdfDownloads = downloads.filter(d => d.format === 'pdf');
      
      expect(pdfDownloads.length).toBeGreaterThan(0);
    });

    test('should support Excel format', async () => {
      const downloads = await getReportDownloads(30);
      const excelDownloads = downloads.filter(d => d.format === 'excel');
      
      expect(excelDownloads.length).toBeGreaterThan(0);
    });

    test('should support CSV format', async () => {
      const downloads = await getReportDownloads(30);
      const csvDownloads = downloads.filter(d => d.format === 'csv');
      
      expect(csvDownloads.length).toBeGreaterThan(0);
    });

    test('should support JSON format', async () => {
      const downloads = await getReportDownloads(30);
      const jsonDownloads = downloads.filter(d => d.format === 'json');
      
      expect(jsonDownloads.length).toBeGreaterThan(0);
    });

    test('should have valid file sizes', async () => {
      const downloads = await getReportDownloads(30);
      
      downloads.forEach(download => {
        expect(download.fileSize).toBeGreaterThan(0);
        expect(typeof download.fileSize).toBe('number');
      });
    });
  });
