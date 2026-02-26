import React, { useEffect, useState } from 'react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { FileText, Download, Eye, TrendingUp, AlertCircle, Clock } from 'lucide-react';
import { Card } from './ui/Card';
import {
  getReportViews,
  getReportDownloads,
  getPopularMetrics,
  getReportTemplates,
  getReportEngagement,
  generateUsageInsights,
  ReportView,
  ReportDownload,
  MetricPopularity,
  ReportTemplate,
  ReportEngagement,
  UsageInsight
} from '../services/reportAnalyticsService';

export const ReportAnalytics: React.FC = () => {
  const [views, setViews] = useState<ReportView[]>([]);
  const [downloads, setDownloads] = useState<ReportDownload[]>([]);
  const [metrics, setMetrics] = useState<MetricPopularity[]>([]);
  const [templates, setTemplates] = useState<ReportTemplate[]>([]);
  const [engagement, setEngagement] = useState<ReportEngagement[]>([]);
  const [insights, setInsights] = useState<UsageInsight[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const [viewsData, downloadsData, engagementData] = await Promise.all([
        getReportViews(30),
        getReportDownloads(30),
        getReportEngagement()
      ]);
      
      const metricsData = getPopularMetrics();
      const templatesData = getReportTemplates();
      const insightsData = generateUsageInsights(viewsData, downloadsData, templatesData);
      
      setViews(viewsData);
      setDownloads(downloadsData);
      setMetrics(metricsData);
      setTemplates(templatesData);
      setEngagement(engagementData);
      setInsights(insightsData);
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400">Loading report analytics...</div>
      </div>
    );
  }

  // Calculate summary stats
  const totalViews = views.length;
  const totalDownloads = downloads.length;
  const uniqueViewers = new Set(views.map(v => v.viewedBy)).size;
  const avgViewDuration = views.reduce((sum, v) => sum + v.duration, 0) / views.length;

  // Format data for charts
  const formatDistribution = downloads.reduce((acc, d) => {
    acc[d.format] = (acc[d.format] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const formatChartData = Object.entries(formatDistribution).map(([format, count]) => ({
    name: format.toUpperCase(),
    value: count
  }));

  const deviceDistribution = views.reduce((acc, v) => {
    acc[v.device] = (acc[v.device] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const deviceChartData = Object.entries(deviceDistribution).map(([device, count]) => ({
    name: device.charAt(0).toUpperCase() + device.slice(1),
    value: count
  }));

  // Views over time
  const viewsByDay = views.reduce((acc, v) => {
    const date = v.viewedAt.toISOString().split('T')[0];
    acc[date] = (acc[date] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const viewsTimelineData = Object.entries(viewsByDay)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .slice(-14)
    .map(([date, count]) => ({
      date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      views: count
    }));

  const COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

  const getImpactColor = (impact: UsageInsight['impact']) => {
    switch (impact) {
      case 'high': return 'text-red-400 bg-red-400/10';
      case 'medium': return 'text-orange-400 bg-orange-400/10';
      case 'low': return 'text-blue-400 bg-blue-400/10';
    }
  };

  const getInsightIcon = (type: UsageInsight['type']) => {
    switch (type) {
      case 'trend': return <TrendingUp size={20} />;
      case 'anomaly': return <AlertCircle size={20} />;
      case 'recommendation': return <FileText size={20} />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Report Analytics</h2>
          <p className="text-gray-400 mt-1">Track report usage and engagement metrics</p>
        </div>
        <button
          onClick={loadAnalytics}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
        >
          Refresh Data
        </button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gray-800 border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Total Views</p>
              <p className="text-2xl font-bold text-white mt-1">{totalViews}</p>
            </div>
            <Eye className="text-blue-500" size={32} />
          </div>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Total Downloads</p>
              <p className="text-2xl font-bold text-white mt-1">{totalDownloads}</p>
            </div>
            <Download className="text-green-500" size={32} />
          </div>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Unique Viewers</p>
              <p className="text-2xl font-bold text-white mt-1">{uniqueViewers}</p>
            </div>
            <FileText className="text-purple-500" size={32} />
          </div>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Avg View Duration</p>
              <p className="text-2xl font-bold text-white mt-1">{Math.floor(avgViewDuration / 60)}m</p>
              <p className="text-xs text-gray-400 mt-1">{Math.floor(avgViewDuration % 60)}s</p>
            </div>
            <Clock className="text-orange-500" size={32} />
          </div>
        </Card>
      </div>

      {/* Usage Insights */}
      <Card className="bg-gray-800 border-gray-700">
        <h3 className="text-lg font-semibold text-white mb-4">Usage Insights</h3>
        <div className="space-y-3">
          {insights.map((insight, index) => (
            <div key={index} className="flex items-start gap-3 p-3 bg-gray-750 rounded-lg">
              <div className={`p-2 rounded ${getImpactColor(insight.impact)}`}>
                {getInsightIcon(insight.type)}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="text-white font-medium">{insight.title}</h4>
                  <span className={`text-xs px-2 py-1 rounded ${getImpactColor(insight.impact)}`}>
                    {insight.impact.toUpperCase()}
                  </span>
                </div>
                <p className="text-gray-400 text-sm">{insight.description}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-gray-800 border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4">Views Over Time (14 Days)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={viewsTimelineData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="date" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip
                contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }}
                labelStyle={{ color: '#fff' }}
              />
              <Line type="monotone" dataKey="views" stroke="#8b5cf6" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4">Download Formats</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={formatChartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {formatChartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Popular Metrics */}
      <Card className="bg-gray-800 border-gray-700">
        <h3 className="text-lg font-semibold text-white mb-4">Most Popular Metrics</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left py-3 px-4 text-gray-400 font-medium">Metric</th>
                <th className="text-right py-3 px-4 text-gray-400 font-medium">Views</th>
                <th className="text-right py-3 px-4 text-gray-400 font-medium">Included</th>
                <th className="text-right py-3 px-4 text-gray-400 font-medium">Avg Value</th>
                <th className="text-right py-3 px-4 text-gray-400 font-medium">Trend</th>
              </tr>
            </thead>
            <tbody>
              {metrics.map((metric, index) => (
                <tr key={index} className="border-b border-gray-700 hover:bg-gray-750">
                  <td className="py-3 px-4 text-white font-medium">{metric.metricName}</td>
                  <td className="py-3 px-4 text-right text-white">{metric.viewCount}</td>
                  <td className="py-3 px-4 text-right text-white">{metric.includeCount}</td>
                  <td className="py-3 px-4 text-right text-white">
                    {metric.avgValue.toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <span className={`inline-flex items-center gap-1 ${
                      metric.trend === 'up' ? 'text-green-400' :
                      metric.trend === 'down' ? 'text-red-400' : 'text-gray-400'
                    }`}>
                      {metric.trend === 'up' ? '↑' : metric.trend === 'down' ? '↓' : '→'}
                      {metric.trend}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Report Templates */}
      <Card className="bg-gray-800 border-gray-700">
        <h3 className="text-lg font-semibold text-white mb-4">Frequently Used Templates</h3>
        <div className="space-y-3">
          {templates.map((template) => (
            <div key={template.id} className="p-4 bg-gray-750 rounded-lg">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h4 className="text-white font-medium">{template.name}</h4>
                  <p className="text-gray-400 text-sm mt-1">{template.description}</p>
                </div>
                <span className={`px-3 py-1 rounded text-xs font-medium ${
                  template.category === 'performance' ? 'bg-blue-500/20 text-blue-400' :
                  template.category === 'engagement' ? 'bg-purple-500/20 text-purple-400' :
                  template.category === 'financial' ? 'bg-green-500/20 text-green-400' :
                  'bg-gray-500/20 text-gray-400'
                }`}>
                  {template.category}
                </span>
              </div>
              <div className="flex items-center gap-6 text-sm">
                <div className="flex items-center gap-2 text-gray-400">
                  <FileText size={16} />
                  <span>{template.usageCount} uses</span>
                </div>
                <div className="flex items-center gap-2 text-gray-400">
                  <Clock size={16} />
                  <span>{template.avgGenerationTime.toFixed(1)}s avg</span>
                </div>
                <div className="text-gray-400">
                  Last used: {new Date(template.lastUsed).toLocaleDateString()}
                </div>
              </div>
              {template.metrics.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {template.metrics.map((metric, i) => (
                    <span key={i} className="px-2 py-1 bg-gray-700 text-gray-300 text-xs rounded">
                      {metric}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </Card>

      {/* Report Engagement */}
      <Card className="bg-gray-800 border-gray-700">
        <h3 className="text-lg font-semibold text-white mb-4">Report Engagement</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left py-3 px-4 text-gray-400 font-medium">Report</th>
                <th className="text-right py-3 px-4 text-gray-400 font-medium">Views</th>
                <th className="text-right py-3 px-4 text-gray-400 font-medium">Viewers</th>
                <th className="text-right py-3 px-4 text-gray-400 font-medium">Downloads</th>
                <th className="text-right py-3 px-4 text-gray-400 font-medium">Shares</th>
                <th className="text-right py-3 px-4 text-gray-400 font-medium">Comments</th>
                <th className="text-right py-3 px-4 text-gray-400 font-medium">Last Activity</th>
              </tr>
            </thead>
            <tbody>
              {engagement.map((report) => (
                <tr key={report.reportId} className="border-b border-gray-700 hover:bg-gray-750">
                  <td className="py-3 px-4 text-white font-medium">{report.reportName}</td>
                  <td className="py-3 px-4 text-right text-white">{report.totalViews}</td>
                  <td className="py-3 px-4 text-right text-white">{report.uniqueViewers}</td>
                  <td className="py-3 px-4 text-right text-white">{report.totalDownloads}</td>
                  <td className="py-3 px-4 text-right text-white">{report.shareCount}</td>
                  <td className="py-3 px-4 text-right text-white">{report.commentCount}</td>
                  <td className="py-3 px-4 text-right text-gray-400 text-sm">
                    {new Date(report.lastActivity).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
