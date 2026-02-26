import React, { useEffect, useState } from 'react';
import { TransactionStatusIndicator } from './TransactionStatusIndicator';
import { Transaction } from '../types/transaction';

interface TransactionQueueItemProps {
  transaction: Transaction;
  onRetry?: (id: string) => void;
}

export const TransactionQueueItem: React.FC<TransactionQueueItemProps> = ({
  transaction,
  onRetry,
}) => {
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (transaction.status === 'confirmed' && !showSuccess) {
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    }
  }, [transaction.status]);

  return (
    <div className="relative bg-dark-surface border border-dark-border rounded-xl p-4 hover:border-primary-blue/30 transition-all">
      {showSuccess && (
        <div className="absolute top-2 right-2 text-xs text-green-500 bg-green-500/10 px-2 py-1 rounded animate-fade-in">
          Success!
        </div>
      )}
      
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm font-medium text-white">{transaction.type}</span>
            {transaction.hash && (
              <span className="text-xs text-gray-subtext font-mono">
                {transaction.hash.slice(0, 8)}...
              </span>
            )}
          </div>
          
          {transaction.amount && (
            <div className="text-sm text-gray-subtext mb-3">
              {transaction.amount} {transaction.asset || 'XLM'}
              {transaction.recipient && (
                <span className="ml-2">
                  → {transaction.recipient.slice(0, 8)}...
                </span>
              )}
            </div>
          )}
          
          <TransactionStatusIndicator
            status={transaction.status}
            estimatedTime={transaction.estimatedConfirmTime}
            onRetry={onRetry ? () => onRetry(transaction.id) : undefined}
          />
          
          {transaction.error && (
            <div className="mt-2 text-xs text-red-400 bg-red-500/10 px-2 py-1 rounded">
              {transaction.error}
            </div>
          )}
        </div>
        
        <div className="text-xs text-gray-subtext">
          {new Date(transaction.timestamp).toLocaleTimeString()}
        </div>
      </div>
    </div>
  );
};
