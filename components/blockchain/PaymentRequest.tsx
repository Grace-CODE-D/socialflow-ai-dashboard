import React, { useState, useEffect } from 'react';
import { PaymentRequest as PaymentRequestType } from '../../types';
import { generateQRCode, generateShareableLink } from '../../services/blockchainService';
import { Card } from '../ui/Card';

const MaterialIcon = ({ name, className }: { name: string; className?: string }) => (
  <span className={`material-symbols-outlined ${className}`}>{name}</span>
);

interface PaymentRequestProps {
  isOpen: boolean;
  paymentRequest: PaymentRequestType | null;
  onClose: () => void;
}

export const PaymentRequest: React.FC<PaymentRequestProps> = ({
  isOpen,
  paymentRequest,
  onClose,
}) => {
  const [qrCode, setQrCode] = useState<string>('');
  const [shareableLink, setShareableLink] = useState<string>('');
  const [copied, setCopied] = useState<'link' | 'address' | null>(null);

  useEffect(() => {
    if (paymentRequest) {
      generateQRCode(paymentRequest).then(setQrCode);
      setShareableLink(generateShareableLink(paymentRequest));
    }
  }, [paymentRequest]);

  if (!isOpen || !paymentRequest) return null;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareableLink);
    setCopied('link');
    setTimeout(() => setCopied(null), 2000);
  };

  const handleCopyAddress = () => {
    navigator.clipboard.writeText(paymentRequest.recipientAddress);
    setCopied('address');
    setTimeout(() => setCopied(null), 2000);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Payment Request',
          text: `Send ${paymentRequest.amount} ${paymentRequest.asset.symbol} to my wallet`,
          url: shareableLink,
        });
      } catch (err) {
        console.error('Share failed:', err);
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <Card className="w-full max-w-md">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">Payment Request</h2>
          <button
            onClick={onClose}
            className="text-gray-subtext hover:text-white transition-colors"
          >
            <MaterialIcon name="close" className="text-2xl" />
          </button>
        </div>

        <div className="space-y-4">
          {/* QR Code */}
          {qrCode && (
            <div className="flex justify-center p-4 bg-dark-surface rounded-lg border border-dark-border">
              <img src={qrCode} alt="Payment QR Code" className="w-40 h-40" />
            </div>
          )}

          {/* Request Details */}
          <div className="space-y-3">
            <div className="p-3 bg-dark-surface rounded-lg border border-dark-border">
              <p className="text-gray-subtext text-xs mb-1">Amount Requested</p>
              <p className="text-primary-teal font-semibold text-lg">
                {paymentRequest.amount} {paymentRequest.asset.symbol}
              </p>
            </div>

            <div className="p-3 bg-dark-surface rounded-lg border border-dark-border">
              <p className="text-gray-subtext text-xs mb-1">Recipient Address</p>
              <div className="flex items-center justify-between gap-2">
                <p className="text-white font-mono text-sm break-all flex-1">
                  {paymentRequest.recipientAddress.slice(0, 8)}...
                  {paymentRequest.recipientAddress.slice(-8)}
                </p>
                <button
                  onClick={handleCopyAddress}
                  className="p-2 hover:bg-dark-border rounded transition-colors flex-shrink-0"
                  title="Copy address"
                >
                  <MaterialIcon
                    name={copied === 'address' ? 'check' : 'content_copy'}
                    className={`text-lg ${copied === 'address' ? 'text-green-400' : 'text-gray-subtext'}`}
                  />
                </button>
              </div>
            </div>

            {paymentRequest.memo && (
              <div className="p-3 bg-dark-surface rounded-lg border border-dark-border">
                <p className="text-gray-subtext text-xs mb-1">Memo</p>
                <p className="text-white text-sm break-words">{paymentRequest.memo}</p>
              </div>
            )}

            <div className="p-3 bg-dark-surface rounded-lg border border-dark-border">
              <p className="text-gray-subtext text-xs mb-1">Created</p>
              <p className="text-white text-sm">
                {new Date(paymentRequest.createdAt).toLocaleString()}
              </p>
            </div>
          </div>

          {/* Shareable Link */}
          <div className="p-3 bg-dark-surface rounded-lg border border-dark-border">
            <p className="text-gray-subtext text-xs mb-2">Shareable Link</p>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={shareableLink}
                readOnly
                className="flex-1 px-3 py-2 bg-dark-bg border border-dark-border rounded text-white text-xs font-mono truncate"
              />
              <button
                onClick={handleCopyLink}
                className="p-2 hover:bg-dark-border rounded transition-colors flex-shrink-0"
                title="Copy link"
              >
                <MaterialIcon
                  name={copied === 'link' ? 'check' : 'content_copy'}
                  className={`text-lg ${copied === 'link' ? 'text-green-400' : 'text-gray-subtext'}`}
                />
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-dark-surface border border-dark-border rounded-lg text-white hover:bg-dark-border transition-colors"
            >
              Close
            </button>
            {navigator.share && (
              <button
                onClick={handleShare}
                className="flex-1 px-4 py-2 bg-primary-blue rounded-lg text-white font-medium hover:bg-blue-600 transition-colors flex items-center justify-center gap-2"
              >
                <MaterialIcon name="share" className="text-lg" />
                Share
              </button>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
};
