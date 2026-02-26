import React, { useState } from 'react';
import { AreaChart, Area, LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

type ChartType = 'line' | 'area' | 'bar';

interface BalanceData {
  date: string;
  xlm: number;
  usdc: number;
  custom: number;
}

const mockData: BalanceData[] = Array.from({ length: 30 }, (_, i) => ({
  date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
  xlm: 10000 + Math.random() * 2000 - 1000,
  usdc: 5000 + Math.random() * 1000 - 500,
  custom: 3000 + Math.random() * 800 - 400,
}));

export const BalanceHistoryChart: React.FC = () => {
  const [chartType, setChartType] = useState<ChartType>('area');
  const [data] = useState(mockData);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload) return null;
    return (
      <div className="bg-dark-surface border border-dark-border rounded-lg p-3 shadow-lg">
        <p className="text-white font-semibold mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2 text-sm">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="text-gray-subtext">{entry.name}:</span>
            <span className="text-white font-semibold">{entry.value.toFixed(2)}</span>
          </div>
        ))}
      </div>
    );
  };

  const renderChart = () => {
    const commonProps = {
      data,
      margin: { top: 10, right: 30, left: 0, bottom: 0 },
    };

    const chartElements = (
      <>
        <defs>
          <linearGradient id="xlmGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="usdcGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#14b8a6" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="customGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
        <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#8892b0', fontSize: 12 }} />
        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#8892b0', fontSize: 12 }} />
        <Tooltip content={<CustomTooltip />} />
        <Legend />
      </>
    );

    if (chartType === 'area') {
      return (
        <AreaChart {...commonProps}>
          {chartElements}
          <Area type="monotone" dataKey="xlm" stroke="#3b82f6" strokeWidth={2} fill="url(#xlmGradient)" name="XLM" />
          <Area type="monotone" dataKey="usdc" stroke="#14b8a6" strokeWidth={2} fill="url(#usdcGradient)" name="USDC" />
          <Area type="monotone" dataKey="custom" stroke="#a855f7" strokeWidth={2} fill="url(#customGradient)" name="Custom" />
        </AreaChart>
      );
    }

    if (chartType === 'line') {
      return (
        <LineChart {...commonProps}>
          {chartElements}
          <Line type="monotone" dataKey="xlm" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} name="XLM" />
          <Line type="monotone" dataKey="usdc" stroke="#14b8a6" strokeWidth={2} dot={{ r: 3 }} name="USDC" />
          <Line type="monotone" dataKey="custom" stroke="#a855f7" strokeWidth={2} dot={{ r: 3 }} name="Custom" />
        </LineChart>
      );
    }

    return (
      <BarChart {...commonProps}>
        {chartElements}
        <Bar dataKey="xlm" fill="#3b82f6" radius={[4, 4, 0, 0]} name="XLM" />
        <Bar dataKey="usdc" fill="#14b8a6" radius={[4, 4, 0, 0]} name="USDC" />
        <Bar dataKey="custom" fill="#a855f7" radius={[4, 4, 0, 0]} name="Custom" />
      </BarChart>
    );
  };

  return (
    <div className="bg-dark-surface rounded-xl p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-lg font-semibold text-white">30-Day Balance History</h3>
          <p className="text-sm text-gray-subtext">XLM and token balances over time</p>
        </div>
        <div className="flex gap-2 bg-dark-bg rounded-lg p-1">
          {(['line', 'area', 'bar'] as ChartType[]).map((type) => (
            <button
              key={type}
              onClick={() => setChartType(type)}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-all capitalize ${
                chartType === type ? 'bg-primary-blue text-white' : 'text-gray-subtext hover:text-white'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>
      <div className="h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          {renderChart()}
        </ResponsiveContainer>
      </div>
    </div>
  );
};
