import nodemailer from 'nodemailer';
import { ReportData, ReportFormat } from '../types';

export class EmailService {
  private static transporter: nodemailer.Transporter | null = null;

  /**
   * Initialize email service with SMTP configuration
   */
  static initialize(config: {
    host: string;
    port: number;
    secure: boolean;
    auth: {
      user: string;
      pass: string;
    };
  }): void {
    this.transporter = nodemailer.createTransport(config);
  }

  /**
   * Send report via email
   */
  static async sendReport(
    recipients: string[],
    reportName: string,
    reportData: ReportData,
    fileBlob: Blob,
    format: ReportFormat
  ): Promise<void> {
    if (!this.transporter) {
      throw new Error('Email service not initialized. Call initialize() first.');
    }

    const fileExtension = this.getFileExtension(format);
    const fileName = `${reportName.replace(/\s+/g, '_')}_${Date.now()}.${fileExtension}`;
    
    // Convert Blob to Buffer for nodemailer
    const buffer = Buffer.from(await fileBlob.arrayBuffer());

    const mailOptions = {
      from: '"SocialFlow Reports" <reports@socialflow.app>',
      to: recipients.join(', '),
      subject: `${reportName} - ${reportData.generatedAt.toLocaleDateString()}`,
      html: this.generateEmailHTML(reportData),
      attachments: [
        {
          filename: fileName,
          content: buffer,
          contentType: this.getContentType(format),
        },
      ],
    };

    await this.transporter.sendMail(mailOptions);
  }

  /**
   * Generate HTML email body
   */
  private static generateEmailHTML(data: ReportData): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background: linear-gradient(135deg, #3B82F6 0%, #2563EB 100%);
            color: white;
            padding: 30px;
            border-radius: 8px;
            text-align: center;
            margin-bottom: 30px;
          }
          .header h1 {
            margin: 0;
            font-size: 28px;
          }
          .header p {
            margin: 10px 0 0 0;
            opacity: 0.9;
          }
          .metrics {
            background: #F3F4F6;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 20px;
          }
          .metric-row {
            display: flex;
            justify-content: space-between;
            padding: 10px 0;
            border-bottom: 1px solid #E5E7EB;
          }
          .metric-row:last-child {
            border-bottom: none;
          }
          .metric-label {
            font-weight: 600;
            color: #6B7280;
          }
          .metric-value {
            font-weight: 700;
            color: #1F2937;
          }
          .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 2px solid #E5E7EB;
            color: #6B7280;
            font-size: 14px;
          }
          .button {
            display: inline-block;
            background: #3B82F6;
            color: white;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 6px;
            margin-top: 20px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${data.title}</h1>
          <p>Report Period: ${data.dateRange.start.toLocaleDateString()} - ${data.dateRange.end.toLocaleDateString()}</p>
          <p>Generated: ${data.generatedAt.toLocaleString()}</p>
        </div>
        
        <div class="metrics">
          <h2 style="margin-top: 0; color: #1F2937;">Key Metrics Summary</h2>
          <div class="metric-row">
            <span class="metric-label">Total Posts</span>
            <span class="metric-value">${data.metrics.totalPosts.toLocaleString()}</span>
          </div>
          <div class="metric-row">
            <span class="metric-label">Total Engagement</span>
            <span class="metric-value">${data.metrics.totalEngagement.toLocaleString()}</span>
          </div>
          <div class="metric-row">
            <span class="metric-label">Total Reach</span>
            <span class="metric-value">${data.metrics.totalReach.toLocaleString()}</span>
          </div>
          <div class="metric-row">
            <span class="metric-label">Total Impressions</span>
            <span class="metric-value">${data.metrics.totalImpressions.toLocaleString()}</span>
          </div>
          <div class="metric-row">
            <span class="metric-label">Engagement Rate</span>
            <span class="metric-value">${data.metrics.engagementRate.toFixed(2)}%</span>
          </div>
          <div class="metric-row">
            <span class="metric-label">Top Platform</span>
            <span class="metric-value">${data.metrics.topPlatform.toUpperCase()}</span>
          </div>
        </div>
        
        <p style="color: #6B7280;">
          The complete report is attached to this email. For detailed analysis and insights, 
          please review the attached document.
        </p>
        
        <div class="footer">
          <p>This is an automated report from SocialFlow Analytics</p>
          <p>© ${new Date().getFullYear()} SocialFlow. All rights reserved.</p>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Get file extension for format
   */
  private static getFileExtension(format: ReportFormat): string {
    switch (format) {
      case ReportFormat.PDF:
        return 'pdf';
      case ReportFormat.POWERPOINT:
        return 'pptx';
      case ReportFormat.CSV:
        return 'csv';
      case ReportFormat.EXCEL:
        return 'xlsx';
      default:
        return 'pdf';
    }
  }

  /**
   * Get MIME content type for format
   */
  private static getContentType(format: ReportFormat): string {
    switch (format) {
      case ReportFormat.PDF:
        return 'application/pdf';
      case ReportFormat.POWERPOINT:
        return 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
      case ReportFormat.CSV:
        return 'text/csv';
      case ReportFormat.EXCEL:
        return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      default:
        return 'application/octet-stream';
    }
  }

  /**
   * Test email configuration
   */
  static async testConnection(): Promise<boolean> {
    if (!this.transporter) {
      throw new Error('Email service not initialized');
    }
    
    try {
      await this.transporter.verify();
      return true;
    } catch (error) {
      console.error('Email connection test failed:', error);
      return false;
    }
  }
}
