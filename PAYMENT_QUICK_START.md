# Payment System - Quick Start Guide

## Overview

Complete blockchain payment interface with 5 main components and comprehensive test coverage.

## Quick Import

```tsx
import {
  PaymentModal,
  PaymentConfirmation,
  PaymentStatus,
  PaymentRequest,
  RecurringPaymentSetup,
  PaymentInterface,
} from './components/blockchain';

import {
  validateRecipientAddress,
  validateAmount,
  calculateGasFee,
  generatePaymentSummary,
  submitPayment,
} from './services/blockchainService';
```

## Basic Usage

### Option 1: Use Complete Interface (Recommended)

```tsx
import { PaymentInterface } from './components/blockchain';

export const Dashboard = () => {
  const assets = [
    {
      id: '1',
      symbol: 'USDC',
      name: 'USD Coin',
      balance: 1000,
      decimals: 6,
    },
  ];

  return (
    <PaymentInterface
      assets={assets}
      onPaymentComplete={(tx) => {
        console.log('Payment completed:', tx);
      }}
    />
  );
};
```

### Option 2: Use Individual Components

```tsx
import { PaymentModal, PaymentConfirmation } from './components/blockchain';
import { generatePaymentSummary } from './services/blockchainService';

export const CustomPaymentFlow = () => {
  const [showModal, setShowModal] = useState(false);
  const [summary, setSummary] = useState(null);

  const handlePaymentSubmit = (formData) => {
    const asset = assets.find(a => a.id === formData.assetId);
    setSummary(generatePaymentSummary(formData, asset));
    setShowModal(false);
  };

  return (
    <>
      <button onClick={() => setShowModal(true)}>Send Payment</button>
      
      <PaymentModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        assets={assets}
        onSubmit={handlePaymentSubmit}
      />

      <PaymentConfirmation
        isOpen={!!summary}
        summary={summary}
        isLoading={false}
        onConfirm={() => {/* submit */}}
        onCancel={() => setSummary(null)}
      />
    </>
  );
};
```

## Component Reference

### PaymentModal
Initiates a payment with form validation.

```tsx
<PaymentModal
  isOpen={boolean}
  onClose={() => void}
  assets={Asset[]}
  onSubmit={(formData: PaymentFormData) => void}
/>
```

### PaymentConfirmation
Confirms payment before submission.

```tsx
<PaymentConfirmation
  isOpen={boolean}
  summary={PaymentSummary | null}
  isLoading={boolean}
  onConfirm={() => void}
  onCancel={() => void}
/>
```

### PaymentStatus
Shows transaction status and details.

```tsx
<PaymentStatus
  isOpen={boolean}
  transaction={TransactionStatus | null}
  onClose={() => void}
/>
```

### PaymentRequest
Generates shareable payment requests with QR code.

```tsx
<PaymentRequest
  isOpen={boolean}
  paymentRequest={PaymentRequest | null}
  onClose={() => void}
/>
```

### RecurringPaymentSetup
Schedules recurring payments.

```tsx
<RecurringPaymentSetup
  isOpen={boolean}
  assets={Asset[]}
  onClose={() => void}
  onSubmit={(payment) => void}
/>
```

## Service Functions

### Validation

```tsx
// Validate Stellar address
validateRecipientAddress('GBRPYHIL2CI3WHZDTOOQFC6EB4CGQOFSNHERX3LRJCX5FWCL46664F3')
// => true

// Validate amount
validateAmount('100', 1000)
// => { valid: true }

validateAmount('2000', 1000)
// => { valid: false, error: 'Insufficient balance' }
```

### Calculations

```tsx
// Calculate gas fee (1%)
calculateGasFee('100')
// => '1.0000000'

// Generate payment summary
generatePaymentSummary(formData, asset)
// => PaymentSummary with calculated fees

// Calculate next payment date
calculateNextPaymentDate(new Date(), 'weekly')
// => Date (7 days from now)
```

### Blockchain Operations

```tsx
// Submit payment
const tx = await submitPayment(summary)
// => TransactionStatus

// Get transaction status
const status = await getTransactionStatus(hash)
// => TransactionStatus | null

// Generate QR code
const qrCode = await generateQRCode(paymentRequest)
// => 'data:image/svg+xml,...'

// Generate shareable link
const link = generateShareableLink(paymentRequest)
// => 'https://example.com?payment=...'
```

