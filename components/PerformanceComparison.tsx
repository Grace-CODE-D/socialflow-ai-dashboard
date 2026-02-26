import React, { useState, useEffect } from 'react';

export interface PerformanceMetrics {
  followers: number;
  engagement: number;
  walletValue: number;
  xlmSpent: number;
  posts: number;
  rewardsDistributed: number;
}

export interface PeriodComparison {
  current: PerformanceMetrics;
  previous: PerformanceMetrics;
  changes: {
    followers: { value: number; percentage: number; trend: 'up' | 'down' | 'stable' };
    engagement: { value: number; percentage: number; trend: 'up' | 'down' | 'stable' };
    walletValue: { value: number; percentage: number; trend: 'up' | 'down' | 'stable' };
    xlmSpent: { value: number; percentage: number; trend: 'up' | 'down' | 'stable' };
    posts: { value: number; percentage: number; trend: 'up' | 'down' | 'stable' };
    rewardsDistributed: { value: number; percentage: number; trend: 'up' | 'down' | 'stable' };
  };
  insights: string[];
}

export interface BenchmarkData {
  metric: string;
  yourValue: number;
  industryAverage: number;
  topPerformers: number;
  status: 'above' | 'average' | 'below';
}

const calculateTrend = (percentage: number): 'up' | 'down' | 'stable' => {
  if (percentage > 2) return 'up';
  if (percentage < -2) return 'down';
  return 'stable';
};

const calculateChange = (current: number, previous: number) => {
  const value = current - previous;
  const percentage = previous === 0 ? 0 : ((current - previous) / previous) * 100;
  return { value, percentage, trend: calculateTrend(percentage) };
};

export const usePerformanceComparison = (timeRange: '7d' | '30d') => {
  const [comparison, setComparison] = useState<PeriodComparison | null>(null);
  const [benchmarks, setBenchmarks] = useState<BenchmarkData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadComparison();
  }, [timeRange]);

  const loadComparison = async () => {
    setLoading(true);
    
    // Mock data - replace with actual API calls
    const current: PerformanceMetrics = {
      followers: 125000,
      engagement: 4.8,
      walletValue: 15420.50,
      xlmSpent: 245.30,
      posts: 42,
      rewardsDistributed: 1250.00
    };

    const previous: PerformanceMetrics = {
      followers: 118000,
      engagement: 4.2,
      walletValue: 14200.00,
      xlmSpent: 280.50,
      posts: 38,
      rewardsDistributed: 1100.00
    };

    const changes = {
      followers: calculateChange(current.followers, previous.followers),
      engagement: calculateChange(current.engagement, previous.engagement),
      walletValue: calculateChange(current.walletValue, previous.walletValue),
      xlmSpent: calculateChange(current.xlmSpent, previous.xlmSpent),
      posts: calculateChange(current.posts, previous.posts),
      rewardsDistributed: calculateChange(current.rewardsDistributed, previous.rewardsDistributed)
    };

    const insights = generateInsights(changes);

    setComparison({ current, previous, changes, insights });

    // Load benchmarks
    setBenchmarks([
      { metric: 'Engagement Rate', yourValue: 4.8, industryAverage: 3.5, topPerformers: 6.2, status: 'above' },
      { metric: 'Follower Growth', yourValue: 5.9, industryAverage: 4.2, topPerformers: 8.5, status: 'above' },
      { metric: 'Post Frequency', yourValue: 6, industryAverage: 5, topPerformers: 10, status: 'above' },
      { metric: 'Reward Efficiency', yourValue: 5.1, industryAverage: 4.8, topPerformers: 7.2, status: 'above' }
    ]);

    setLoading(false);
  };

  const generateInsights = (changes: PeriodComparison['changes']): string[] => {
    const insights: string[] = [];

    if (changes.followers.trend === 'up') {
      insights.push(`Follower growth increased by ${changes.followers.percentage.toFixed(1)}% - great momentum!`);
    }
    if (changes.engagement.trend === 'up') {
      insights.push(`Engagement rate improved by ${changes.engagement.percentage.toFixed(1)}% - content resonating well.`);
    }
    if (changes.xlmSpent.trend === 'down') {
      insights.push(`Promotion spending decreased by ${Math.abs(changes.xlmSpent.percentage).toFixed(1)}% - more efficient campaigns.`);
    }
    if (changes.walletValue.trend === 'up') {
      insights.push(`Wallet value grew by ${changes.walletValue.percentage.toFixed(1)}% - strong asset performance.`);
    }
    if (changes.posts.trend === 'up') {
      insights.push(`Content output increased by ${changes.posts.percentage.toFixed(1)}% - maintaining consistency.`);
    }

    return insights.length > 0 ? insights : ['Performance is stable across all metrics.'];
  };

  return { comparison, benchmarks, loading };
};

