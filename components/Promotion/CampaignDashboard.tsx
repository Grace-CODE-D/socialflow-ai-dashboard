import React from 'react';
import { MetricsTracker } from './MetricsTracker';

type Promotion = {
  id: string | number;
  title: string;
  status: 'active' | 'paused' | string;
  metrics: {
    views: number;
    [key: string]: any;
  };
  current_budget: number;
  initial_budget: number;
};

type Props = {
  promotions: Promotion[];
};

type Class = {};

export const CampaignDashboard: React.FC<Props> = ({ promotions }) => {
  return (
    <div className="space-y-8">
      <header className="flex justify-between items-center">
        <h2 className="text-3xl font-extrabold">Campaign Performance</h2>
        <div className="badge bg-blue-100 text-blue-800 p-2 rounded">
          {promotions.filter(p => p.status === 'active').length} Active Promotions
        </div>
      </header>

      {/* Comparison Table */}
      <div className="overflow-x-auto bg-white rounded-lg shadow">
        <table className="min-w-full leading-normal">
          <thead>
            <tr className="bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase">
              <th className="px-5 py-3">Campaign</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3">Engagement</th>
              <th className="px-5 py-3">Budget Progress</th>
            </tr>
          </thead>
          <tbody>
            {promotions.map((promo) => (
              <tr key={promo.id} className="border-b">
                <td className="px-5 py-4 text-sm font-medium">{promo.title}</td>
                <td className="px-5 py-4">
                  <span className={`px-2 py-1 rounded text-xs ${promo.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                    {promo.status}
                  </span>
                </td>
                <td className="px-5 py-4 text-sm">{promo.metrics.views} views</td>
                <td className="px-5 py-4 w-1/3">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-purple-500 h-2 rounded-full" 
                      style={{ width: `${(promo.current_budget / promo.initial_budget) * 100}%` }}
                    ></div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Detail Trackers */}
      <div className="grid gap-6">
        {promotions.map(promo => (
          <div key={promo.id}>
            <h3 className="text-lg font-semibold mb-2">{promo.title} Real-time Metrics</h3>
            <MetricsTracker promotion={promo} />
          </div>
        ))}
      </div>
    </div>
  );
};