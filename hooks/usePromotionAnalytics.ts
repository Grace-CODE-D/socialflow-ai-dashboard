import { useMemo } from 'react';

export const usePromotionAnalytics = (promotion: any) => {
  return useMemo(() => {
    const { initial_budget, current_budget, metrics, created_at } = promotion;
    
    // Calculate consumption
    const spent = initial_budget - current_budget;
    const consumptionRate = initial_budget > 0 ? (spent / initial_budget) * 100 : 0;

    // ROI Calculation (Example: Engagement value vs Spend)
    const totalEngagement = metrics.views + metrics.clicks + metrics.engagements;
    const roi = spent > 0 ? (totalEngagement / spent).toFixed(2) : "0";

    // Burn Rate (Spend per day)
    const daysActive = Math.max(1, Math.floor((Date.now() - new Date(created_at).getTime()) / (1000 * 60 * 60 * 24)));
    const burnRate = (spent / daysActive).toFixed(2);

    return {
      spent,
      consumptionRate,
      roi,
      burnRate,
      remaining: current_budget
    };
  }, [promotion]);
};