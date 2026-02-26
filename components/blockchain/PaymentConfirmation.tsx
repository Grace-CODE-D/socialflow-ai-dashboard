import React, { useState } from 'react';
import { PaymentSummary } from '../../types';
import { Card } from '../ui/Card';

const MaterialIcon = ({ name, className }: { name: string; className?: string }) => (
  <span className={`material-symbols-outlined ${className}`}>{name}</span>
);

interface PaymentConfirmationProps {
  isOpen: boolean;
  summary: PaymentSummary | null;
  isLoading: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const PaymentConfirmation: React.FC<PaymentConfirmationProps> = ({
  isOpen,
  summary,
  isLoading,
  onConfirm,
  onCancel,
}) => {
  const [isLargeAmountConfirmed, setIsLargeAmountConfirmed] = useState(false);

  if (!isOpen || !summary) return null;

  const isLargeAmount = parseFloat(summary.amount) > 1000;
  const canConfirm = !isLargeAmount || isLargeAmountConfirmed;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <Card className="w-full max-w-md">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">Confirm Payment</h2>
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="text-gray-subtext hover:text-white transition-colors disabled:opacity-50"
          >
            <MaterialIcon name="close" className="text-2xl" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Payment Summary */}
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-dark-surface rounded-lg border border-dark-border">
              <span className="text-gray-subtext text-sm">Recipient</span>
              <span className="text-white font-mono text-sm">
                {summary.recipientAddress.slice(0, 8)}...{summary.recipientAddress.slice(-8)}
              </span>
            </div>

            <div className="flex justify-between items-center p-3 bg-dark-surface rounded-lg border border-dark-border">
              <span className="text-gray-subtext text-sm">Amount</span>
              <span className="text-white font-semibold">
                {summary.amount} {summary.asset.symbol}
              </span>
            </div>

            <div className="flex justify-between items-center p-3 bg-dark-surface rounded-lg border border-dark-border">
              <span className="text-gray-subtext text-sm">Estimated Gas Fee</span>
              <span className="text-primary-teal font-semibold">
                {summary.estimatedGasFee} {summary.asset.symbol}
              </span>
            </div>

            <div className="flex justify-between items-center p-3 bg-primary-blue/10 rounded-lg border border-primary-blue/30">
              <span className="text-gray-subtext text-sm font-medium">Total Cost</span>
              <span className="text-primary-blue font-bold text-lg">
                {summary.totalCost} {summary.asset.symbol}
              </span>
            </div>

            {summary.memo && (
              <div className="p-3 bg-dark-surface rounded-lg border border-dark-border">
                <p className="text-gray-subtext text-xs mb-1">Memo</p>
                <p className="text-white text-sm break-words">{summary.memo}</p>
              </div>
            )}
          </div>

          {/* Large Amount Warning */}
          {isLargeAmount && (
            <div className="p-3 bg-yellow-500/10 rounded-lg border border-yellow-500/30">
              <div className="flex gap-2">
                <MaterialIcon name="warning" className="text-yellow-500 flex-shrink-0" />
                <div>
                  <p className="text-yellow-500 text-sm font-medium">Large Amount</p>
                  <p className="text-yellow-500/80 text-xs mt-1">
                    This is a large payment. Please confirm you want to proceed.
                  </p>
                </div>
              </div>
              <label className="flex items-center gap-2 mt-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isLargeAmountConfirmed}
                  onChange={(e) => setIsLargeAmountConfirmed(e.target.checked)}
                  className="w-4 h-4 rounded border-dark-border bg-dark-surface cursor-pointer"
                />
                <span className="text-xs text-gray-subtext">
                  I understand and want to proceed
                </span>
              </label>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              onClick={onCancel}
              disabled={isLoading}
              className="flex-1 px-4 py-2 bg-dark-surface border border-dark-border rounded-lg text-white hover:bg-dark-border transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={isLoading || !canConfirm}
              className="flex-1 px-4 py-2 bg-primary-blue rounded-lg text-white font-medium hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading && <MaterialIcon name="hourglass_top" className="animate-spin text-lg" />}
              {isLoading ? 'Processing...' : 'Confirm'}
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
};
