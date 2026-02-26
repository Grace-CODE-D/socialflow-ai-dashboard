import React from 'react';
import { Clock, CheckCircle, XCircle, Loader, Send } from 'lucide-react';
import { TransactionStatus } from '../types/transaction';

interface TransactionStatusIndicatorProps {
  status: TransactionStatus;
  estimatedTime?: number;
  onRetry?: () => void;
}

const statusConfig = {
  pending: {
    icon: Clock,
    color: 'text-yellow-500',
    bg: 'bg-yellow-500/10',
    label: 'Pending',
  },
  signing: {
    icon: Loader,
    color: 'text-blue-500',
    bg: 'bg-blue-500/10',
    label: 'Signing',
  },
  dispatched: {
    icon: Send,
    color: 'text-primary-teal',
    bg: 'bg-primary-teal/10',
    label: 'Dispatched',
  },
  confirmed: {
    icon: CheckCircle,
    color: 'text-green-500',
    bg: 'bg-green-500/10',
    label: 'Confirmed',
  },
  failed: {
    icon: XCircle,
    color: 'text-red-500',
    bg: 'bg-red-500/10',
    label: 'Failed',
  },
};

export const TransactionStatusIndicator: React.FC<TransactionStatusIndicatorProps> = ({
  status,
  estimatedTime,
  onRetry,
}) => {
  const config = statusConfig[status];
  const Icon = config.icon;
  const isAnimated = status === 'signing' || status === 'dispatched';

  return (
    <div className="flex items-center gap-3">
      <div className={`relative flex items-center justify-center w-10 h-10 rounded-full ${config.bg}`}>
        <Icon
          className={`w-5 h-5 ${config.color} ${isAnimated ? 'animate-spin' : ''}`}
        />
        {isAnimated && (
          <div className={`absolute inset-0 rounded-full ${config.bg} animate-ping opacity-75`} />
        )}
      </div>
      
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className={`font-medium ${config.color}`}>{config.label}</span>
          {estimatedTime && status === 'dispatched' && (
            <span className="text-xs text-gray-subtext">
              ~{estimatedTime}s
            </span>
          )}
        </div>
        
        {status === 'failed' && onRetry && (
          <button
            onClick={onRetry}
            className="text-xs text-primary-blue hover:text-primary-teal transition-colors mt-1"
          >
            Retry Transaction
          </button>
        )}
      </div>
    </div>
  );
};
