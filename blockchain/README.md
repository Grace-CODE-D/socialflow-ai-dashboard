# Soroban Contract Bridge - Issue #201.3

This implementation provides extended smart contract functionality for the SocialFlow platform, including contract state queries and comprehensive testing.

## Features Implemented

### 201.7 Contract State Queries
- ✅ `getContractState(contractId)` method for retrieving contract state
- ✅ Query contract storage entries via RPC
- ✅ Parse and format state data into usable objects
- ✅ State caching with configurable TTL (default: 60 seconds)
- ✅ State change notifications with listener pattern
- ✅ Cache management (clear specific or all cached states)

### 201.8 Unit Tests for SmartContractService
- ✅ RPC connection and health check tests
- ✅ Contract invocation tests (read and write operations)
- ✅ Simulation and fee estimation tests
- ✅ WASM deployment tests
- ✅ Event parsing tests
- ✅ Error handling tests (out-of-gas, invalid params, unknown errors)
- ✅ Contract state query tests with caching and notifications

## File Structure

```
blockchain/
├── services/
│   └── SmartContractService.ts    # Main service implementation
├── types/
│   └── contract.ts                # TypeScript interfaces
└── __tests__/
    └── SmartContractService.test.ts # Comprehensive test suite
```

## Usage

### Initialize Service

```typescript
import { SmartContractService } from './blockchain/services/SmartContractService';

const service = new SmartContractService('https://soroban-testnet.stellar.org');
```

### Check RPC Health

```typescript
const isHealthy = await service.checkHealth();
```

### Query Contract State

```typescript
const state = await service.getContractState(contractId);
console.log(state); // { balance: 1000, owner: 'GABC...' }
```

### Listen to State Changes

```typescript
const unsubscribe = service.onStateChange(contractId, (newState) => {
  console.log('State updated:', newState);
});

// Later: unsubscribe()
```

### Invoke Contract

```typescript
// Write operation
const result = await service.invokeContract({
  contractId: 'C123...',
  method: 'transfer',
  params: ['sender', 'recipient', 1000]
}, false);

// Read operation
const balance = await service.invokeContract({
  contractId: 'C123...',
  method: 'getBalance',
  params: ['address']
}, true);
```

### Simulate Transaction

```typescript
const simulation = await service.simulateTransaction({
  contractId: 'C123...',
  method: 'mint',
  params: ['recipient', 100]
});

console.log('Estimated fee:', simulation.estimatedFee);
console.log('Events:', simulation.events);
```

### Deploy WASM

```typescript
const wasmBuffer = Buffer.from(wasmCode);
const wasmId = await service.deployWasm({
  wasmBuffer,
  salt: 'unique-salt'
});
```

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run with coverage
npm test -- --coverage
```

## Test Coverage

The test suite covers:
- ✅ RPC connection and health checks
- ✅ Contract invocation (read/write)
- ✅ Transaction simulation and fee estimation
- ✅ WASM deployment
- ✅ Event parsing
- ✅ Error handling (out-of-gas, invalid params)
- ✅ Contract state queries
- ✅ State caching with TTL
- ✅ State change notifications
- ✅ Cache management

Target coverage: 80% (branches, functions, lines, statements)

## Error Handling

The service provides user-friendly error messages:
- `Transaction out of gas` - Insufficient gas for execution
- `Invalid parameters` - Incorrect method parameters
- Generic error messages for other failures

## Caching Strategy

- Default TTL: 60 seconds
- Cache is automatically refreshed after TTL expires
- Manual cache clearing available per contract or globally
- Reduces RPC calls and improves performance

## State Change Notifications

Subscribe to contract state changes:
```typescript
const unsubscribe = service.onStateChange(contractId, (state) => {
  // Handle state update
});
```

Notifications are triggered when:
- State is fetched from RPC (not from cache)
- State data has changed

## Dependencies

- TypeScript 5.3+
- Jest 29.5+ (testing)
- ts-jest (TypeScript support for Jest)

## Next Steps

To integrate with the UI:
1. Create React hooks in `blockchain/hooks/useSmartContract.ts`
2. Add state management in Redux/Context
3. Build UI components for contract interaction
4. Implement real-time state monitoring

## Contributing

When adding new features:
1. Update TypeScript interfaces in `blockchain/types/`
2. Implement functionality in service
3. Add comprehensive tests
4. Update this README
