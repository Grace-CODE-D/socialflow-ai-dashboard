import React, { useState, useEffect } from 'react';
import { Asset, PaymentFormData } from '../../types';
import { validateRecipientAddress, validateAmount } from '../../services/blockchainService';
import { Card } from '../ui/Card';

const MaterialIcon = ({ name, className }: { name: string; className?: string }) => (
  <span className={`material-symbols-outlined ${className}`}>{name}</span>
);

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  assets: Asset[];
  onSubmit: (formData: PaymentFormData) => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  assets,
  onSubmit,
}) => {
  const [formData, setFormData] = useState<PaymentFormData>({
    recipientAddress: '',
    amount: '',
    assetId: assets[0]?.id || '',
    memo: '',
  });

  const [errors, setErrors] = useState<Partial<PaymentFormData>>({});
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(assets[0] || null);

  useEffect(() => {
    if (assets.length > 0 && !selectedAsset) {
      setSelectedAsset(assets[0]);
      setFormData((prev) => ({ ...prev, assetId: assets[0].id }));
    }
  }, [assets, selectedAsset]);

  const validateForm = (): boolean => {
    const newErrors: Partial<PaymentFormData> = {};

    if (!formData.recipientAddress.trim()) {
      newErrors.recipientAddress = 'Recipient address is required';
    } else if (!validateRecipientAddress(formData.recipientAddress)) {
      newErrors.recipientAddress = 'Invalid recipient address format';
    }

    if (!formData.amount.trim()) {
      newErrors.amount = 'Amount is required';
    } else {
      const validation = validateAmount(formData.amount, selectedAsset?.balance || 0);
      if (!validation.valid) {
        newErrors.amount = validation.error;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(formData);
      setFormData({ recipientAddress: '', amount: '', assetId: assets[0]?.id || '', memo: '' });
      setErrors({});
    }
  };

  const handleAssetChange = (assetId: string) => {
    const asset = assets.find((a) => a.id === assetId);
    if (asset) {
      setSelectedAsset(asset);
      setFormData((prev) => ({ ...prev, assetId }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <Card className="w-full max-w-md">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">Send Payment</h2>
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

          {/* Balance Display */}
          {selectedAsset && (
            <div className="p-3 bg-dark-surface rounded-lg border border-dark-border">
              <p className="text-xs text-gray-subtext">Available Balance</p>
              <p className="text-lg font-semibold text-primary-teal">
                {selectedAsset.balance.toFixed(selectedAsset.decimals)} {selectedAsset.symbol}
              </p>
            </div>
          )}

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

          {/* Memo */}
          <div>
            <label className="block text-sm font-medium text-gray-subtext mb-2">
              Memo (Optional)
            </label>
            <textarea
              value={formData.memo}
              onChange={(e) => setFormData((prev) => ({ ...prev, memo: e.target.value }))}
              placeholder="Add a note for this payment..."
              rows={3}
              className="w-full px-4 py-2 bg-dark-surface border border-dark-border rounded-lg text-white placeholder-gray-subtext focus:outline-none focus:border-primary-blue transition-colors resize-none"
            />
          </div>

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
              Continue
            </button>
          </div>
        </form>
      </Card>
    </div>
  );
};
