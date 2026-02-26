// Report Analytics Service for Executive Reporting

export interface ReportView {
  id: string;
  reportId: string;
  reportName: string;
  viewedBy: string;
  viewedAt: Date;
  duration: number; // seconds
  device: 'desktop' | 'mobile' | 'tablet';
}

export interface ReportDownload {
  id: string;
  reportId: string;
  reportName: string;
  format: 'pdf' | 'excel' | 'csv' | 'json';
  downloadedBy: string;
  downloadedAt: Date;
  fileSize: number; // bytes
}

export interface MetricPopularity {
  metricName: string;
  viewCount: number;
  includeCount: number;
  avgValue: number;
  trend: 'up' | 'down' | 'stable';
}

export interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  usageCount: number;
  lastUsed: Date;
  avgGenerationTime: number; // seconds
  metrics: string[];
  category: 'performance' | 'engagement' | 'financial' | 'custom';
}

export interface ReportEngagement {
  reportId: string;
  reportName: string;
  totalViews: number;
  uniqueViewers: number;
  totalDownloads: number;
  avgViewDuration: number;
  shareCount: number;
  commentCount: number;
  lastActivity: Date;
}

export interface UsageInsight {
  type: 'trend' | 'anomaly' | 'recommendation';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  timestamp: Date;
  data?: Record<string, any>;
}

// Mock data generators
const generateMockReportViews = (count: number): ReportView[] => {
  const reports = ['Q4 Performance', 'Monthly Analytics', 'Engagement Report', 'Financial Summary'];
  const users = ['john@company.com', 'sarah@company.com', 'mike@company.com', 'lisa@company.com'];
  const devices: ('desktop' | 'mobile' | 'tablet')[] = ['desktop', 'mobile', 'tablet'];
  
  return Array.from({ length: count }, (_, i) => ({
    id: `view_${i}_${Date.now()}`,
    reportId: `report_${Math.floor(Math.random() * 10)}`,
    reportName: reports[Math.floor(Math.random() * reports.length)],
    viewedBy: users[Math.floor(Math.random() * users.length)],
    viewedAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
    duration: Math.floor(Math.random() * 600) + 30,
    device: devices[Math.floor(Math.random() * devices.length)]
  }));
};

const generateMockDownloads = (count: number): ReportDownload[] => {
  const reports = ['Q4 Performance', 'Monthly Analytics', 'Engagement Report', 'Financial Summary'];
  const users = ['john@company.com', 'sarah@company.com', 'mike@company.com', 'lisa@company.com'];
  const formats: ('pdf' | 'excel' | 'csv' | 'json')[] = ['pdf', 'excel', 'csv', 'json'];
  
  return Array.from({ length: count }, (_, i) => ({
    id: `download_${i}_${Date.now()}`,
    reportId: `report_${Math.floor(Math.random() * 10)}`,
    reportName: reports[Math.floor(Math.random() * reports.length)],
    format: formats[Math.floor(Math.random() * formats.length)],
    downloadedBy: users[Math.floor(Math.random() * users.length)],
    downloadedAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
    fileSize: Math.floor(Math.random() * 5000000) + 100000
  }));
};

export const trackReportView = async (reportId: string, userId: string): Promise<void> => {
  await new Promise(resolve => setTimeout(resolve, 100));
  console.log(`Tracked view: Report ${reportId} by ${userId}`);
};

export const trackReportDownload = async (
  reportId: string,
  userId: string,
  format: ReportDownload['format']
): Promise<void> => {
  await new Promise(resolve => setTimeout(resolve, 100));
  console.log(`Tracked download: Report ${reportId} as ${format} by ${userId}`);
};

export const getReportViews = async (days: number = 30): Promise<ReportView[]> => {
  await new Promise(resolve => setTimeout(resolve, 300));
  return generateMockReportViews(150);
};

export const getReportDownloads = async (days: number = 30): Promise<ReportDownload[]> => {
  await new Promise(resolve => setTimeout(resolve, 300));
  return generateMockDownloads(80);
};

export const getPopularMetrics = (): MetricPopularity[] => {
  const metrics = [
    { name: 'Total Revenue', viewCount: 450, includeCount: 380, avgValue: 125000, trend: 'up' as const },
    { name: 'Engagement Rate', viewCount: 420, includeCount: 350, avgValue: 68.5, trend: 'up' as const },
    { name: 'User Growth', viewCount: 390, includeCount: 320, avgValue: 15.2, trend: 'stable' as const },
    { name: 'Conversion Rate', viewCount: 360, includeCount: 290, avgValue: 3.8, trend: 'down' as const },
    { name: 'Customer Lifetime Value', viewCount: 340, includeCount: 270, avgValue: 2400, trend: 'up' as const },
    { name: 'Churn Rate', viewCount: 310, includeCount: 250, avgValue: 5.2, trend: 'down' as const },
    { name: 'Average Order Value', viewCount: 280, includeCount: 230, avgValue: 85, trend: 'stable' as const },
    { name: 'Social Media Reach', viewCount: 250, includeCount: 200, avgValue: 45000, trend: 'up' as const }
  ];
  
  return metrics;
};

