import React, { useState, useMemo } from 'react';
import { Card } from './ui/Card';
import { ViewProps, WealthTrend, WealthSegment, WalletData } from '../types';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, ScatterChart, Scatter, Cell, LineChart, Line
} from 'recharts';

const MaterialIcon = ({ name, className }: { name: string, className?: string }) => (
  <span className={`material-symbols-outlined ${className}`}>{name}</span>
);

// Mock data generators
const generateWealthTrends = (): WealthTrend[] => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
  let baseValue = 1000000;
  
  return months.map((month, i) => {
    const change = (Math.random() - 0.4) * 100000;
    baseValue += change;
    return {
      period: month,
      totalValue: baseValue,
      change,
      changePercent: (change / (baseValue - change)) * 100,
      newWallets: Math.floor(Math.random() * 50) + 10,
      activeWallets: Math.floor(Math.random() * 200) + 100
    };
  });
};

const generateWealthSegments = (): WealthSegment[] => {
  return [
    { category: 'Whales (>$100k)', count: 12, totalValue: 2400000, averageValue: 200000, percentage: 65 },
    { category: 'Dolphins ($10k-$100k)', count: 45, totalValue: 900000, averageValue: 20000, percentage: 24 },
    { category: 'Fish ($1k-$10k)', count: 180, totalValue: 360000, averageValue: 2000, percentage: 10 },
    { category: 'Shrimp (<$1k)', count: 320, totalValue: 40000, averageValue: 125, percentage: 1 }
  ];
};

const generateWalletData = (): WalletData[] => {
  const categories: Array<'whale' | 'dolphin' | 'fish' | 'shrimp'> = ['whale', 'dolphin', 'fish', 'shrimp'];
  return Array.from({ length: 50 }, (_, i) => ({
    address: `0x${Math.random().toString(16).substr(2, 8)}...`,
    balance: Math.random() * 500000,
    tokens: [],
    firstSeen: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000),
    lastActive: new Date(),
    transactionCount: Math.floor(Math.random() * 1000),
    category: categories[Math.floor(Math.random() * categories.length)]
  }));
};

const SEGMENT_COLORS = ['#3b82f6', '#14b8a6', '#a855f7', '#fb923c'];

