import React, { useEffect, useState } from 'react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Wallet, TrendingUp, Users, DollarSign } from 'lucide-react';
import { Card } from './ui/Card';
import { analyzeAudienceWealth, AudienceWealthMetrics } from '../services/walletAnalyticsService';

const COLORS = {
  whale: '#8b5cf6',
  dolphin: '#3b82f6',
  shrimp: '#10b981'
};

export const AudienceWealthAnalytics: React.FC = () => {
  const [metrics, setMetrics] = useState<AudienceWealthMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWealthData();
  }, []);

  const loadWealthData = async () => {
    setLoading(true);
    try {
      // Mock follower IDs - replace with actual follower data
      const followerIds = Array.from({ length: 500 }, (_, i) => `follower_${i}`);
      const data = await analyzeAudienceWealth(followerIds);
      setMetrics(data);
    } catch (error) {
      console.error('Failed to load wealth data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400">Loading wallet analytics...</div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400">Failed to load analytics</div>
      </div>
    );
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const segmentChartData = metrics.segments.map(s => ({
    name: s.tier.charAt(0).toUpperCase() + s.tier.slice(1),
    count: s.count,
    engagement: s.engagementRate,
    conversion: s.conversionRate
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Audience Wealth Analytics</h2>
          <p className="text-gray-400 mt-1">Track and analyze your audience's crypto portfolio data</p>
        </div>
        <button
          onClick={loadWealthData}
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
              <p className="text-gray-400 text-sm">Total Wallets</p>
              <p className="text-2xl font-bold text-white mt-1">{metrics.totalWallets.toLocaleString()}</p>
            </div>
            <Wallet className="text-purple-500" size={32} />
          </div>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Avg Portfolio Value</p>
              <p className="text-2xl font-bold text-white mt-1">{formatCurrency(metrics.averagePortfolioValue)}</p>
            </div>
            <DollarSign className="text-green-500" size={32} />
          </div>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Whales</p>
              <p className="text-2xl font-bold text-white mt-1">{metrics.segments[0].count}</p>
              <p className="text-xs text-purple-400 mt-1">$100K+ portfolios</p>
            </div>
            <Users className="text-purple-500" size={32} />
          </div>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Top Token</p>
              <p className="text-2xl font-bold text-white mt-1">{metrics.commonTokens[0]?.symbol || 'N/A'}</p>
              <p className="text-xs text-blue-400 mt-1">{metrics.commonTokens[0]?.holders || 0} holders</p>
            </div>
            <TrendingUp className="text-blue-500" size={32} />
          </div>
        </Card>
      </div>

      {/* Wealth Trends Chart */}
      <Card className="bg-gray-800 border-gray-700">
        <h3 className="text-lg font-semibold text-white mb-4">Portfolio Value Trends (30 Days)</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={metrics.wealthTrends}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="date" stroke="#9ca3af" />
            <YAxis stroke="#9ca3af" tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} />
            <Tooltip
              contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }}
              labelStyle={{ color: '#fff' }}
              formatter={(value: number) => [formatCurrency(value), 'Avg Value']}
            />
            <Line type="monotone" dataKey="avgValue" stroke="#8b5cf6" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      {/* Wealth Segmentation */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-gray-800 border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4">Wealth Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={segmentChartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, count }) => `${name}: ${count}`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="count"
              >
                {segmentChartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[entry.name.toLowerCase() as keyof typeof COLORS]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4">Engagement by Wealth Segment</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={segmentChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="name" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip
                contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }}
                labelStyle={{ color: '#fff' }}
              />
              <Legend />
              <Bar dataKey="engagement" fill="#3b82f6" name="Engagement Rate %" />
              <Bar dataKey="conversion" fill="#10b981" name="Conversion Rate %" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Segment Details Table */}
      <Card className="bg-gray-800 border-gray-700">
        <h3 className="text-lg font-semibold text-white mb-4">Wealth Segment Details</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left py-3 px-4 text-gray-400 font-medium">Tier</th>
                <th className="text-left py-3 px-4 text-gray-400 font-medium">Portfolio Range</th>
                <th className="text-right py-3 px-4 text-gray-400 font-medium">Count</th>
                <th className="text-right py-3 px-4 text-gray-400 font-medium">Engagement Rate</th>
                <th className="text-right py-3 px-4 text-gray-400 font-medium">Conversion Rate</th>
                <th className="text-right py-3 px-4 text-gray-400 font-medium">Growth Rate</th>
              </tr>
            </thead>
            <tbody>
              {metrics.segments.map((segment) => (
                <tr key={segment.tier} className="border-b border-gray-700 hover:bg-gray-750">
                  <td className="py-3 px-4">
                    <span
                      className="inline-flex items-center px-2 py-1 rounded text-sm font-medium"
                      style={{ backgroundColor: `${COLORS[segment.tier]}20`, color: COLORS[segment.tier] }}
                    >
                      {segment.tier.charAt(0).toUpperCase() + segment.tier.slice(1)}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-gray-300">
                    {formatCurrency(segment.minValue)} - {segment.maxValue === Infinity ? '∞' : formatCurrency(segment.maxValue)}
                  </td>
                  <td className="py-3 px-4 text-right text-white font-medium">{segment.count.toLocaleString()}</td>
                  <td className="py-3 px-4 text-right text-white">{segment.engagementRate.toFixed(2)}%</td>
                  <td className="py-3 px-4 text-right text-white">{segment.conversionRate.toFixed(2)}%</td>
                  <td className="py-3 px-4 text-right">
                    <span className={segment.growthRate >= 0 ? 'text-green-400' : 'text-red-400'}>
                      {segment.growthRate >= 0 ? '+' : ''}{segment.growthRate.toFixed(2)}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Common Token Holdings */}
      <Card className="bg-gray-800 border-gray-700">
        <h3 className="text-lg font-semibold text-white mb-4">Most Common Token Holdings</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {metrics.commonTokens.slice(0, 10).map((token, index) => (
            <div key={token.symbol} className="bg-gray-750 rounded-lg p-4 border border-gray-700">
              <div className="flex items-center justify-between mb-2">
                <span className="text-lg font-bold text-white">{token.symbol}</span>
                <span className="text-xs text-gray-400">#{index + 1}</span>
              </div>
              <p className="text-sm text-gray-400">{token.holders} holders</p>
              <p className="text-xs text-gray-500 mt-1">Avg hold: {token.avgHoldingDuration}d</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};