export const getReportTemplates = (): ReportTemplate[] => {
  return [
    {
      id: 'template_1',
      name: 'Executive Summary',
      description: 'High-level overview of key business metrics',
      usageCount: 145,
      lastUsed: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      avgGenerationTime: 3.5,
      metrics: ['Total Revenue', 'User Growth', 'Engagement Rate'],
      category: 'performance'
    },
    {
      id: 'template_2',
      name: 'Social Media Performance',
      description: 'Detailed social media analytics and engagement',
      usageCount: 128,
      lastUsed: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      avgGenerationTime: 4.2,
      metrics: ['Engagement Rate', 'Social Media Reach', 'Conversion Rate'],
      category: 'engagement'
    },
    {
      id: 'template_3',
      name: 'Financial Report',
      description: 'Comprehensive financial metrics and trends',
      usageCount: 98,
      lastUsed: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      avgGenerationTime: 5.8,
      metrics: ['Total Revenue', 'Average Order Value', 'Customer Lifetime Value'],
      category: 'financial'
    },
    {
      id: 'template_4',
      name: 'Customer Analytics',
      description: 'Customer behavior and retention metrics',
      usageCount: 87,
      lastUsed: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      avgGenerationTime: 4.5,
      metrics: ['Churn Rate', 'Customer Lifetime Value', 'Conversion Rate'],
      category: 'performance'
    },
    {
      id: 'template_5',
      name: 'Custom Dashboard',
      description: 'Fully customizable report template',
      usageCount: 65,
      lastUsed: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      avgGenerationTime: 6.2,
      metrics: [],
      category: 'custom'
    }
  ];
};

export const getReportEngagement = async (): Promise<ReportEngagement[]> => {
  await new Promise(resolve => setTimeout(resolve, 300));
  
  const reports = ['Q4 Performance', 'Monthly Analytics', 'Engagement Report', 'Financial Summary', 'Customer Insights'];
  
  return reports.map((name, i) => ({
    reportId: `report_${i}`,
    reportName: name,
    totalViews: Math.floor(Math.random() * 500) + 100,
    uniqueViewers: Math.floor(Math.random() * 50) + 20,
    totalDownloads: Math.floor(Math.random() * 100) + 20,
    avgViewDuration: Math.floor(Math.random() * 300) + 60,
    shareCount: Math.floor(Math.random() * 30) + 5,
    commentCount: Math.floor(Math.random() * 20),
    lastActivity: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000)
  }));
};

export const generateUsageInsights = (
  views: ReportView[],
  downloads: ReportDownload[],
  templates: ReportTemplate[]
): UsageInsight[] => {
  const insights: UsageInsight[] = [];
  
  // Trend: Most active time
  const hourCounts = new Array(24).fill(0);
  views.forEach(v => hourCounts[v.viewedAt.getHours()]++);
  const peakHour = hourCounts.indexOf(Math.max(...hourCounts));
  
  insights.push({
    type: 'trend',
    title: 'Peak Usage Time',
    description: `Most reports are viewed around ${peakHour}:00. Consider scheduling automated reports for this time.`,
    impact: 'medium',
    timestamp: new Date()
  });
  
  // Trend: Popular format
  const formatCounts = downloads.reduce((acc, d) => {
    acc[d.format] = (acc[d.format] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const popularFormat = Object.entries(formatCounts).sort((a, b) => b[1] - a[1])[0];
  
  insights.push({
    type: 'trend',
    title: 'Preferred Export Format',
    description: `${popularFormat[0].toUpperCase()} is the most downloaded format (${popularFormat[1]} downloads). Optimize for this format.`,
    impact: 'low',
    timestamp: new Date()
  });
  
  // Recommendation: Template usage
  const topTemplate = templates.sort((a, b) => b.usageCount - a.usageCount)[0];
  
  insights.push({
    type: 'recommendation',
    title: 'Popular Template',
    description: `"${topTemplate.name}" is your most used template. Consider creating similar templates for other use cases.`,
    impact: 'medium',
    timestamp: new Date(),
    data: { templateId: topTemplate.id, usageCount: topTemplate.usageCount }
  });
  
  // Anomaly: Low engagement
  const avgDuration = views.reduce((sum, v) => sum + v.duration, 0) / views.length;
  const shortViews = views.filter(v => v.duration < avgDuration * 0.3).length;
  
  if (shortViews > views.length * 0.2) {
    insights.push({
      type: 'anomaly',
      title: 'Low Engagement Detected',
      description: `${((shortViews / views.length) * 100).toFixed(1)}% of report views are very short. Users may not be finding what they need.`,
      impact: 'high',
      timestamp: new Date()
    });
  }
  
  // Recommendation: Mobile optimization
  const mobileViews = views.filter(v => v.device === 'mobile').length;
  const mobilePercentage = (mobileViews / views.length) * 100;
  
  if (mobilePercentage > 30) {
    insights.push({
      type: 'recommendation',
      title: 'Mobile Optimization',
      description: `${mobilePercentage.toFixed(1)}% of views are from mobile devices. Ensure reports are mobile-friendly.`,
      impact: 'high',
      timestamp: new Date()
    });
  }
  
  return insights.sort((a, b) => {
    const impactOrder = { high: 3, medium: 2, low: 1 };
    return impactOrder[b.impact] - impactOrder[a.impact];
  });
};
