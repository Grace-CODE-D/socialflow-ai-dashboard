import React, { useState } from 'react';
import { Asset, RecurringPayment as RecurringPaymentType } from '../../types';
import { validateRecurringPayment, calculateNextPaymentDate } from '../../services/blockchainService';
import { Card } from '../ui/Card';

const MaterialIcon = ({ name, className }: { name: string; className?: string }) => (
  <span className={`material-symbols-outlined ${className}`}>{name}</span>
);

interface RecurringPaymentSetupProps {
  isOpen: boolean;
  assets: Asset[];
  onClose: () => void;
  onSubmit: (payment: Omit<RecurringPaymentType, 'id' | 'nextPaymentDate' | 'isActive'>) => void;
}

export const RecurringPaymentSetup: React.FC<RecurringPaymentSetupProps> = ({
  isOpen,
  assets,
  onClose,
  onSubmit,
}) => {
  const [formData, setFormData] = useState<{
    recipientAddress: string;
    amount: string;
    assetId: string;
    frequency: 'daily' | 'weekly' | 'monthly';
    startDate: string;
    endDate: string;
    memo: string;
  }>({
    recipientAddress: '',
    amount: '',
    assetId: assets[0]?.id || '',
    frequency: 'monthly',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    memo: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(assets[0] || null);

  const handleAssetChange = (assetId: string) => {
    const asset = assets.find((a) => a.id === assetId);
    if (asset) {
      setSelectedAsset(asset);
      setFormData((prev) => ({ ...prev, assetId }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.recipientAddress.trim()) {
      newErrors.recipientAddress = 'Recipient address is required';
    }

    if (!formData.amount.trim()) {
      newErrors.amount = 'Amount is required';
    }

    if (!formData.startDate) {
      newErrors.startDate = 'Start date is required';
    }

    if (formData.endDate && new Date(formData.endDate) < new Date(formData.startDate)) {
      newErrors.endDate = 'End date must be after start date';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      const payment: Omit<RecurringPaymentType, 'id' | 'nextPaymentDate' | 'isActive'> = {
        recipientAddress: formData.recipientAddress,
        amount: formData.amount,
        asset: selectedAsset!,
        frequency: formData.frequency,
        startDate: new Date(formData.startDate),
        endDate: formData.endDate ? new Date(formData.endDate) : undefined,
        memo: formData.memo || undefined,
      };

      const validation = validateRecurringPayment(payment);
      if (!validation.valid) {
        setErrors({ submit: validation.error || 'Validation failed' });
        return;
      }

      onSubmit(payment);
      setFormData({
        recipientAddress: '',
        amount: '',
        assetId: assets[0]?.id || '',
        frequency: 'monthly',
        startDate: new Date().toISOString().split('T')[0],
        endDate: '',
        memo: '',
      });
      setErrors({});
    }
  };

  if (!isOpen) return null;

  const nextPaymentDate = calculateNextPaymentDate(
    new Date(formData.startDate),
    formData.frequency
  );

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 overflow-y-auto">
      <Card className="w-full max-w-md my-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">Schedule Payment</h2>
          <button
            onClick={onClose}
            className="text-gray-subtext hover:text-white transition-colors"
          >
            <MaterialIcon name="close" className="text-2xl" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Recipient Address */}
          <div>
            <label className="block text-sm font-medium text-gray-subtext mb-2">
              Recipient Address
            </label>
            <input
              type="text"
              value={formData.recipientAddress}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, recipientAddress: e.target.value }))
              }
              placeholder="G..."
              className="w-full px-4 py-2 bg-dark-surface border border-dark-border rounded-lg text-white placeholder-gray-subtext focus:outline-none focus:border-primary-blue transition-colors"
            />
            {errors.recipientAddress && (
              <p className="text-red-400 text-xs mt-1">{errors.recipientAddress}</p>
            )}
          </div>

          {/* Asset Selector */}
          <div>
            <label className="block text-sm font-medium text-gray-subtext mb-2">
              Asset
            </label>
            <select
              value={formData.assetId}
              onChange={(e) => handleAssetChange(e.target.value)}
              className="w-full px-4 py-2 bg-dark-surface border border-dark-border rounded-lg text-white focus:outline-none focus:border-primary-blue transition-colors"
            >
              {assets.map((asset) => (
                <option key={asset.id} value={asset.id}>
                  {asset.symbol} - {asset.name}
                </option>
              ))}
            </select>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-subtext mb-2">
              Amount
            </label>
            <input
              type="number"
              step="0.0000001"
              value={formData.amount}
              onChange={(e) => setFormData((prev) => ({ ...prev, amount: e.target.value }))}
              placeholder="0.00"
              className="w-full px-4 py-2 bg-dark-surface border border-dark-border rounded-lg text-white placeholder-gray-subtext focus:outline-none focus:border-primary-blue transition-colors"
            />
            {errors.amount && (
              <p className="text-red-400 text-xs mt-1">{errors.amount}</p>
            )}
          </div>

          {/* Frequency */}
          <div>
            <label className="block text-sm font-medium text-gray-subtext mb-2">
              Frequency
            </label>
            <select
              value={formData.frequency}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  frequency: e.target.value as 'daily' | 'weekly' | 'monthly',
                }))
              }
              className="w-full px-4 py-2 bg-dark-surface border border-dark-border rounded-lg text-white focus:outline-none focus:border-primary-blue transition-colors"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>

          {/* Start Date */}
          <div>
            <label className="block text-sm font-medium text-gray-subtext mb-2">
              Start Date
            </label>
            <input
              type="date"
              value={formData.startDate}
              onChange={(e) => setFormData((prev) => ({ ...prev, startDate: e.target.value }))}
              className="w-full px-4 py-2 bg-dark-surface border border-dark-border rounded-lg text-white focus:outline-none focus:border-primary-blue transition-colors"
            />
            {errors.startDate && (
              <p className="text-red-400 text-xs mt-1">{errors.startDate}</p>
            )}
          </div>

          {/* End Date */}
          <div>
            <label className="block text-sm font-medium text-gray-subtext mb-2">
              End Date (Optional)
            </label>
            <input
              type="date"
              value={formData.endDate}
              onChange={(e) => setFormData((prev) => ({ ...prev, endDate: e.target.value }))}
              className="w-full px-4 py-2 bg-dark-surface border border-dark-border rounded-lg text-white focus:outline-none focus:border-primary-blue transition-colors"
            />
            {errors.endDate && (
              <p className="text-red-400 text-xs mt-1">{errors.endDate}</p>
            )}
          </div>

          {/* Next Payment Preview */}
          <div className="p-3 bg-primary-blue/10 rounded-lg border border-primary-blue/30">
            <p className="text-gray-subtext text-xs mb-1">Next Payment</p>
            <p className="text-primary-blue font-semibold">
              {nextPaymentDate.toLocaleDateString()}
            </p>
          </div>

          {/* Memo */}
          <div>
            <label className="block text-sm font-medium text-gray-subtext mb-2">
              Memo (Optional)
            </label>
            <textarea
              value={formData.memo}
              onChange={(e) => setFormData((prev) => ({ ...prev, memo: e.target.value }))}
              placeholder="Add a note for this recurring payment..."
              rows={2}
              className="w-full px-4 py-2 bg-dark-surface border border-dark-border rounded-lg text-white placeholder-gray-subtext focus:outline-none focus:border-primary-blue transition-colors resize-none"
            />
          </div>

          {errors.submit && (
            <div className="p-3 bg-red-400/10 rounded-lg border border-red-400/30">
              <p className="text-red-400 text-sm">{errors.submit}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-dark-surface border border-dark-border rounded-lg text-white hover:bg-dark-border transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-primary-blue rounded-lg text-white font-medium hover:bg-blue-600 transition-colors"
            >
              Schedule
            </button>
          </div>
        </form>
      </Card>
    </div>
  );
};
