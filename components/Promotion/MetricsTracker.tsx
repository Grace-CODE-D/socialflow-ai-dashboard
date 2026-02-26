import type { FC } from 'react';
import { usePromotionAnalytics } from '/home/afolarinwa-soleye/socialflow-ai-dashboard/hooks/usePromotionAnalytics.ts';

type MetricsTrackerProps = { promotion: any };

export const MetricsTracker: FC<MetricsTrackerProps> = ({ promotion }) => {
  const { spent, roi, burnRate, consumptionRate } = usePromotionAnalytics(promotion);

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-white rounded-xl shadow-md">
      <div className="flex flex-col">
        <span className="text-gray-500 text-sm">ROI (Eng/XLM)</span>
        <span className="text-2xl font-bold text-green-600">{roi}</span>
      </div>
      <div className="flex flex-col">
        <span className="text-gray-500 text-sm">Burn Rate</span>
        <span className="text-2xl font-bold">{burnRate} <small className="text-xs">XLM/day</small></span>
      </div>
      <div className="flex flex-col w-full col-span-2">
        <span className="text-gray-500 text-sm">Budget Utilization</span>
        <div className="w-full bg-gray-200 rounded-full h-4 mt-2">
          <div 
            className="bg-blue-600 h-4 rounded-full transition-all duration-500" 
            style={{ width: `${consumptionRate}%` }}
          ></div>
        </div>
        <span className="text-right text-xs mt-1">{consumptionRate.toFixed(1)}% Spent</span>
      </div>
    </div>
  );
};

