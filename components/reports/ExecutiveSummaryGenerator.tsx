import React, { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { ReportTemplate, ExecutiveSummary, Platform } from '../../types';

const MaterialIcon = ({ name, className }: { name: string, className?: string }) => (
  <span className={`material-symbols-outlined ${className}`}>{name}</span>
);

interface ExecutiveSummaryGeneratorProps {
  template: ReportTemplate;
}

export const ExecutiveSummaryGenerator: React.FC<ExecutiveSummaryGeneratorProps> = ({ template }) => {
  const [summary, setSummary] = useState<ExecutiveSummary | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const generateSummary = () => {
    setIsGenerating(true);
    
    // Simulate AI generation
    setTimeout(() => {
      const generatedSummary: ExecutiveSummary = {
        keyInsights: [
          'Instagram engagement increased by 23% this month, driven by Reels content',
          'TikTok reach expanded to 450K users, marking the highest growth rate across all platforms',
          'Facebook conversion rate improved to 3.2%, exceeding industry benchmarks',
          'Overall follower growth of 8,500 represents a 12% increase month-over-month',
        ],
        topPerformers: [
          { platform: Platform.TIKTOK, metric: 'Reach', value: 450000, change: 23.5 },
          { platform: Platform.INSTAGRAM, metric: 'Engagement', value: 125000, change: 15.3 },
          { platform: Platform.FACEBOOK, metric: 'Conversions', value: 3200, change: 18.2 },
        ],
        trends: [
          {
            title: 'Video Content Dominance',
            description: 'Short-form video content continues to outperform static posts by 3x in engagement rates',
            impact: 'positive',
          },
          {
            title: 'Audience Shift to Younger Demographics',
            description: '18-24 age group now represents 35% of total audience, up from 28% last quarter',
            impact: 'positive',
          },
          {
            title: 'Weekend Engagement Decline',
            description: 'Saturday and Sunday posts show 15% lower engagement compared to weekdays',
            impact: 'negative',
          },
        ],
        recommendations: [
          'Increase Reels and TikTok content production by 30% to capitalize on high engagement rates',
          'Shift posting schedule to focus on Tuesday-Thursday for optimal reach',
          'Develop targeted campaigns for 18-24 demographic with trending audio and challenges',
          'Implement A/B testing for weekend content to identify engagement drivers',
          'Allocate additional budget to TikTok advertising given strong performance metrics',
        ],
        periodComparison: {
          current: template.filters.dateRange,
          previous: {
            start: new Date(2026, 0, 1),
            end: new Date(2026, 0, 31),
          },
          changes: [
            { metric: 'Total Engagement', change: 15.3 },
            { metric: 'Follower Growth', change: 12.1 },
            { metric: 'Reach', change: 8.7 },
            { metric: 'Conversion Rate', change: 0.5 },
          ],
        },
      };
      
      setSummary(generatedSummary);
      setIsGenerating(false);
    }, 2000);
  };

  useEffect(() => {
    generateSummary();
  }, [template]);

  if (isGenerating) {
    return (
      <Card className="flex flex-col items-center justify-center py-20">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary-blue border-t-transparent mb-6"></div>
        <h3 className="text-xl font-semibold text-white mb-2">Generating Executive Summary</h3>
        <p className="text-gray-subtext">AI is analyzing your data and creating insights...</p>
      </Card>
    );
  }

  if (!summary) return null;

  return (
    <div className="space-y-6">
      {/* Key Insights */}
      <Card>
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-primary-blue/20 rounded-xl">
            <MaterialIcon name="lightbulb" className="text-primary-blue text-2xl" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Key Insights</h3>
            <p className="text-sm text-gray-subtext">AI-generated highlights from your data</p>
          </div>
        </div>
        <div className="space-y-3">
          {summary.keyInsights.map((insight, idx) => (
            <div key={idx} className="flex gap-3 p-4 bg-dark-surface rounded-xl">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary-blue/20 flex items-center justify-center text-primary-blue text-sm font-bold">
                {idx + 1}
              </div>
              <p className="text-white text-sm leading-relaxed">{insight}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* Top Performers */}
      <Card>
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-primary-teal/20 rounded-xl">
            <MaterialIcon name="trending_up" className="text-primary-teal text-2xl" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Top Performers</h3>
            <p className="text-sm text-gray-subtext">Best performing platforms and metrics</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {summary.topPerformers.map((performer, idx) => (
            <div key={idx} className="p-5 bg-dark-surface rounded-xl">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-gray-subtext capitalize">{performer.platform}</span>
                <span className="flex items-center gap-1 text-green-400 text-sm font-semibold">
                  <MaterialIcon name="arrow_upward" className="text-xs" />
                  {performer.change}%
                </span>
              </div>
              <div className="text-2xl font-bold text-white mb-1">
                {performer.value.toLocaleString()}
              </div>
              <div className="text-sm text-gray-subtext">{performer.metric}</div>
            </div>
          ))}
        </div>
      </Card>

      {/* Trends */}
      <Card>
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-purple-500/20 rounded-xl">
            <MaterialIcon name="show_chart" className="text-purple-400 text-2xl" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Trends & Patterns</h3>
            <p className="text-sm text-gray-subtext">Notable trends identified in your data</p>
          </div>
        </div>
        <div className="space-y-4">
          {summary.trends.map((trend, idx) => (
            <div key={idx} className="p-5 bg-dark-surface rounded-xl">
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg ${
                  trend.impact === 'positive' ? 'bg-green-500/20' :
                  trend.impact === 'negative' ? 'bg-red-500/20' : 'bg-gray-500/20'
                }`}>
                  <MaterialIcon
                    name={trend.impact === 'positive' ? 'trending_up' : trend.impact === 'negative' ? 'trending_down' : 'trending_flat'}
                    className={`${
                      trend.impact === 'positive' ? 'text-green-400' :
                      trend.impact === 'negative' ? 'text-red-400' : 'text-gray-400'
                    }`}
                  />
                </div>
                <div className="flex-1">
                  <h4 className="text-white font-semibold mb-2">{trend.title}</h4>
                  <p className="text-gray-subtext text-sm">{trend.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Period Comparison */}
      <Card>
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-orange-500/20 rounded-xl">
            <MaterialIcon name="compare_arrows" className="text-orange-400 text-2xl" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Period-over-Period Comparison</h3>
            <p className="text-sm text-gray-subtext">
              {summary.periodComparison.current.start.toLocaleDateString()} - {summary.periodComparison.current.end.toLocaleDateString()} vs Previous Period
            </p>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {summary.periodComparison.changes.map((change, idx) => (
            <div key={idx} className="p-4 bg-dark-surface rounded-xl">
              <div className="text-sm text-gray-subtext mb-2">{change.metric}</div>
              <div className={`text-2xl font-bold ${change.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {change.change >= 0 ? '+' : ''}{change.change}%
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Recommendations */}
      <Card>
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-primary-blue/20 rounded-xl">
            <MaterialIcon name="auto_awesome" className="text-primary-blue text-2xl" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">AI-Powered Recommendations</h3>
            <p className="text-sm text-gray-subtext">Actionable suggestions to improve performance</p>
          </div>
        </div>
        <div className="space-y-3">
          {summary.recommendations.map((rec, idx) => (
            <div key={idx} className="flex gap-3 p-4 bg-dark-surface rounded-xl hover:bg-gray-700 transition-colors">
              <MaterialIcon name="check_circle" className="text-primary-teal flex-shrink-0" />
              <p className="text-white text-sm leading-relaxed">{rec}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* Regenerate Button */}
      <div className="flex justify-center">
        <button
          onClick={generateSummary}
          className="flex items-center gap-2 bg-primary-blue text-white px-6 py-3 rounded-2xl text-sm font-medium hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/20"
        >
          <MaterialIcon name="refresh" className="text-base" />
          Regenerate Summary
        </button>
      </div>
    </div>
  );
};
