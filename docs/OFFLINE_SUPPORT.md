# Offline Support Implementation

## Overview
This implementation adds offline support to SocialFlow, allowing users to queue blockchain transactions when offline and automatically sync when connectivity is restored.

## Features Implemented

### 1. Transaction Queue (IndexedDB)
- **File**: `services/offlineQueue.ts`
- Stores queued transactions in IndexedDB for persistence
- Supports multiple transaction types: payment, token_transfer, nft_mint, analytics, identity_update
- Automatic retry mechanism with configurable max retries (default: 3)
- Transaction status tracking: pending, processing, failed

### 2. Offline Indicator UI
- **File**: `components/OfflineIndicator.tsx`
- Visual indicator showing online/offline status
- Displays count of pending transactions
- Real-time updates every 5 seconds
- Positioned at bottom-right of screen

### 3. Auto-Sync on Reconnection
- Listens to browser online/offline events
- Automatically processes queue when network is restored
- Handles concurrent transaction processing

## Usage

### Initialize Offline Queue
```typescript
import { offlineQueue } from './services/offlineQueue';

// Initialize on app start
await offlineQueue.init();
```

### Queue a Transaction
```typescript
// Queue a payment when offline
const txId = await offlineQueue.enqueue('payment', {
  recipient: 'GXXX...',
  amount: 100,
  asset: 'XLM'
});
```

### Check Queue Status
```typescript
// Get pending transaction count
const count = await offlineQueue.getPendingCount();

// Get failed transactions
const failed = await offlineQueue.getFailedTransactions();

// Retry a failed transaction
await offlineQueue.retryFailed(transactionId);
```

## Database Schema

### IndexedDB Structure
- **Database Name**: `socialflow-offline-queue`
- **Store**: `transactions`
- **Indexes**:
  - `by-status`: For filtering by transaction status
  - `by-timestamp`: For chronological ordering

### Transaction Object
```typescript
{
  id: string;              // Unique transaction ID
  type: string;            // Transaction type
  payload: any;            // Transaction data
  timestamp: number;       // Creation time
  retryCount: number;      // Number of retry attempts
  status: string;          // pending | processing | failed
  error?: string;          // Error message if failed
}
```

## Integration Points

### App.tsx
- Initializes offline queue on mount
- Renders OfflineIndicator component

### Future Integration
When blockchain services are implemented, update `executeTransaction()` method in `offlineQueue.ts`:

```typescript
private async executeTransaction(transaction: QueuedTransaction): Promise<void> {
  switch (transaction.type) {
    case 'payment':
      await stellarService.sendPayment(transaction.payload);
      break;
    case 'token_transfer':
      await stellarService.transferToken(transaction.payload);
      break;
    // ... other cases
  }
}
```

## Testing
Run offline queue tests:
```bash
npm run test
```

## Configuration
- **Max Retries**: 3 (configurable in OfflineQueueService)
- **TTL**: Transactions don't expire (can be added if needed)
- **Update Interval**: UI updates every 5 seconds

## Browser Compatibility
- Requires IndexedDB support (all modern browsers)
- Uses `navigator.onLine` for network detection
- Falls back gracefully if IndexedDB unavailable