interface PerformanceComparisonProps {
  timeRange: '7d' | '30d';
}

export const PerformanceComparison: React.FC<PerformanceComparisonProps> = ({ timeRange }) => {
  const { comparison, benchmarks, loading } = usePerformanceComparison(timeRange);

  if (loading || !comparison) {
    return <div className="animate-pulse bg-dark-surface rounded-xl h-64" />;
  }

  const TrendIcon = ({ trend }: { trend: 'up' | 'down' | 'stable' }) => {
    if (trend === 'up') return <span className="text-green-400">↑</span>;
    if (trend === 'down') return <span className="text-red-400">↓</span>;
    return <span className="text-gray-400">→</span>;
  };

  return (
    <div className="space-y-6">
      {/* Period Comparison */}
      <div className="bg-dark-surface rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">
          Period Comparison: Current vs Previous {timeRange === '7d' ? '7 Days' : '30 Days'}
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {Object.entries(comparison.changes).map(([key, change]) => (
            <div key={key} className="bg-dark-bg rounded-lg p-4">
              <p className="text-sm text-gray-subtext capitalize mb-1">
                {key.replace(/([A-Z])/g, ' $1').trim()}
              </p>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-white">
                  {change.percentage >= 0 ? '+' : ''}{change.percentage.toFixed(1)}%
                </span>
                <TrendIcon trend={change.trend} />
              </div>
              <p className="text-xs text-gray-subtext mt-1">
                {change.value >= 0 ? '+' : ''}{change.value.toFixed(2)}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Insights */}
      <div className="bg-dark-surface rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Performance Insights</h3>
        <div className="space-y-3">
          {comparison.insights.map((insight, idx) => (
            <div key={idx} className="flex items-start gap-3 p-3 bg-dark-bg rounded-lg">
              <span className="text-primary-blue">💡</span>
              <p className="text-sm text-gray-300">{insight}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Benchmark Comparison */}
      <div className="bg-dark-surface rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Industry Benchmarks</h3>
        <div className="space-y-4">
          {benchmarks.map((benchmark) => (
            <div key={benchmark.metric}>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-white">{benchmark.metric}</span>
                <span className={`text-xs px-2 py-1 rounded ${
                  benchmark.status === 'above' ? 'bg-green-500/20 text-green-400' :
                  benchmark.status === 'average' ? 'bg-yellow-500/20 text-yellow-400' :
                  'bg-red-500/20 text-red-400'
                }`}>
                  {benchmark.status === 'above' ? 'Above Average' : 
                   benchmark.status === 'average' ? 'Average' : 'Below Average'}
                </span>
              </div>
              <div className="relative h-8 bg-dark-bg rounded-lg overflow-hidden">
                <div 
                  className="absolute h-full bg-gray-700 rounded-lg"
                  style={{ width: `${(benchmark.industryAverage / benchmark.topPerformers) * 100}%` }}
                />
                <div 
                  className="absolute h-full bg-primary-blue rounded-lg"
                  style={{ width: `${(benchmark.yourValue / benchmark.topPerformers) * 100}%` }}
                />
                <div className="absolute inset-0 flex items-center justify-between px-3 text-xs">
                  <span className="text-white font-semibold">{benchmark.yourValue.toFixed(1)}</span>
                  <span className="text-gray-400">Avg: {benchmark.industryAverage.toFixed(1)}</span>
                  <span className="text-gray-500">Top: {benchmark.topPerformers.toFixed(1)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
