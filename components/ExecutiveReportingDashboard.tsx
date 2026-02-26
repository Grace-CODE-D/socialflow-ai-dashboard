import React, { useState, useEffect } from 'react';
import { FileText, Download, Share2, Eye, Settings, TrendingUp } from 'lucide-react';
import { Card } from './ui/Card';
import {
  getReportTemplates,
  generateExecutiveReport,
  exportReport,
  generateShareableLink,
  ReportTemplate,
  ExecutiveReport,
  ExportOptions
} from '../services/executiveReportingService';

export const ExecutiveReportingDashboard: React.FC = () => {
  const [templates, setTemplates] = useState<ReportTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<ReportTemplate | null>(null);
  const [report, setReport] = useState<ExecutiveReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [customizations, setCustomizations] = useState({
    title: '',
    subtitle: '',
    includeCharts: true,
    includeSummary: true,
    includeRecommendations: true
  });

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = () => {
    const templateList = getReportTemplates();
    setTemplates(templateList);
    setSelectedTemplate(templateList[0]);
  };

  const handleGenerateReport = async () => {
    if (!selectedTemplate) return;
    
    setLoading(true);
    try {
      const generatedReport = await generateExecutiveReport(selectedTemplate.id, {
        title: customizations.title || selectedTemplate.name,
        subtitle: customizations.subtitle
      });
      setReport(generatedReport);
      setShowPreview(true);
    } catch (error) {
      console.error('Failed to generate report:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format: ExportOptions['format']) => {
    if (!report) return;
    
    setExporting(true);
    try {
      const options: ExportOptions = {
        format,
        includeCharts: customizations.includeCharts,
        includeSummary: customizations.includeSummary,
        includeRecommendations: customizations.includeRecommendations,
        branding: {
          companyName: 'SocialFlow'
        }
      };
      
      const result = await exportReport(report, options);
      if (result.success) {
        alert(`Report exported successfully! Download URL: ${result.url}`);
      }
    } catch (error) {
      console.error('Failed to export report:', error);
    } finally {
      setExporting(false);
    }
  };

  const handleShare = async () => {
    if (!report) return;
    
    try {
      const shareUrl = await generateShareableLink(report.id);
      navigator.clipboard.writeText(shareUrl);
      alert(`Shareable link copied to clipboard: ${shareUrl}`);
    } catch (error) {
      console.error('Failed to generate share link:', error);
    }
  };

  const formatMetricValue = (value: number | string, format: string) => {
    if (typeof value === 'string') return value;
    
    switch (format) {
      case 'currency':
        return `$${value.toLocaleString()}`;
      case 'percentage':
        return `${value.toFixed(1)}%`;
      case 'number':
        return value.toLocaleString();
      default:
        return value;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Executive Reporting</h2>
          <p className="text-gray-400 mt-1">Generate professional reports for stakeholders</p>
        </div>
        {report && (
          <div className="flex gap-2">
            <button
              onClick={() => handleExport('pdf')}
              disabled={exporting}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
            >
              <Download size={18} />
              PDF
            </button>
            <button
              onClick={() => handleExport('pptx')}
              disabled={exporting}
              className="flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors disabled:opacity-50"
            >
              <Download size={18} />
              PowerPoint
            </button>
            <button
              onClick={handleShare}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
            >
              <Share2 size={18} />
              Share
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Template Selection & Customization */}
        <Card className="bg-gray-800 border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Settings size={20} />
            Report Configuration
          </h3>
          
          <div className="space-y-4">
            {/* Template Selector */}
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Select Template
              </label>
              <select
                value={selectedTemplate?.id || ''}
                onChange={(e) => {
                  const template = templates.find(t => t.id === e.target.value);
                  setSelectedTemplate(template || null);
                }}
                className="w-full px-3 py-2 bg-gray-750 text-white rounded-lg border border-gray-700 focus:outline-none focus:border-purple-500"
              >
                {templates.map(template => (
                  <option key={template.id} value={template.id}>
                    {template.name}
                  </option>
                ))}
              </select>
              {selectedTemplate && (
                <p className="text-xs text-gray-400 mt-1">{selectedTemplate.description}</p>
              )}
            </div>

            {/* Customization Controls */}
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Report Title
              </label>
              <input
                type="text"
                value={customizations.title}
                onChange={(e) => setCustomizations({ ...customizations, title: e.target.value })}
                placeholder={selectedTemplate?.name || 'Enter title'}
                className="w-full px-3 py-2 bg-gray-750 text-white rounded-lg border border-gray-700 focus:outline-none focus:border-purple-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Subtitle
              </label>
              <input
                type="text"
                value={customizations.subtitle}
                onChange={(e) => setCustomizations({ ...customizations, subtitle: e.target.value })}
                placeholder="Optional subtitle"
                className="w-full px-3 py-2 bg-gray-750 text-white rounded-lg border border-gray-700 focus:outline-none focus:border-purple-500"
              />
            </div>

            {/* Include Options */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm text-gray-300">
                <input
                  type="checkbox"
                  checked={customizations.includeCharts}
                  onChange={(e) => setCustomizations({ ...customizations, includeCharts: e.target.checked })}
                  className="rounded"
                />
                Include Charts
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-300">
                <input
                  type="checkbox"
                  checked={customizations.includeSummary}
                  onChange={(e) => setCustomizations({ ...customizations, includeSummary: e.target.checked })}
                  className="rounded"
                />
                Include Executive Summary
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-300">
                <input
                  type="checkbox"
                  checked={customizations.includeRecommendations}
                  onChange={(e) => setCustomizations({ ...customizations, includeRecommendations: e.target.checked })}
                  className="rounded"
                />
                Include Recommendations
              </label>
            </div>

            <button
              onClick={handleGenerateReport}
              disabled={loading || !selectedTemplate}
              className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? 'Generating...' : (
                <>
                  <FileText size={18} />
                  Generate Report
                </>
              )}
            </button>
          </div>
        </Card>

        {/* Report Preview */}
        <div className="lg:col-span-2">
          {!report ? (
            <Card className="bg-gray-800 border-gray-700 h-full flex items-center justify-center">
              <div className="text-center text-gray-400">
                <Eye size={48} className="mx-auto mb-4 opacity-50" />
                <p>Select a template and generate a report to see preview</p>
              </div>
            </Card>
          ) : (
            <div className="space-y-4">
              {/* Report Header */}
              <Card className="bg-gray-800 border-gray-700">
                <div className="border-b border-gray-700 pb-4 mb-4">
                  <h1 className="text-2xl font-bold text-white">{report.title}</h1>
                  <p className="text-gray-400 mt-1">{report.subtitle}</p>
                  <p className="text-xs text-gray-500 mt-2">
                    Generated: {report.generatedAt.toLocaleString()}
                  </p>
                </div>

                {/* Executive Summary */}
                {customizations.includeSummary && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-white mb-3">Executive Summary</h3>
                    <p className="text-gray-300 leading-relaxed">{report.summary}</p>
                  </div>
                )}

                {/* Key Metrics */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-white mb-3">Key Metrics</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {report.data.metrics.map((metric, index) => (
                      <div key={index} className="p-4 bg-gray-750 rounded-lg">
                        <p className="text-xs text-gray-400 mb-1">{metric.name}</p>
                        <p className="text-xl font-bold text-white">
                          {formatMetricValue(metric.value, metric.format)}
                        </p>
                        <div className="flex items-center gap-1 mt-1">
                          <span className={`text-xs ${
                            metric.trend === 'up' ? 'text-green-400' :
                            metric.trend === 'down' ? 'text-red-400' : 'text-gray-400'
                          }`}>
                            {metric.trend === 'up' ? '↑' : metric.trend === 'down' ? '↓' : '→'}
                            {Math.abs(metric.change)}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Key Insights */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                    <TrendingUp size={20} />
                    Key Insights
                  </h3>
                  <ul className="space-y-2">
                    {report.keyInsights.map((insight, index) => (
                      <li key={index} className="flex items-start gap-2 text-gray-300">
                        <span className="text-purple-400 mt-1">•</span>
                        <span>{insight}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Recommendations */}
                {customizations.includeRecommendations && (
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-3">Recommendations</h3>
                    <ul className="space-y-2">
                      {report.recommendations.map((rec, index) => (
                        <li key={index} className="flex items-start gap-2 text-gray-300">
                          <span className="text-blue-400 mt-1">→</span>
                          <span>{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </Card>

              {/* Charts Preview */}
              {customizations.includeCharts && report.data.charts.length > 0 && (
                <Card className="bg-gray-800 border-gray-700">
                  <h3 className="text-lg font-semibold text-white mb-4">Visualizations</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {report.data.charts.map((chart, index) => (
                      <div key={index} className="p-4 bg-gray-750 rounded-lg">
                        <p className="text-sm font-medium text-white mb-2">{chart.title}</p>
                        <div className="h-32 flex items-center justify-center text-gray-500 border border-gray-700 rounded">
                          [{chart.type.toUpperCase()} CHART]
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {/* Tables Preview */}
              {report.data.tables.length > 0 && (
                <Card className="bg-gray-800 border-gray-700">
                  <h3 className="text-lg font-semibold text-white mb-4">Data Tables</h3>
                  {report.data.tables.map((table, index) => (
                    <div key={index} className="mb-4 last:mb-0">
                      <p className="text-sm font-medium text-white mb-2">{table.title}</p>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-gray-700">
                              {table.headers.map((header, i) => (
                                <th key={i} className="text-left py-2 px-3 text-gray-400 font-medium">
                                  {header}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {table.rows.map((row, i) => (
                              <tr key={i} className="border-b border-gray-700">
                                {row.map((cell, j) => (
                                  <td key={j} className="py-2 px-3 text-gray-300">
                                    {cell}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))}
                </Card>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
