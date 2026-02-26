import React from 'react';
import { Card } from '../ui/Card';
import { ReportTemplate } from '../../types';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

const MaterialIcon = ({ name, className }: { name: string, className?: string }) => (
  <span className={`material-symbols-outlined ${className}`}>{name}</span>
);

interface ReportPreviewProps {
  template: ReportTemplate;
}

const mockChartData = [
  { name: 'Week 1', value: 4000, engagement: 2400 },
  { name: 'Week 2', value: 3000, engagement: 1398 },
  { name: 'Week 3', value: 2000, engagement: 9800 },
  { name: 'Week 4', value: 2780, engagement: 3908 },
];

export const ReportPreview: React.FC<ReportPreviewProps> = ({ template }) => {
  const enabledMetrics = template.metrics.filter(m => m.enabled);

  return (
    <div className="max-w-5xl mx-auto">
      <Card className="p-8">
        {/* Report Header with Branding */}
        <div className="border-b border-gray-700 pb-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            {template.branding.logo ? (
              <img src={template.branding.logo} alt="Logo" className="h-12" />
            ) : (
              <div
                className="px-6 py-3 rounded-xl font-bold text-xl"
                style={{ backgroundColor: template.branding.primaryColor }}
              >
                {template.branding.companyName}
              </div>
            )}
            <div className="text-right">
              <div className="text-sm text-gray-subtext">Report Period</div>
              <div className="text-white font-semibold">
                {template.filters.dateRange.start.toLocaleDateString()} - {template.filters.dateRange.end.toLocaleDateString()}
              </div>
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white">{template.name}</h1>
        </div>

        {/* Render Sections in Order */}
        <div className="space-y-8">
          {template.sections
            .sort((a, b) => a.order - b.order)
            .map((section) => (
              <div key={section.id} className="report-section">
                <h2
                  className="text-xl font-bold mb-4 pb-2 border-b"
                  style={{ color: template.branding.primaryColor, borderColor: template.branding.primaryColor + '40' }}
                >
                  {section.title}
                </h2>

                {section.type === 'summary' && (
                  <div className="bg-dark-surface p-6 rounded-xl">
                    <p className="text-white leading-relaxed mb-4">
                      This executive summary provides a comprehensive overview of social media performance for the reporting period.
                      Key metrics show strong growth across all platforms with notable improvements in engagement and reach.
                    </p>
                    <div className="grid grid-cols-3 gap-4 mt-6">
                      <div className="text-center">
                        <div className="text-3xl font-bold text-primary-teal">+15.3%</div>
                        <div className="text-sm text-gray-subtext mt-1">Engagement Growth</div>
                      </div>
                      <div className="text-center">
                        <div className="text-3xl font-bold text-primary-blue">+12.1%</div>
                        <div className="text-sm text-gray-subtext mt-1">Follower Growth</div>
                      </div>
                      <div className="text-center">
                        <div className="text-3xl font-bold text-purple-400">+8.7%</div>
                        <div className="text-sm text-gray-subtext mt-1">Reach Growth</div>
                      </div>
                    </div>
                  </div>
                )}

                {section.type === 'metrics' && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {enabledMetrics.map((metric) => (
                      <div key={metric.id} className="bg-dark-surface p-5 rounded-xl">
                        <div className="text-sm text-gray-subtext mb-2">{metric.name}</div>
                        <div className="text-2xl font-bold text-white mb-1">
                          {typeof metric.value === 'number' ? metric.value.toLocaleString() : metric.value}
                        </div>
                        {metric.change !== undefined && (
                          <div className={`flex items-center gap-1 text-sm font-semibold ${
                            metric.change >= 0 ? 'text-green-400' : 'text-red-400'
                          }`}>
                            <MaterialIcon name={metric.change >= 0 ? 'arrow_upward' : 'arrow_downward'} className="text-xs" />
                            {Math.abs(metric.change)}%
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {section.type === 'chart' && (
                  <div className="bg-dark-surface p-6 rounded-xl">
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={mockChartData}>
                          <defs>
                            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor={template.branding.primaryColor} stopOpacity={0.3}/>
                              <stop offset="95%" stopColor={template.branding.primaryColor} stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#8892b0'}} />
                          <YAxis axisLine={false} tickLine={false} tick={{fill: '#8892b0'}} />
                          <Tooltip contentStyle={{ backgroundColor: '#161b22', borderColor: '#334155', borderRadius: '12px' }} />
                          <Area
                            type="monotone"
                            dataKey="value"
                            stroke={template.branding.primaryColor}
                            strokeWidth={3}
                            fillOpacity={1}
                            fill="url(#colorValue)"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}

                {section.type === 'text' && (
                  <div className="bg-dark-surface p-6 rounded-xl">
                    <p className="text-white leading-relaxed">
                      {section.config?.content || 'Add your custom analysis and commentary here. This section can be used for detailed explanations, strategic insights, or any additional context you want to provide to stakeholders.'}
                    </p>
                  </div>
                )}
              </div>
            ))}
        </div>

        {/* Report Footer */}
        <div className="mt-12 pt-6 border-t border-gray-700 text-center">
          <p className="text-sm text-gray-subtext">
            Generated by {template.branding.companyName} • {new Date().toLocaleDateString()}
          </p>
        </div>
      </Card>
    </div>
  );
};
