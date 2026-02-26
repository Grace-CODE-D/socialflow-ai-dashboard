import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import pptxgen from 'pptxgenjs';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import { ReportData, ReportFormat, Platform } from '../types';

export class ExportService {
  /**
   * Export report to PDF with professional styling
   */
  static async exportToPDF(data: ReportData): Promise<Blob> {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Header
    doc.setFontSize(24);
    doc.setTextColor(59, 130, 246); // Blue
    doc.text(data.title, pageWidth / 2, 20, { align: 'center' });
    
    // Metadata
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generated: ${data.generatedAt.toLocaleString()}`, 14, 30);
    doc.text(
      `Period: ${data.dateRange.start.toLocaleDateString()} - ${data.dateRange.end.toLocaleDateString()}`,
      14,
      36
    );
    
    // Key Metrics Section
    doc.setFontSize(16);
    doc.setTextColor(0);
    doc.text('Key Metrics', 14, 50);
    
    const metricsData = [
      ['Total Posts', data.metrics.totalPosts.toString()],
      ['Total Engagement', data.metrics.totalEngagement.toLocaleString()],
      ['Total Reach', data.metrics.totalReach.toLocaleString()],
      ['Total Impressions', data.metrics.totalImpressions.toLocaleString()],
      ['Engagement Rate', `${data.metrics.engagementRate.toFixed(2)}%`],
      ['Top Platform', data.metrics.topPlatform.toUpperCase()],
    ];
    
    autoTable(doc, {
      startY: 55,
      head: [['Metric', 'Value']],
      body: metricsData,
      theme: 'striped',
      headStyles: { fillColor: [59, 130, 246] },
    });
    
    // Platform Breakdown
    const finalY = (doc as any).lastAutoTable.finalY || 55;
    doc.setFontSize(16);
    doc.text('Platform Breakdown', 14, finalY + 15);
    
    const platformData = data.platformBreakdown.map(p => [
      p.platform.toUpperCase(),
      p.posts.toString(),
      p.engagement.toLocaleString(),
      p.reach.toLocaleString(),
    ]);
    
    autoTable(doc, {
      startY: finalY + 20,
      head: [['Platform', 'Posts', 'Engagement', 'Reach']],
      body: platformData,
      theme: 'grid',
      headStyles: { fillColor: [59, 130, 246] },
    });
    
    // Footer
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(
        `Page ${i} of ${pageCount}`,
        pageWidth / 2,
        doc.internal.pageSize.getHeight() - 10,
        { align: 'center' }
      );
    }
    
    return doc.output('blob');
  }

  /**
   * Generate PowerPoint presentation
   */
  static async exportToPowerPoint(data: ReportData): Promise<Blob> {
    const pptx = new pptxgen();
    
    // Title Slide
    const titleSlide = pptx.addSlide();
    titleSlide.background = { color: '3B82F6' };
    titleSlide.addText(data.title, {
      x: 0.5,
      y: 2,
      w: 9,
      h: 1.5,
      fontSize: 44,
      bold: true,
      color: 'FFFFFF',
      align: 'center',
    });
    titleSlide.addText(
      `${data.dateRange.start.toLocaleDateString()} - ${data.dateRange.end.toLocaleDateString()}`,
      {
        x: 0.5,
        y: 3.5,
        w: 9,
        h: 0.5,
        fontSize: 18,
        color: 'FFFFFF',
        align: 'center',
      }
    );
    
    // Key Metrics Slide
    const metricsSlide = pptx.addSlide();
    metricsSlide.addText('Key Metrics', {
      x: 0.5,
      y: 0.5,
      w: 9,
      h: 0.75,
      fontSize: 32,
      bold: true,
      color: '1F2937',
    });
    
    const metricsRows = [
      ['Metric', 'Value'],
      ['Total Posts', data.metrics.totalPosts.toString()],
      ['Total Engagement', data.metrics.totalEngagement.toLocaleString()],
      ['Total Reach', data.metrics.totalReach.toLocaleString()],
      ['Engagement Rate', `${data.metrics.engagementRate.toFixed(2)}%`],
      ['Top Platform', data.metrics.topPlatform.toUpperCase()],
    ];
    
    metricsSlide.addTable(metricsRows as any, {
      x: 1,
      y: 1.5,
      w: 8,
      h: 3.5,
      fontSize: 14,
      border: { pt: 1, color: 'CCCCCC' },
      fill: { color: 'F3F4F6' },
      color: '1F2937',
    });
    
    // Platform Breakdown Slide
    const platformSlide = pptx.addSlide();
    platformSlide.addText('Platform Breakdown', {
      x: 0.5,
      y: 0.5,
      w: 9,
      h: 0.75,
      fontSize: 32,
      bold: true,
      color: '1F2937',
    });
    
    const platformRows = [
      ['Platform', 'Posts', 'Engagement', 'Reach'],
      ...data.platformBreakdown.map(p => [
        p.platform.toUpperCase(),
        p.posts.toString(),
        p.engagement.toLocaleString(),
        p.reach.toLocaleString(),
      ]),
    ];
    
    platformSlide.addTable(platformRows as any, {
      x: 0.5,
      y: 1.5,
      w: 9,
      h: 4,
      fontSize: 12,
      border: { pt: 1, color: 'CCCCCC' },
      fill: { color: 'F3F4F6' },
      color: '1F2937',
    });
    
    const blob = await pptx.write({ outputType: 'blob' }) as Blob;
    return blob;
  }

  /**
   * Create CSV data export
   */
  static async exportToCSV(data: ReportData): Promise<Blob> {
    const rows = [
      ['Report', data.title],
      ['Generated', data.generatedAt.toLocaleString()],
      ['Period', `${data.dateRange.start.toLocaleDateString()} - ${data.dateRange.end.toLocaleDateString()}`],
      [],
      ['Key Metrics'],
      ['Total Posts', data.metrics.totalPosts],
      ['Total Engagement', data.metrics.totalEngagement],
      ['Total Reach', data.metrics.totalReach],
      ['Total Impressions', data.metrics.totalImpressions],
      ['Engagement Rate', `${data.metrics.engagementRate.toFixed(2)}%`],
      ['Top Platform', data.metrics.topPlatform],
      [],
      ['Platform Breakdown'],
      ['Platform', 'Posts', 'Engagement', 'Reach'],
      ...data.platformBreakdown.map(p => [
        p.platform,
        p.posts,
        p.engagement,
        p.reach,
      ]),
      [],
      ['Performance Trends'],
      ['Date', 'Engagement', 'Reach', 'Posts'],
      ...data.performanceTrends.map(t => [
        t.date,
        t.engagement,
        t.reach,
        t.posts,
      ]),
    ];
    
    const csv = Papa.unparse(rows);
    return new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  }

  /**
   * Add Excel workbook generation
   */
  static async exportToExcel(data: ReportData): Promise<Blob> {
    const workbook = XLSX.utils.book_new();
    
    // Summary Sheet
    const summaryData = [
      ['Report', data.title],
      ['Generated', data.generatedAt.toLocaleString()],
      ['Period', `${data.dateRange.start.toLocaleDateString()} - ${data.dateRange.end.toLocaleDateString()}`],
      [],
      ['Key Metrics', 'Value'],
      ['Total Posts', data.metrics.totalPosts],
      ['Total Engagement', data.metrics.totalEngagement],
      ['Total Reach', data.metrics.totalReach],
      ['Total Impressions', data.metrics.totalImpressions],
      ['Engagement Rate', `${data.metrics.engagementRate.toFixed(2)}%`],
      ['Top Platform', data.metrics.topPlatform],
    ];
    
    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');
    
    // Platform Breakdown Sheet
    const platformData = [
      ['Platform', 'Posts', 'Engagement', 'Reach'],
      ...data.platformBreakdown.map(p => [
        p.platform,
        p.posts,
        p.engagement,
        p.reach,
      ]),
    ];
    
    const platformSheet = XLSX.utils.aoa_to_sheet(platformData);
    XLSX.utils.book_append_sheet(workbook, platformSheet, 'Platform Breakdown');
    
    // Performance Trends Sheet
    const trendsData = [
      ['Date', 'Engagement', 'Reach', 'Posts'],
      ...data.performanceTrends.map(t => [
        t.date,
        t.engagement,
        t.reach,
        t.posts,
      ]),
    ];
    
    const trendsSheet = XLSX.utils.aoa_to_sheet(trendsData);
    XLSX.utils.book_append_sheet(workbook, trendsSheet, 'Performance Trends');
    
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    return new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  }

  /**
   * Main export function that routes to appropriate format
   */
  static async exportReport(data: ReportData, format: ReportFormat): Promise<Blob> {
    switch (format) {
      case ReportFormat.PDF:
        return this.exportToPDF(data);
      case ReportFormat.POWERPOINT:
        return this.exportToPowerPoint(data);
      case ReportFormat.CSV:
        return this.exportToCSV(data);
      case ReportFormat.EXCEL:
        return this.exportToExcel(data);
      default:
        throw new Error(`Unsupported format: ${format}`);
    }
  }

  /**
   * Download exported file
   */
  static downloadFile(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}
