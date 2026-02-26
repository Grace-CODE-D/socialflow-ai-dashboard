# Transaction Queue API

Manage blockchain transaction lifecycle with queuing and retry logic.

## Methods

### addTransaction()

Add transaction to queue.

```typescript
function addTransaction(tx: Transaction): Promise<string>
```

Returns transaction ID for tracking.

### getStatus()

Check transaction status.

```typescript
function getStatus(txId: string): Promise<TransactionStatus>

type TransactionStatus = 'pending' | 'processing' | 'success' | 'failed'
```

### retryTransaction()

Retry failed transaction.

```typescript
function retryTransaction(txId: string): Promise<void>
```

### cancelTransaction()

Cancel pending transaction.

```typescript
function cancelTransaction(txId: string): Promise<void>
```

## Queue Configuration

```typescript
const queue = new TransactionQueue({
  maxRetries: 3,
  retryDelay: 5000,
  maxConcurrent: 5
})
```

## Events

```typescript
queue.on('success', (txId, result) => {
  console.log('Transaction succeeded:', txId)
})

queue.on('failed', (txId, error) => {
  console.error('Transaction failed:', txId, error)
})
```

## Example Usage

```typescript
const txId = await queue.addTransaction(transaction)

const status = await queue.getStatus(txId)

if (status === 'failed') {
  await queue.retryTransaction(txId)
}
```
