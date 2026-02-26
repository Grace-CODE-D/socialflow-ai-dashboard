import React, { useState } from 'react';

export const UnifiedOverview: React.FC = () => {
  const [period, setPeriod] = useState('7d');

  // Mock data for Requirement 14.2 & 14.3
  const metrics = {
    followers: { total: "12.5k", change: "+12%" },
    walletValue: { total: "4,250.50 XLM", change: "+5.4%" },
    efficiency: { rate: "8.2%", label: "Eng vs XLM Spent" }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-6 border-b border-gray-50 flex justify-between items-center bg-white">
        <h3 className="text-lg font-bold text-gray-800">Unified Overview</h3>
        <select 
          value={period} 
          onChange={(e) => setPeriod(e.target.value)}
          className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-1 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="7d">Last 7 Days</option>
          <option value="30d">Last 30 Days</option>
          <option value="all">All-time</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-gray-100">
        {/* Social Metrics */}
        <div className="p-6">
          <p className="text-sm text-gray-500 font-medium">Follower Growth</p>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-bold">{metrics.followers.total}</span>
            <span className="text-sm text-green-600 font-bold">{metrics.followers.change}</span>
          </div>
        </div>

        {/* Wallet Metrics */}
        <div className="p-6">
          <p className="text-sm text-gray-500 font-medium">Wallet Value (XLM + Tokens)</p>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-bold">{metrics.walletValue.total}</span>
            <span className="text-sm text-green-600 font-bold">{metrics.walletValue.change}</span>
          </div>
        </div>

        {/* Efficiency Metrics */}
        <div className="p-6">
          <p className="text-sm text-gray-500 font-medium">{metrics.efficiency.label}</p>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-bold">{metrics.efficiency.rate}</span>
            <span className="text-xs bg-indigo-50 text-indigo-600 px-2 py-1 rounded font-semibold ml-2">Optimal</span>
          </div>
        </div>
      </div>
    </div>
  );
};