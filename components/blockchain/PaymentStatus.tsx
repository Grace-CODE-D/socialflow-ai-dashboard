import React, { useState, useEffect } from 'react';
import { TransactionStatus } from '../../types';
import { Card } from '../ui/Card';

const MaterialIcon = ({ name, className }: { name: string; className?: string }) => (
  <span className={`material-symbols-outlined ${className}`}>{name}</span>
);

interface PaymentStatusProps {
  isOpen: boolean;
  transaction: TransactionStatus | null;
  onClose: () => void;
}

export const PaymentStatus: React.FC<PaymentStatusProps> = ({
  isOpen,
  transaction,
  onClose,
}) => {
  const [displayStatus, setDisplayStatus] = useState<TransactionStatus | null>(transaction);

  useEffect(() => {
    setDisplayStatus(transaction);
  }, [transaction]);

  if (!isOpen || !displayStatus) return null;

  const isSuccess = displayStatus.status === 'success';
  const isError = displayStatus.status === 'error';
  const isPending = displayStatus.status === 'pending';

  const getStatusIcon = () => {
    if (isSuccess) return 'check_circle';
    if (isError) return 'error';
    return 'schedule';
  };

  const getStatusColor = () => {
    if (isSuccess) return 'text-green-400';
    if (isError) return 'text-red-400';
    return 'text-yellow-400';
  };

  const getStatusBgColor = () => {
    if (isSuccess) return 'bg-green-400/10 border-green-400/30';
    if (isError) return 'bg-red-400/10 border-red-400/30';
    return 'bg-yellow-400/10 border-yellow-400/30';
  };

  const handleCopyHash = () => {
    navigator.clipboard.writeText(displayStatus.hash);
  };

  const handleViewTransaction = () => {
    // Replace with actual block explorer URL
    const explorerUrl = `https://stellar.expert/explorer/public/tx/${displayStatus.hash}`;
    window.open(explorerUrl, '_blank');
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <Card className="w-full max-w-md">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">Payment Status</h2>
          <button
            onClick={onClose}
            className="text-gray-subtext hover:text-white transition-colors"
          >
            <MaterialIcon name="close" className="text-2xl" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Status Header */}
          <div className={`p-4 rounded-lg border ${getStatusBgColor()}`}>
            <div className="flex items-center gap-3">
              <MaterialIcon
                name={getStatusIcon()}
                className={`text-3xl ${getStatusColor()} ${isPending ? 'animate-spin' : ''}`}
              />
              <div>
                <p className={`font-semibold capitalize ${getStatusColor()}`}>
                  {displayStatus.status}
                </p>
                <p className="text-gray-subtext text-sm">
                  {new Date(displayStatus.timestamp).toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          {/* Transaction Details */}
          <div className="space-y-3">
            <div className="p-3 bg-dark-surface rounded-lg border border-dark-border">
              <p className="text-gray-subtext text-xs mb-1">Transaction ID</p>
              <p className="text-white font-mono text-sm break-all">{displayStatus.id}</p>
            </div>

            <div className="p-3 bg-dark-surface rounded-lg border border-dark-border">
              <p className="text-gray-subtext text-xs mb-1">Transaction Hash</p>
              <div className="flex items-center justify-between gap-2">
                <p className="text-white font-mono text-sm break-all flex-1">
                  {displayStatus.hash.slice(0, 16)}...{displayStatus.hash.slice(-16)}
                </p>
                <button
                  onClick={handleCopyHash}
                  className="p-2 hover:bg-dark-border rounded transition-colors flex-shrink-0"
                  title="Copy hash"
                >
                  <MaterialIcon name="content_copy" className="text-gray-subtext text-lg" />
                </button>
              </div>
            </div>

            <div className="p-3 bg-dark-surface rounded-lg border border-dark-border">
              <p className="text-gray-subtext text-xs mb-1">Recipient</p>
              <p className="text-white font-mono text-sm">
                {displayStatus.recipientAddress.slice(0, 8)}...
                {displayStatus.recipientAddress.slice(-8)}
              </p>
            </div>

            <div className="p-3 bg-dark-surface rounded-lg border border-dark-border">
              <p className="text-gray-subtext text-xs mb-1">Amount</p>
              <p className="text-primary-teal font-semibold">
                {displayStatus.amount} {displayStatus.asset.symbol}
              </p>
            </div>
          </div>

          {/* Error Message */}
          {isError && displayStatus.errorMessage && (
            <div className="p-3 bg-red-400/10 rounded-lg border border-red-400/30">
              <p className="text-red-400 text-sm">{displayStatus.errorMessage}</p>
            </div>
          )}

          {/* Real-time Status Update Info */}
          {isPending && (
            <div className="p-3 bg-blue-400/10 rounded-lg border border-blue-400/30">
              <p className="text-blue-400 text-sm">
                Your transaction is being processed. This may take a few moments.
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-dark-surface border border-dark-border rounded-lg text-white hover:bg-dark-border transition-colors"
            >
              Close
            </button>
            {isSuccess && (
              <button
                onClick={handleViewTransaction}
                className="flex-1 px-4 py-2 bg-primary-blue rounded-lg text-white font-medium hover:bg-blue-600 transition-colors flex items-center justify-center gap-2"
              >
                <MaterialIcon name="open_in_new" className="text-lg" />
                View Transaction
              </button>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
};