## Type Definitions

```tsx
interface Asset {
  id: string;
  symbol: string;
  name: string;
  balance: number;
  decimals: number;
  icon?: string;
}

interface PaymentFormData {
  recipientAddress: string;
  amount: string;
  assetId: string;
  memo?: string;
}

interface PaymentSummary {
  recipientAddress: string;
  amount: string;
  asset: Asset;
  estimatedGasFee: string;
  totalCost: string;
  memo?: string;
}

interface TransactionStatus {
  id: string;
  hash: string;
  status: 'pending' | 'success' | 'error';
  timestamp: Date;
  amount: string;
  asset: Asset;
  recipientAddress: string;
  errorMessage?: string;
}

interface PaymentRequest {
  id: string;
  recipientAddress: string;
  amount: string;
  asset: Asset;
  memo?: string;
  qrCode: string;
  shareableLink: string;
  createdAt: Date;
}

interface RecurringPayment {
  id: string;
  recipientAddress: string;
  amount: string;
  asset: Asset;
  frequency: 'daily' | 'weekly' | 'monthly';
  startDate: Date;
  endDate?: Date;
  nextPaymentDate: Date;
  isActive: boolean;
  memo?: string;
}
```

## Common Patterns

### Complete Payment Flow

```tsx
const [showModal, setShowModal] = useState(false);
const [summary, setSummary] = useState<PaymentSummary | null>(null);
const [transaction, setTransaction] = useState<TransactionStatus | null>(null);
const [isProcessing, setIsProcessing] = useState(false);

const handlePaymentSubmit = (formData: PaymentFormData) => {
  const asset = assets.find(a => a.id === formData.assetId);
  if (asset) {
    setSummary(generatePaymentSummary(formData, asset));
    setShowModal(false);
  }
};

const handleConfirm = async () => {
  if (!summary) return;
  setIsProcessing(true);
  try {
    const tx = await submitPayment(summary);
    setTransaction(tx);
  } finally {
    setIsProcessing(false);
  }
};

return (
  <>
    <button onClick={() => setShowModal(true)}>Send Payment</button>

    <PaymentModal
      isOpen={showModal}
      onClose={() => setShowModal(false)}
      assets={assets}
      onSubmit={handlePaymentSubmit}
    />

    <PaymentConfirmation
      isOpen={!!summary}
      summary={summary}
      isLoading={isProcessing}
      onConfirm={handleConfirm}
      onCancel={() => setSummary(null)}
    />

    <PaymentStatus
      isOpen={!!transaction}
      transaction={transaction}
      onClose={() => setTransaction(null)}
    />
  </>
);
```

### Validation Example

```tsx
const handleAmountChange = (amount: string) => {
  const validation = validateAmount(amount, selectedAsset.balance);
  if (!validation.valid) {
    setError(validation.error);
  } else {
    setError(null);
  }
};
```

## Testing

Run all tests:
```bash
npm run test
```

Run specific test file:
```bash
npm run test PaymentModal.test.tsx
```

Run with coverage:
```bash
npm run test -- --coverage
```

## File Locations

- Components: `components/blockchain/`
- Services: `services/blockchainService.ts`
- Types: `types.ts`
- Tests: `components/blockchain/__tests__/` and `services/__tests__/`
- Documentation: `components/blockchain/README.md`

## Next Steps

1. **Integrate with Stellar SDK**
   - Replace mock `submitPayment()` with real blockchain calls
   - Connect to Horizon API for transaction queries
   - Implement wallet providers

2. **Add Notifications**
   - Toast notifications for user feedback
   - Email notifications for recurring payments

3. **Enhance Features**
   - Transaction history
   - Payment templates
   - Batch payments
   - Advanced fee estimation

## Troubleshooting

### Address Validation Fails
- Ensure address starts with 'G'
- Ensure address is exactly 56 characters
- Check for typos

### Amount Validation Fails
- Ensure amount is positive
- Ensure amount doesn't exceed balance
- Check decimal places

### Modal Not Showing
- Verify `isOpen` prop is `true`
- Check z-index conflicts with other modals
- Ensure parent component is rendering

## Support

For detailed documentation, see:
- `components/blockchain/README.md` - Component documentation
- `PAYMENT_SYSTEM_IMPLEMENTATION.md` - Implementation details
- Test files - Usage examples and edge cases
