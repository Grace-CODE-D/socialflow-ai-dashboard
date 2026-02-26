# Executive Reporting & Intelligence

This module provides comprehensive reporting capabilities with multi-format export and automated scheduling.

## Features Implemented

### 1. Multi-Format Export Engine

#### PDF Export
- Professional styling with branded headers
- Auto-generated tables for metrics and platform breakdown
- Page numbering and footers
- Uses `jspdf` and `jspdf-autotable` libraries

#### PowerPoint Export
- Multi-slide presentations
- Title slide with report metadata
- Key metrics slide with formatted tables
- Platform breakdown visualization
- Uses `pptxgenjs` library

#### CSV Export
- Structured data export
- Includes all metrics, platform breakdown, and performance trends
- Compatible with Excel and data analysis tools
- Uses `papaparse` library

#### Excel Export
- Multi-sheet workbooks
- Summary sheet with key metrics
- Platform breakdown sheet
- Performance trends sheet
- Uses `xlsx` library

### 2. Scheduled Reporting

#### Schedule Types
- **Daily**: Run reports every day at specified time
- **Weekly**: Run reports on specific day of week
- **Monthly**: Run reports on specific day of month
- **Custom**: Flexible scheduling options

#### Report Configuration
- Report name and description
- Output format selection
- Date range configuration (last 7 days, 30 days, last month, custom)
- Metric selection
- Distribution list assignment
- Active/inactive toggle

### 3. Recipient Management

#### Distribution Lists
- Create named distribution lists
- Add multiple recipients per list
- Activate/deactivate individual recipients
- Reusable across multiple reports

#### Recipient Details
- Name and email address
- Active status tracking
- Easy management interface

### 4. Email Delivery

#### Email Features
- Professional HTML email templates
- Branded styling matching SocialFlow design
- Key metrics summary in email body
- Report attached in requested format
- Delivery tracking and status

#### Email Configuration
- SMTP server configuration
- Authentication support
- Connection testing
- Delivery confirmation

### 5. Delivery Tracking

#### History & Status
- Complete delivery history
- Status tracking (Pending, Generating, Completed, Failed, Delivered)
- Error logging for failed deliveries
- File size tracking
- Timestamp for generation and delivery

## Architecture

### Services

#### ExportService (`services/exportService.ts`)
- Handles all export format generation
- Provides unified interface for different formats
- Manages file downloads
- Blob generation for email attachments

#### ReportScheduler (`services/reportScheduler.ts`)
- Manages scheduled report execution
- Calculates next run times
- Maintains report configurations
- Tracks delivery history
- Handles distribution list management

#### EmailService (`services/emailService.ts`)
- SMTP email delivery
- HTML email template generation
- Attachment handling
- Connection testing

### Components

#### ExecutiveReporting (`components/ExecutiveReporting.tsx`)
- Main UI component
- Tabbed interface for different sections
- Report configuration management
- Distribution list management
- Delivery history view

### Types

All reporting types are defined in `types.ts`:
- `ReportFormat`: PDF, PowerPoint, CSV, Excel
- `ReportSchedule`: Daily, Weekly, Monthly, Custom
- `ReportStatus`: Pending, Generating, Completed, Failed, Delivered
- `ReportConfig`: Report configuration structure
- `ReportDistributionList`: Recipient list structure
- `ReportDelivery`: Delivery tracking structure
- `ReportData`: Report content structure

## Usage

### Creating a Report Configuration

```typescript
const config: ReportConfig = {
  id: 'report-1',
  name: 'Weekly Performance Report',
  description: 'Weekly summary of social media performance',
  format: ReportFormat.PDF,
  schedule: ReportSchedule.WEEKLY,
  scheduleTime: '09:00',
  scheduleDayOfWeek: 1, // Monday
  distributionLists: ['list-1'],
  includeMetrics: ['engagement', 'reach', 'posts'],
  dateRange: 'last7days',
  active: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

ReportScheduler.saveReportConfig(config);
```

### Creating a Distribution List

```typescript
const list: ReportDistributionList = {
  id: 'list-1',
  name: 'Executive Team',
  recipients: [
    {
      id: 'recipient-1',
      name: 'John Doe',
      email: 'john@example.com',
      active: true,
    },
  ],
  createdAt: new Date(),
  updatedAt: new Date(),
};

ReportScheduler.saveDistributionList(list);
```

### Manual Report Generation

```typescript
// Generate and download report
const reportData = await generateReportData();
const blob = await ExportService.exportReport(reportData, ReportFormat.PDF);
ExportService.downloadFile(blob, 'report.pdf');
```

### Email Configuration

```typescript
EmailService.initialize({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: 'your-email@gmail.com',
    pass: 'your-app-password',
  },
});

// Test connection
const isConnected = await EmailService.testConnection();
```

## Dependencies

```json
{
  "jspdf": "^2.5.1",
  "jspdf-autotable": "^3.8.0",
  "pptxgenjs": "^3.12.0",
  "xlsx": "^0.18.5",
  "papaparse": "^5.4.1",
  "nodemailer": "^6.9.7"
}
```

## Future Enhancements

- Custom report templates
- Advanced data visualization in exports
- Report preview before generation
- Webhook delivery option
- Cloud storage integration (S3, Google Drive)
- Report versioning and comparison
- Advanced scheduling (e.g., "last business day of month")
- Multi-language support
- Custom branding per report
- Interactive dashboard widgets

## Security Considerations

- Email credentials should be stored securely (environment variables)
- Validate recipient email addresses
- Implement rate limiting for email delivery
- Add authentication for report access
- Encrypt sensitive report data
- Audit trail for report generation and access

## Testing

To test the reporting features:

1. Navigate to the "Reports" section in the sidebar
2. Create a new report configuration
3. Set up a distribution list with test recipients
4. Generate a report manually to test export formats
5. Activate scheduling to test automated delivery
6. Check delivery history for status tracking

## Support

For issues or questions about the Executive Reporting module, please refer to the main project documentation or contact the development team.