export const WealthAnalytics: React.FC<ViewProps> = () => {
  const [timeRange, setTimeRange] = useState<'1M' | '3M' | '6M' | '1Y'>('6M');
  const [selectedSegment, setSelectedSegment] = useState<string | null>(null);

  const wealthTrends = useMemo(() => generateWealthTrends(), [timeRange]);
  const wealthSegments = useMemo(() => generateWealthSegments(), []);
  const walletData = useMemo(() => generateWalletData(), []);

  const formatCurrency = (value: number) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
    return `$${value.toFixed(0)}`;
  };

  const formatPercent = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  const currentValue = wealthTrends[wealthTrends.length - 1]?.totalValue || 0;
  const previousValue = wealthTrends[wealthTrends.length - 2]?.totalValue || 0;
  const overallChange = ((currentValue - previousValue) / previousValue) * 100;

  return (
    <div className="p-7 space-y-7 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">Audience Wealth Analytics</h2>
          <p className="text-gray-subtext mt-1">Track portfolio value and wealth distribution</p>
        </div>
        <div className="flex gap-3">
          {(['1M', '3M', '6M', '1Y'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                timeRange === range
                  ? 'bg-primary-blue text-white shadow-lg shadow-blue-500/20'
                  : 'bg-dark-surface text-gray-subtext hover:bg-dark-hover'
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-gray-subtext text-sm mb-1">Total Portfolio Value</p>
              <p className="text-3xl font-bold text-white">{formatCurrency(currentValue)}</p>
              <p className={`text-sm mt-2 ${overallChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {formatPercent(overallChange)} vs last period
              </p>
            </div>
            <MaterialIcon name="account_balance_wallet" className="text-3xl text-blue-400" />
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-teal-500/10 to-teal-600/5 border-teal-500/20">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-gray-subtext text-sm mb-1">Active Wallets</p>
              <p className="text-3xl font-bold text-white">
                {wealthTrends[wealthTrends.length - 1]?.activeWallets || 0}
              </p>
              <p className="text-sm mt-2 text-teal-400">
                +{wealthTrends[wealthTrends.length - 1]?.newWallets || 0} new this period
              </p>
            </div>
            <MaterialIcon name="group" className="text-3xl text-teal-400" />
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-gray-subtext text-sm mb-1">Average Wallet Value</p>
              <p className="text-3xl font-bold text-white">
                {formatCurrency(currentValue / (wealthTrends[wealthTrends.length - 1]?.activeWallets || 1))}
              </p>
              <p className="text-sm mt-2 text-purple-400">Per active wallet</p>
            </div>
            <MaterialIcon name="trending_up" className="text-3xl text-purple-400" />
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-orange-500/10 to-orange-600/5 border-orange-500/20">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-gray-subtext text-sm mb-1">Whale Holders</p>
              <p className="text-3xl font-bold text-white">
                {wealthSegments.find(s => s.category.includes('Whales'))?.count || 0}
              </p>
              <p className="text-sm mt-2 text-orange-400">
                {wealthSegments.find(s => s.category.includes('Whales'))?.percentage || 0}% of total value
              </p>
            </div>
            <MaterialIcon name="water_drop" className="text-3xl text-orange-400" />
          </div>
        </Card>
      </div>

      {/* Portfolio Value Trends */}
      <Card className="lg:col-span-2">
        <h3 className="text-lg font-semibold text-white mb-6">Portfolio Value Over Time</h3>
        <div className="h-[320px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={wealthTrends}>
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="period" axisLine={false} tickLine={false} tick={{fill: '#8892b0'}} dy={10} />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{fill: '#8892b0'}}
                tickFormatter={formatCurrency}
              />
              <Tooltip 
                contentStyle={{ backgroundColor: '#161b22', borderColor: '#334155', borderRadius: '20px' }}
                formatter={(value: number) => [formatCurrency(value), 'Total Value']}
              />
              <Area 
                type="monotone" 
                dataKey="totalValue" 
                stroke="#3b82f6" 
                strokeWidth={3} 
                fillOpacity={1} 
                fill="url(#colorValue)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Wealth Distribution & Heatmap */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
          <h3 className="text-lg font-semibold text-white mb-6">Wealth Distribution</h3>
          <div className="space-y-4">
            {wealthSegments.map((segment, index) => (
              <div 
                key={segment.category}
                className={`p-4 rounded-xl transition-all cursor-pointer ${
                  selectedSegment === segment.category 
                    ? 'bg-dark-hover ring-2 ring-blue-500' 
                    : 'bg-dark-surface hover:bg-dark-hover'
                }`}
                onClick={() => setSelectedSegment(
                  selectedSegment === segment.category ? null : segment.category
                )}
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-4 h-4 rounded-full" 
                      style={{ backgroundColor: SEGMENT_COLORS[index] }}
                    />
                    <div>
                      <p className="text-white font-medium">{segment.category}</p>
                      <p className="text-gray-subtext text-sm">{segment.count} wallets</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-white font-semibold">{formatCurrency(segment.totalValue)}</p>
                    <p className="text-gray-subtext text-sm">{segment.percentage}%</p>
                  </div>
                </div>
                <div className="w-full h-2 bg-dark-bg rounded-full overflow-hidden">
                  <div 
                    className="h-full rounded-full transition-all duration-500"
                    style={{ 
                      width: `${segment.percentage}%`,
                      backgroundColor: SEGMENT_COLORS[index]
                    }}
                  />
                </div>
                <p className="text-gray-subtext text-xs mt-2">
                  Avg: {formatCurrency(segment.averageValue)} per wallet
                </p>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <h3 className="text-lg font-semibold text-white mb-6">Wealth Concentration Heatmap</h3>
          <div className="space-y-3">
            {Array.from({ length: 8 }).map((_, weekIndex) => (
              <div key={weekIndex} className="flex gap-1">
                <div className="w-16 text-xs text-gray-subtext flex items-center">
                  Week {weekIndex + 1}
                </div>
                {Array.from({ length: 7 }).map((_, dayIndex) => {
                  const intensity = Math.random();
                  let bgColor = 'bg-dark-surface';
                  if (intensity > 0.75) bgColor = 'bg-blue-500';
                  else if (intensity > 0.5) bgColor = 'bg-blue-600';
                  else if (intensity > 0.25) bgColor = 'bg-blue-800';
                  
                  return (
                    <div
                      key={dayIndex}
                      className={`flex-1 h-8 rounded ${bgColor} relative group hover:ring-2 hover:ring-white/30 transition-all cursor-pointer`}
                      title={`${(intensity * 100).toFixed(0)}% activity`}
                    >
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="text-[10px] font-bold text-white drop-shadow-lg">
                          {(intensity * 100).toFixed(0)}%
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
          <div className="flex justify-between items-center mt-4 text-xs text-gray-subtext">
            <span>Less activity</span>
            <div className="flex gap-1">
              {['bg-dark-surface', 'bg-blue-800', 'bg-blue-600', 'bg-blue-500'].map((color, i) => (
                <div key={i} className={`w-4 h-4 rounded ${color}`} />
              ))}
            </div>
            <span>More activity</span>
          </div>
        </Card>
      </div>

      {/* Wallet Analysis & Token Accumulation */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
          <h3 className="text-lg font-semibold text-white mb-6">Top Wallet Analysis</h3>
          <div className="space-y-3 max-h-[400px] overflow-y-auto custom-scrollbar">
            {walletData
              .sort((a, b) => b.balance - a.balance)
              .slice(0, 15)
              .map((wallet, index) => {
                const categoryColors = {
                  whale: 'text-blue-400 bg-blue-500/10',
                  dolphin: 'text-teal-400 bg-teal-500/10',
                  fish: 'text-purple-400 bg-purple-500/10',
                  shrimp: 'text-orange-400 bg-orange-500/10'
                };
                
                return (
                  <div 
                    key={wallet.address}
                    className="flex items-center justify-between p-3 bg-dark-surface rounded-xl hover:bg-dark-hover transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-gray-subtext font-mono text-sm">#{index + 1}</div>
                      <div>
                        <p className="text-white font-mono text-sm">{wallet.address}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${categoryColors[wallet.category]}`}>
                            {wallet.category}
                          </span>
                          <span className="text-xs text-gray-subtext">
                            {wallet.transactionCount} txns
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-white font-semibold">{formatCurrency(wallet.balance)}</p>
                      <p className="text-xs text-gray-subtext mt-1">
                        Active {Math.floor((Date.now() - wallet.lastActive.getTime()) / (1000 * 60 * 60 * 24))}d ago
                      </p>
                    </div>
                  </div>
                );
              })}
          </div>
        </Card>

        <Card>
          <h3 className="text-lg font-semibold text-white mb-6">Token Accumulation Patterns</h3>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis 
                  type="number" 
                  dataKey="transactionCount" 
                  name="Transactions"
                  axisLine={false}
                  tickLine={false}
                  tick={{fill: '#8892b0'}}
                  label={{ value: 'Transaction Count', position: 'insideBottom', offset: -5, fill: '#8892b0' }}
                />
                <YAxis 
                  type="number" 
                  dataKey="balance" 
                  name="Balance"
                  axisLine={false}
                  tickLine={false}
                  tick={{fill: '#8892b0'}}
                  tickFormatter={formatCurrency}
                  label={{ value: 'Balance', angle: -90, position: 'insideLeft', fill: '#8892b0' }}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#161b22', borderColor: '#334155', borderRadius: '20px' }}
                  formatter={(value: number, name: string) => {
                    if (name === 'Balance') return formatCurrency(value);
                    return value;
                  }}
                />
                <Scatter name="Wallets" data={walletData} fill="#3b82f6">
                  {walletData.map((entry, index) => {
                    const colors = {
                      whale: '#3b82f6',
                      dolphin: '#14b8a6',
                      fish: '#a855f7',
                      shrimp: '#fb923c'
                    };
                    return <Cell key={`cell-${index}`} fill={colors[entry.category]} />;
                  })}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Wealth Migration Trends */}
      <Card>
        <h3 className="text-lg font-semibold text-white mb-6">Wealth Migration & Predictive Model</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-4">
            <div className="p-4 bg-gradient-to-br from-green-500/10 to-green-600/5 rounded-xl border border-green-500/20">
              <MaterialIcon name="north_east" className="text-2xl text-green-400 mb-2" />
              <p className="text-gray-subtext text-sm">Inflow (30d)</p>
              <p className="text-2xl font-bold text-white mt-1">$2.4M</p>
              <p className="text-green-400 text-sm mt-2">+18.5% vs previous</p>
            </div>
            <div className="p-4 bg-gradient-to-br from-red-500/10 to-red-600/5 rounded-xl border border-red-500/20">
              <MaterialIcon name="south_east" className="text-2xl text-red-400 mb-2" />
              <p className="text-gray-subtext text-sm">Outflow (30d)</p>
              <p className="text-2xl font-bold text-white mt-1">$1.8M</p>
              <p className="text-red-400 text-sm mt-2">-12.3% vs previous</p>
            </div>
          </div>

          <div className="md:col-span-2">
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={wealthTrends}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="period" axisLine={false} tickLine={false} tick={{fill: '#8892b0'}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#8892b0'}} />
                  <Tooltip contentStyle={{ backgroundColor: '#161b22', borderColor: '#334155', borderRadius: '20px' }} />
                  <Line 
                    type="monotone" 
                    dataKey="newWallets" 
                    stroke="#14b8a6" 
                    strokeWidth={3}
                    name="New Wallets"
                    dot={{ fill: '#14b8a6', r: 4 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="activeWallets" 
                    stroke="#3b82f6" 
                    strokeWidth={3}
                    name="Active Wallets"
                    dot={{ fill: '#3b82f6', r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="mt-6 p-4 bg-dark-surface rounded-xl">
          <div className="flex items-start gap-3">
            <MaterialIcon name="psychology" className="text-2xl text-purple-400" />
            <div>
              <p className="text-white font-semibold mb-2">AI Predictive Insights</p>
              <ul className="space-y-2 text-sm text-gray-subtext">
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-0.5">•</span>
                  <span>Expected 15% portfolio growth in next 30 days based on current accumulation patterns</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-400 mt-0.5">•</span>
                  <span>Whale activity increased 23% - potential major movements incoming</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-orange-400 mt-0.5">•</span>
                  <span>Token concentration risk: Top 10 holders control 45% of total value</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};
