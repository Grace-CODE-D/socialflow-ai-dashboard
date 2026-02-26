import React from 'react';
import { TrendingUp } from 'lucide-react';

interface SponsoredBadgeProps {
  budget?: number;
  currency?: 'XLM' | 'TOKEN';
  size?: 'sm' | 'md' | 'lg';
}

export const SponsoredBadge: React.FC<SponsoredBadgeProps> = ({ 
  budget, 
  currency, 
  size = 'md' 
}) => {
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-1.5 text-base'
  };

  return (
    <div className={`inline-flex items-center gap-1.5 bg-purple-100 text-purple-700 rounded-full font-semibold ${sizeClasses[size]}`}>
      <TrendingUp className="w-3 h-3" />
      <span>Sponsored</span>
      {budget && currency && (
        <span className="ml-1 opacity-75">
          • {budget} {currency}
        </span>
      )}
    </div>
  );
};
