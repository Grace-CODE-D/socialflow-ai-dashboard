import React, { useState } from 'react';
import { SponsorshipTier } from '../../types';

interface SponsoredBadgeProps {
  tier: 'basic' | 'premium' | 'enterprise';
  className?: string;
  showDetails?: boolean;
  onHover?: (details: SponsorshipTier | null) => void;
}

const MaterialIcon = ({ name, className }: { name: string, className?: string }) => (
  <span className={`material-symbols-outlined ${className}`}>{name}</span>
);

export const SponsoredBadge: React.FC<SponsoredBadgeProps> = ({ 
  tier, 
  className = '', 
  showDetails = false,
  onHover 
}) => {
  const [showTooltip, setShowTooltip] = useState(false);

  const getBadgeConfig = () => {
    switch (tier) {
      case 'basic':
        return {
          label: 'Sponsored',
          bgColor: 'bg-blue-500/20',
          textColor: 'text-blue-400',
          borderColor: 'border-blue-500/30',
          icon: 'campaign'
        };
      case 'premium':
        return {
          label: 'Premium',
          bgColor: 'bg-purple-500/20',
          textColor: 'text-purple-400',
          borderColor: 'border-purple-500/30',
          icon: 'star'
        };
      case 'enterprise':
        return {
          label: 'Enterprise',
          bgColor: 'bg-amber-500/20',
          textColor: 'text-amber-400',
          borderColor: 'border-amber-500/30',
          icon: 'diamond'
        };
    }
  };

  const config = getBadgeConfig();

  const tierDetails: SponsorshipTier = {
    id: tier,
    name: config.label + ' Promotion',
    price: tier === 'basic' ? 10 : tier === 'premium' ? 25 : 50,
    features: tier === 'basic' 
      ? ['24h promotion', 'Basic analytics', 'Standard reach']
      : tier === 'premium'
      ? ['72h promotion', 'Advanced analytics', 'Enhanced reach', 'Priority placement']
      : ['168h promotion', 'Full analytics suite', 'Maximum reach', 'Premium placement', 'Custom targeting'],
    duration: tier === 'basic' ? 24 : tier === 'premium' ? 72 : 168,
    reach: tier === 'basic' ? '1K-5K users' : tier === 'premium' ? '5K-15K users' : '15K+ users'
  };

  return (
    <div className="relative inline-block">
      <div 
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border ${config.bgColor} ${config.textColor} ${config.borderColor} text-xs font-semibold cursor-help ${className}`}
        onMouseEnter={() => {
          setShowTooltip(true);
          onHover?.(tierDetails);
        }}
        onMouseLeave={() => {
          setShowTooltip(false);
          onHover?.(null);
        }}
      >
        <MaterialIcon name={config.icon} className="text-sm" />
        <span>{config.label}</span>
        {showDetails && (
          <div className="flex items-center gap-1 ml-1 pl-1.5 border-l border-current/30">
            <MaterialIcon name="schedule" className="text-xs" />
            <span className="text-xs opacity-80">{tierDetails.duration}h</span>
          </div>
        )}
      </div>

      {/* Tooltip */}
      {showTooltip && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64 bg-dark-surface border border-dark-border rounded-xl shadow-lg p-4 z-50 animate-fade-in-sm">
          <div className="flex items-center gap-2 mb-3">
            <MaterialIcon name={config.icon} className={`text-lg ${config.textColor}`} />
            <h4 className="font-semibold text-white">{tierDetails.name}</h4>
          </div>
          
          <div className="space-y-2 mb-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Duration:</span>
              <span className="text-white">{tierDetails.duration} hours</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Reach:</span>
              <span className="text-white">{tierDetails.reach}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Cost:</span>
              <span className="text-white font-semibold">{tierDetails.price} XLM</span>
            </div>
          </div>

          <div className="border-t border-white/10 pt-3">
            <p className="text-xs text-gray-400 mb-2">Features:</p>
            <div className="flex flex-wrap gap-1">
              {tierDetails.features.map((feature, index) => (
                <span key={index} className="text-xs bg-white/10 px-2 py-1 rounded text-gray-300">
                  {feature}
                </span>
              ))}
            </div>
          </div>

          {/* Tooltip arrow */}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-dark-border"></div>
        </div>
      )}
    </div>
  );
};