import React, { useState } from 'react';
import { Asset, PaymentFormData, PaymentSummary, TransactionStatus, PaymentRequest as PaymentRequestType, RecurringPayment } from '../../types';
import { generatePaymentSummary, submitPayment, generateQRCode, generateShareableLink, calculateNextPaymentDate } from '../../services/blockchainService';
import { PaymentModal } from './PaymentModal';
import { PaymentConfirmation } from './PaymentConfirmation';
import { PaymentStatus } from './PaymentStatus';
import { PaymentRequest } from './PaymentRequest';
import { RecurringPaymentSetup } from './RecurringPayment';
import { Card } from '../ui/Card';

const MaterialIcon = ({ name, className }: { name: string; className?: string }) => (
  <span className={`material-symbols-outlined ${className}`}>{name}</span>
);

interface PaymentInterfaceProps {
  assets: Asset[];
  onPaymentComplete?: (transaction: TransactionStatus) => void;
}

export const PaymentInterface: React.FC<PaymentInterfaceProps> = ({
  assets,
  onPaymentComplete,
}) => {
  // Modal states
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showStatus, setShowStatus] = useState(false);
  const [showPaymentRequest, setShowPaymentRequest] = useState(false);
  const [showRecurringSetup, setShowRecurringSetup] = useState(false);

  // Data states
  const [paymentSummary, setPaymentSummary] = useState<PaymentSummary | null>(null);
  const [transaction, setTransaction] = useState<TransactionStatus | null>(null);
  const [paymentRequest, setPaymentRequest] = useState<PaymentRequestType | null>(null);
  const [recurringPayments, setRecurringPayments] = useState<RecurringPayment[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  // Payment Modal Handlers
  const handlePaymentSubmit = (formData: PaymentFormData) => {
    const asset = assets.find((a) => a.id === formData.assetId);
    if (asset) {
      const summary = generatePaymentSummary(formData, asset);
      setPaymentSummary(summary);
      setShowPaymentModal(false);
      setShowConfirmation(true);
    }
  };

  // Payment Confirmation Handlers
  const handleConfirmPayment = async () => {
    if (!paymentSummary) return;

    setIsProcessing(true);
    try {
      const result = await submitPayment(paymentSummary);
      setTransaction(result);
      setShowConfirmation(false);
      setShowStatus(true);
      onPaymentComplete?.(result);
    } catch (error) {
      console.error('Payment submission failed:', error);
      setTransaction({
        id: `tx-${Date.now()}`,
        hash: '',
        status: 'error',
        timestamp: new Date(),
        amount: paymentSummary.amount,
        asset: paymentSummary.asset,
        recipientAddress: paymentSummary.recipientAddress,
        errorMessage: 'Payment submission failed. Please try again.',
      });
      setShowStatus(true);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancelPayment = () => {
    setShowConfirmation(false);
    setPaymentSummary(null);
  };

  // Payment Request Handlers
  const handleGeneratePaymentRequest = async () => {
    if (!paymentSummary) return;

    const qrCode = await generateQRCode({
      id: `pr-${Date.now()}`,
      recipientAddress: paymentSummary.recipientAddress,
      amount: paymentSummary.amount,
      asset: paymentSummary.asset,
      memo: paymentSummary.memo,
      createdAt: new Date(),
    });

    const request: PaymentRequestType = {
      id: `pr-${Date.now()}`,
      recipientAddress: paymentSummary.recipientAddress,
      amount: paymentSummary.amount,
      asset: paymentSummary.asset,
      memo: paymentSummary.memo,
      qrCode,
      shareableLink: generateShareableLink({
        id: `pr-${Date.now()}`,
        recipientAddress: paymentSummary.recipientAddress,
        amount: paymentSummary.amount,
        asset: paymentSummary.asset,
        memo: paymentSummary.memo,
        qrCode,
        shareableLink: '',
        createdAt: new Date(),
      }),
      createdAt: new Date(),
    };

    setPaymentRequest(request);
    setShowPaymentRequest(true);
  };

  // Recurring Payment Handlers
  const handleRecurringPaymentSubmit = (payment: Omit<RecurringPayment, 'id' | 'nextPaymentDate' | 'isActive'>) => {
    const nextPaymentDate = calculateNextPaymentDate(payment.startDate, payment.frequency);
    const recurringPayment: RecurringPayment = {
      id: `rp-${Date.now()}`,
      ...payment,
      nextPaymentDate,
      isActive: true,
    };

    setRecurringPayments((prev) => [...prev, recurringPayment]);
    setShowRecurringSetup(false);
  };

  return (
    <div className="space-y-4">
      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <button
          onClick={() => setShowPaymentModal(true)}
          className="p-4 bg-dark-surface border border-dark-border rounded-lg hover:border-primary-blue transition-colors group"
        >
          <MaterialIcon name="send" className="text-2xl text-primary-blue mb-2 group-hover:scale-110 transition-transform" />
          <p className="text-sm font-medium text-white">Send Payment</p>
        </button>

        <button
          onClick={() => {
            setShowPaymentModal(true);
            setTimeout(() => handleGeneratePaymentRequest(), 100);
          }}
          className="p-4 bg-dark-surface border border-dark-border rounded-lg hover:border-primary-teal transition-colors group"
        >
          <MaterialIcon name="qr_code_2" className="text-2xl text-primary-teal mb-2 group-hover:scale-110 transition-transform" />
          <p className="text-sm font-medium text-white">Request Payment</p>
        </button>

        <button
          onClick={() => setShowRecurringSetup(true)}
          className="p-4 bg-dark-surface border border-dark-border rounded-lg hover:border-primary-blue transition-colors group"
        >
          <MaterialIcon name="schedule" className="text-2xl text-primary-blue mb-2 group-hover:scale-110 transition-transform" />
          <p className="text-sm font-medium text-white">Schedule Payment</p>
        </button>

        <button
          onClick={() => setShowStatus(true)}
          className="p-4 bg-dark-surface border border-dark-border rounded-lg hover:border-primary-teal transition-colors group"
        >
          <MaterialIcon name="history" className="text-2xl text-primary-teal mb-2 group-hover:scale-110 transition-transform" />
          <p className="text-sm font-medium text-white">View History</p>
        </button>
      </div>

      {/* Recurring Payments List */}
      {recurringPayments.length > 0 && (
        <Card>
          <h3 className="text-lg font-bold text-white mb-4">Recurring Payments</h3>
          <div className="space-y-3">
            {recurringPayments.map((payment) => (
              <div
                key={payment.id}
                className="p-3 bg-dark-surface rounded-lg border border-dark-border flex items-center justify-between"
              >
                <div>
                  <p className="text-white font-medium">
                    {payment.amount} {payment.asset.symbol}
                  </p>
                  <p className="text-gray-subtext text-sm">
                    {payment.frequency.charAt(0).toUpperCase() + payment.frequency.slice(1)} • Next:{' '}
                    {payment.nextPaymentDate.toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {payment.isActive && (
                    <span className="px-2 py-1 bg-green-400/10 border border-green-400/30 rounded text-green-400 text-xs font-medium">
                      Active
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Modals */}
      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        assets={assets}
        onSubmit={handlePaymentSubmit}
      />

      <PaymentConfirmation
        isOpen={showConfirmation}
        summary={paymentSummary}
        isLoading={isProcessing}
        onConfirm={handleConfirmPayment}
        onCancel={handleCancelPayment}
      />

      <PaymentStatus
        isOpen={showStatus}
        transaction={transaction}
        onClose={() => setShowStatus(false)}
      />

      <PaymentRequest
        isOpen={showPaymentRequest}
        paymentRequest={paymentRequest}
        onClose={() => setShowPaymentRequest(false)}
      />

      <RecurringPaymentSetup
        isOpen={showRecurringSetup}
        assets={assets}
        onClose={() => setShowRecurringSetup(false)}
        onSubmit={handleRecurringPaymentSubmit}
      />
    </div>
  );
};
