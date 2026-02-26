# Payment System Components

Complete blockchain payment interface for SocialFlow Dashboard with support for payments, payment requests, and recurring payments.

## Components

### PaymentModal (105.1)
Main component for initiating payments.

**Features:**
- Recipient address input with Stellar address validation
- Amount input with real-time balance validation
- Asset selector with current balance display
- Optional memo field
- Form validation with error messages

**Props:**
```typescript
interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  assets: Asset[];
  onSubmit: (formData: PaymentFormData) => void;
}
```

**Usage:**
```tsx
<PaymentModal
  isOpen={showModal}
  onClose={() => setShowModal(false)}
  assets={assets}
  onSubmit={handlePaymentSubmit}
/>
```

### PaymentConfirmation (105.2)
Displays payment summary and requires confirmation before submission.

**Features:**
- Payment summary display (recipient, amount, asset, gas fee, total)
- Large amount warning (>1000) with confirmation checkbox
- Loading state during transaction submission
- Disabled state management

**Props:**
```typescript
interface PaymentConfirmationProps {
  isOpen: boolean;
  summary: PaymentSummary | null;
  isLoading: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}
```

**Usage:**
```tsx
<PaymentConfirmation
  isOpen={showConfirmation}
  summary={paymentSummary}
  isLoading={isProcessing}
  onConfirm={handleConfirm}
  onCancel={handleCancel}
/>
```

### PaymentStatus (105.3)
Shows transaction status and real-time updates.

**Features:**
- Status display (pending, success, error)
- Transaction hash with copy-to-clipboard
- Transaction ID and details
- "View Transaction" link to block explorer
- Error message display
- Pending transaction info

**Props:**
```typescript
interface PaymentStatusProps {
  isOpen: boolean;
  transaction: TransactionStatus | null;
  onClose: () => void;
}
```

**Usage:**
```tsx
<PaymentStatus
  isOpen={showStatus}
  transaction={transaction}
  onClose={() => setShowStatus(false)}
/>
```

### PaymentRequest (105.4)
Generates and displays payment requests with QR codes.

**Features:**
- QR code generation for payment requests
- Shareable link generation
- Copy-to-clipboard for address and link
- Payment request details display
- Native share API integration
- Success indicators after copying

**Props:**
```typescript
interface PaymentRequestProps {
  isOpen: boolean;
  paymentRequest: PaymentRequest | null;
  onClose: () => void;
}
```

**Usage:**
```tsx
<PaymentRequest
  isOpen={showRequest}
  paymentRequest={paymentRequest}
  onClose={() => setShowRequest(false)}
/>
```

### RecurringPaymentSetup (105.5)
Manages recurring payment scheduling.

**Features:**
- Recipient address input
- Amount input with balance validation
- Frequency selector (daily, weekly, monthly)
- Start and end date selection
- Next payment date preview
- Optional memo field
- Form validation

**Props:**
```typescript
interface RecurringPaymentSetupProps {
  isOpen: boolean;
  assets: Asset[];
  onClose: () => void;
  onSubmit: (payment: Omit<RecurringPayment, 'id' | 'nextPaymentDate' | 'isActive'>) => void;
}
```

**Usage:**
```tsx
<RecurringPaymentSetup
  isOpen={showSetup}
  assets={assets}
  onClose={() => setShowSetup(false)}
  onSubmit={handleRecurringSubmit}
/>
```

### PaymentInterface
Complete integration component combining all payment features.

**Features:**
- Quick action buttons for all payment operations
- Recurring payments list display
- Integrated modal management
- Transaction completion callbacks

**Props:**
```typescript
interface PaymentInterfaceProps {
  assets: Asset[];
  onPaymentComplete?: (transaction: TransactionStatus) => void;
}
```

**Usage:**
```tsx
<PaymentInterface
  assets={assets}
  onPaymentComplete={handlePaymentComplete}
/>
```

## Service Layer

### blockchainService.ts

Provides blockchain operations and validations.

**Key Functions:**

#### `validateRecipientAddress(address: string): boolean`
Validates Stellar address format (starts with 'G', 56 characters).

#### `validateAmount(amount: string, balance: number): { valid: boolean; error?: string }`
Validates amount is positive and doesn't exceed balance.

#### `calculateGasFee(amount: string): string`
Calculates 1% estimated gas fee.

#### `generatePaymentSummary(formData: PaymentFormData, asset: Asset): PaymentSummary`
Creates payment summary with calculated fees.

#### `submitPayment(summary: PaymentSummary): Promise<TransactionStatus>`
Submits payment to blockchain (mock implementation).

#### `getTransactionStatus(hash: string): Promise<TransactionStatus | null>`
Retrieves transaction status from blockchain.

#### `generateQRCode(paymentRequest): Promise<string>`
Generates QR code data URL for payment request.

#### `generateShareableLink(paymentRequest): string`
Creates shareable payment request link.

#### `calculateNextPaymentDate(startDate: Date, frequency): Date`
Calculates next payment date based on frequency.

#### `validateRecurringPayment(payment): { valid: boolean; error?: string }`
Validates recurring payment configuration.

## Type Definitions

All types are defined in `types.ts`:

```typescript
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

## Testing

Comprehensive test suites included for all components and services:

- `PaymentModal.test.tsx` - Form validation, submission, asset selection
- `PaymentConfirmation.test.tsx` - Summary display, large amount warnings, loading states
- `PaymentStatus.test.tsx` - Status display, transaction details, block explorer links
- `PaymentRequest.test.tsx` - QR code, shareable links, copy functionality
- `RecurringPayment.test.tsx` - Frequency selection, date validation, recurring setup
- `blockchainService.test.ts` - All service functions and validations

**Run tests:**
```bash
npm run test
```

## Integration Example

```tsx
import { PaymentInterface } from './components/blockchain/PaymentInterface';

const Dashboard = () => {
  const assets: Asset[] = [
    {
      id: '1',
      symbol: 'USDC',
      name: 'USD Coin',
      balance: 1000,
      decimals: 6,
    },
  ];

  const handlePaymentComplete = (transaction: TransactionStatus) => {
    console.log('Payment completed:', transaction);
    // Update UI, show notification, etc.
  };

  return (
    <PaymentInterface
      assets={assets}
      onPaymentComplete={handlePaymentComplete}
    />
  );
};
```

## Blockchain Integration

Current implementation uses mock blockchain operations. To integrate with actual Stellar blockchain:

1. Replace `submitPayment()` with Stellar SDK calls
2. Update `getTransactionStatus()` to query Stellar Horizon API
3. Implement actual QR code generation with `qrcode` library
4. Connect wallet providers (Freighter, Albedo)

## Error Handling

All components include:
- Form validation with user-friendly error messages
- Loading states during async operations
- Error display in modals
- Graceful fallbacks for failed operations

## Accessibility

- Semantic HTML structure
- ARIA labels on interactive elements
- Keyboard navigation support
- Color contrast compliance
- Focus management in modals

## Performance

- Memoized components where appropriate
- Efficient re-renders with proper state management
- Lazy loading of modals
- Optimized form validation

## Future Enhancements

- Multi-signature transaction support
- Transaction history with filtering
- Payment templates
- Batch payments
- Advanced fee estimation
- Wallet integration
- Transaction notifications
