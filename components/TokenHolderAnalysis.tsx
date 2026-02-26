import React, { useEffect, useState } from 'react';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Coins, Users, TrendingUp, Target } from 'lucide-react';
import { Card } from './ui/Card';
import {
  identifyTokenHolders,
  analyzeTokenHoldingPatterns,
  calculateTokenLoyalty,
  createTokenHolderCohorts,
  TokenHolder,
  TokenHolderCohort,
  TokenLoyaltyMetrics
} from '../services/tokenHolderService';

const POPULAR_TOKENS = ['ETH', 'BTC', 'SOL', 'MATIC', 'USDC', 'LINK', 'UNI', 'AAVE'];

export const TokenHolderAnalysis: React.FC = () => {
  const [selectedToken, setSelectedToken] = useState('ETH');
  const [holders, setHolders] = useState<TokenHolder[]>([]);
  const [cohorts, setCohorts] = useState<TokenHolderCohort[]>([]);
  const [loyalty, setLoyalty] = useState<TokenLoyaltyMetrics | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadTokenData();
  }, [selectedToken]);

  const loadTokenData = async () => {
    setLoading(true);
    try {
      const holderData = await identifyTokenHolders(selectedToken);
      setHolders(holderData);
      setCohorts(createTokenHolderCohorts(holderData));
      setLoyalty(calculateTokenLoyalty(holderData));
    } catch (error) {
      console.error('Failed to load token data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400">Loading token holder data...</div>
      </div>
    );
  }

  const patterns = analyzeTokenHoldingPatterns(holders);

  const patternData = [
    { name: 'Short Term (<30d)', value: patterns.shortTerm, color: '#ef4444' },
    { name: 'Medium Term (30-90d)', value: patterns.mediumTerm, color: '#f59e0b' },
    { name: 'Long Term (>90d)', value: patterns.longTerm, color: '#10b981' }
  ];

  const cohortChartData = cohorts.map(c => ({
    name: c.cohortId.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
    holders: c.holderCount,
    engagement: c.avgEngagement.toFixed(1),
    value: c.totalValue / 1000
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Token Holder Analysis</h2>
          <p className="text-gray-400 mt-1">Analyze token holding patterns and cohorts</p>
        </div>
        <select
          value={selectedToken}
          onChange={(e) => setSelectedToken(e.target.value)}
          className="px-4 py-2 bg-gray-800 text-white rounded-lg border border-gray-700 focus:outline-none focus:border-purple-500"
        >
          {POPULAR_TOKENS.map(token => (
            <option key={token} value={token}>{token}</option>
          ))}
        </select>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gray-800 border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Total Holders</p>
              <p className="text-2xl font-bold text-white mt-1">{holders.length}</p>
            </div>
            <Users className="text-blue-500" size={32} />
          </div>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Avg Holding Period</p>
              <p className="text-2xl font-bold text-white mt-1">{patterns.avgHoldingDuration.toFixed(0)}d</p>
            </div>
            <TrendingUp className="text-green-500" size={32} />
          </div>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Loyal Holders</p>
              <p className="text-2xl font-bold text-white mt-1">{loyalty?.loyalHolders || 0}</p>
              <p className="text-xs text-green-400 mt-1">{loyalty?.retentionRate.toFixed(1)}% retention</p>
            </div>
            <Target className="text-purple-500" size={32} />
          </div>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Churn Rate</p>
              <p className="text-2xl font-bold text-white mt-1">{loyalty?.churnRate.toFixed(1)}%</p>
            </div>
            <Coins className="text-orange-500" size={32} />
          </div>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-gray-800 border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4">Holding Duration Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={patternData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {patternData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4">Holder Cohorts</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={cohortChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="name" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip
                contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }}
                labelStyle={{ color: '#fff' }}
              />
              <Legend />
              <Bar dataKey="holders" fill="#8b5cf6" name="Holder Count" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Cohort Details */}
      <Card className="bg-gray-800 border-gray-700">
        <h3 className="text-lg font-semibold text-white mb-4">Cohort Details</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left py-3 px-4 text-gray-400 font-medium">Cohort</th>
                <th className="text-right py-3 px-4 text-gray-400 font-medium">Holders</th>
                <th className="text-right py-3 px-4 text-gray-400 font-medium">Avg Duration</th>
                <th className="text-right py-3 px-4 text-gray-400 font-medium">Avg Engagement</th>
                <th className="text-right py-3 px-4 text-gray-400 font-medium">Total Value</th>
                <th className="text-right py-3 px-4 text-gray-400 font-medium">Loyalty Score</th>
              </tr>
            </thead>
            <tbody>
              {cohorts.map((cohort) => (
                <tr key={cohort.cohortId} className="border-b border-gray-700 hover:bg-gray-750">
                  <td className="py-3 px-4 text-white font-medium">
                    {cohort.cohortId.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                  </td>
                  <td className="py-3 px-4 text-right text-white">{cohort.holderCount}</td>
                  <td className="py-3 px-4 text-right text-white">{cohort.avgHoldingDuration.toFixed(0)}d</td>
                  <td className="py-3 px-4 text-right text-white">{cohort.avgEngagement.toFixed(1)}</td>
                  <td className="py-3 px-4 text-right text-white">
                    ${(cohort.totalValue / 1000).toFixed(1)}k
                  </td>
                  <td className="py-3 px-4 text-right">
                    <span className={cohort.loyaltyScore > 50 ? 'text-green-400' : 'text-orange-400'}>
                      {cohort.loyaltyScore.toFixed(1)}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Top Holders */}
      <Card className="bg-gray-800 border-gray-700">
        <h3 className="text-lg font-semibold text-white mb-4">Top Token Holders</h3>
        <div className="space-y-3">
          {holders.slice(0, 10).map((holder, index) => (
            <div key={holder.walletAddress} className="flex items-center justify-between p-3 bg-gray-750 rounded-lg">
              <div className="flex items-center gap-3">
                <span className="text-gray-400 font-mono">#{index + 1}</span>
                <div>
                  <p className="text-white font-mono text-sm">
                    {holder.walletAddress.slice(0, 6)}...{holder.walletAddress.slice(-4)}
                  </p>
                  <p className="text-xs text-gray-400">
                    Holding for {holder.holdingDuration}d
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-white font-medium">${holder.value.toLocaleString()}</p>
                <p className="text-xs text-gray-400">{holder.amount.toFixed(2)} {selectedToken}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};
