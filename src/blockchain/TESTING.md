# Soroban Contract Bridge - Testing Guide

## Test Plan

This document outlines the testing strategy for the Soroban Contract Bridge implementation.

## Acceptance Criteria Verification

### ✅ 1. Successful Read-Only Contract Call

**Test Case:** Query contract state without wallet signature

```typescript
import { sorobanService } from './blockchain/services/SmartContractService';
import { ContractCallType } from './blockchain/types/soroban';
import { addressToScVal } from './blockchain/utils/sorobanHelpers';

// Test read-only call
const result = await sorobanService.invoke(
  {
    contractId: 'YOUR_CONTRACT_ID',
    method: 'balance',
    args: [addressToScVal('YOUR_ADDRESS')],
  },
  'YOUR_SOURCE_ACCOUNT',
  ContractCallType.READ_ONLY
);

console.assert(result.success === true, 'Read-only call should succeed');
console.assert(result.result !== undefined, 'Should return result');
console.log('✅ Read-only contract call successful');
```

**Expected Result:**
- No wallet signature required
- Returns contract state
- No transaction submitted to network

### ✅ 2. State-Changing Call Triggers Wallet Signature

**Test Case:** Execute transaction that modifies contract state

```typescript
import { walletService } from './blockchain/services/WalletService';

// Connect wallet
const wallet = await walletService.autoConnect();
console.assert(wallet !== null, 'Wallet should connect');

// Create sign function
const signTransaction = async (xdr: string) => {
  return await walletService.signTransaction(xdr, 'testnet');
};

// Execute state-changing call
const result = await sorobanService.invoke(
  {
    contractId: 'YOUR_CONTRACT_ID',
    method: 'transfer',
    args: [
      addressToScVal(wallet.publicKey),
      addressToScVal('RECIPIENT_ADDRESS'),
      u64ToScVal(1000000n),
    ],
  },
  wallet.publicKey,
  ContractCallType.STATE_CHANGING,
  signTransaction
);

console.assert(result.success === true, 'State-changing call should succeed');
console.assert(result.transactionHash !== undefined, 'Should return transaction hash');
console.log('✅ State-changing call triggered wallet signature');
```

**Expected Result:**
- Wallet signature popup appears
- Transaction submitted after signature
- Returns transaction hash
- Events are parsed and returned

### ✅ 3. Correct Handling of Out-of-Gas Errors

**Test Case:** Handle resource exhaustion gracefully

```typescript
// Simulate out-of-gas scenario
const result = await sorobanService.invoke(
  {
    contractId: 'YOUR_CONTRACT_ID',
    method: 'expensive_operation',
    args: [],
  },
  'YOUR_SOURCE_ACCOUNT',
  ContractCallType.STATE_CHANGING,
  signTransaction
);

if (!result.success && result.errorType === 'OUT_OF_GAS') {
  console.log('✅ Out-of-gas error correctly identified');
  console.log('Error message:', result.error);
}
```

**Expected Result:**
- Error type is `OUT_OF_GAS`
- User-friendly error message
- No transaction submitted
- Simulation catches the error before submission

### ✅ 4. Event Parsing from Transaction Metadata

**Test Case:** Extract and parse contract events

```typescript
// Execute transaction that emits events
const result = await sorobanService.invoke(
  {
    contractId: 'YOUR_CONTRACT_ID',
    method: 'transfer',
    args: [
      addressToScVal(wallet.publicKey),
      addressToScVal('RECIPIENT_ADDRESS'),
      u64ToScVal(1000000n),
    ],
  },
  wallet.publicKey,
  ContractCallType.STATE_CHANGING,
  signTransaction
);

if (result.success && result.events) {
  console.log('✅ Events parsed successfully');
  console.log('Number of events:', result.events.length);
  
  result.events.forEach((event, index) => {
    console.log(`Event ${index + 1}:`);
    console.log('  Type:', event.type);
    console.log('  Contract ID:', event.contractId);
    console.log('  Topics:', event.topic);
    console.log('  Value:', event.value);
  });
}
```

**Expected Result:**
- Events array is populated
- Each event contains type, contractId, topics, and value
- Events are correctly parsed from transaction meta XDR

### ✅ 5. WASM Deployment Helper

**Test Case:** Deploy a smart contract from WASM

```typescript
import * as fs from 'fs';

// Load WASM file
const wasmBuffer = fs.readFileSync('./path/to/contract.wasm');

// Deploy contract
const result = await sorobanService.deployWasm(
  { wasmBuffer },
  wallet.publicKey,
  signTransaction
);

console.assert(result.success === true, 'WASM deployment should succeed');
console.assert(result.contractId !== undefined, 'Should return contract ID');
console.assert(result.wasmHash !== undefined, 'Should return WASM hash');
console.log('✅ WASM deployment successful');
console.log('Contract ID:', result.contractId);
console.log('WASM Hash:', result.wasmHash);
```

**Expected Result:**
- WASM uploaded to network
- Contract instance created
- Returns contract ID and WASM hash
- Two transactions submitted (upload + create)

## Manual Testing Checklist

### Setup
- [ ] Install Freighter wallet extension
- [ ] Configure wallet for Testnet
- [ ] Fund test account with XLM
- [ ] Deploy test contract to Testnet

### Wallet Integration
- [ ] Connect Freighter wallet
- [ ] Connect Albedo wallet
- [ ] Auto-detect available wallet
- [ ] Disconnect wallet
- [ ] Handle wallet not installed error

### Read-Only Operations
- [ ] Query contract balance
- [ ] Query contract metadata
- [ ] Multiple simultaneous read calls
- [ ] Handle invalid contract ID
- [ ] Handle invalid method name

### State-Changing Operations
- [ ] Transfer tokens with signature
- [ ] Mint tokens with signature
- [ ] Burn tokens with signature
- [ ] User cancels signature request
- [ ] Transaction confirmation polling

### Simulation
- [ ] Simulate before execution
- [ ] Display resource costs
- [ ] Display estimated fees
- [ ] Catch errors in simulation
- [ ] Handle simulation timeout

### Error Handling
- [ ] Out-of-gas error
- [ ] Simulation failed error
- [ ] Transaction failed error
- [ ] Network timeout error
- [ ] Invalid arguments error
- [ ] Insufficient balance error

### Event Parsing
- [ ] Parse transfer events
- [ ] Parse mint events
- [ ] Parse custom events
- [ ] Handle transactions with no events
- [ ] Fetch historical events

### WASM Deployment
- [ ] Upload WASM file
- [ ] Create contract instance
- [ ] Verify contract ID
- [ ] Handle deployment failure
- [ ] Deploy with custom salt

## Integration Testing

### React Hook Testing

```typescript
import { renderHook, act } from '@testing-library/react-hooks';
import { useSorobanContract } from './blockchain/hooks/useSorobanContract';

test('useSorobanContract hook', async () => {
  const { result } = renderHook(() => 
    useSorobanContract('CONTRACT_ID', 'TESTNET')
  );

  // Test wallet connection
  await act(async () => {
    await result.current.connectWallet();
  });

  expect(result.current.isConnected).toBe(true);
  expect(result.current.wallet).not.toBeNull();

  // Test read contract
  await act(async () => {
    const balance = await result.current.readContract('balance', []);
    expect(balance).toBeDefined();
  });
});
```

## Performance Testing

### Metrics to Monitor
- Simulation time: < 2 seconds
- Transaction submission: < 1 second
- Transaction confirmation: < 10 seconds
- Event parsing: < 500ms
- Wallet connection: < 3 seconds

## Security Testing

### Security Checklist
- [ ] Private keys never exposed
- [ ] All signing delegated to wallet
- [ ] XDR validated before signing
- [ ] Network passphrase verified
- [ ] Resource limits enforced
- [ ] Input validation on all parameters
- [ ] Error messages don't leak sensitive data

## Network Testing

### Test on Multiple Networks
- [ ] Testnet operations
- [ ] Mainnet operations (with caution)
- [ ] Futurenet operations
- [ ] Network switching
- [ ] Handle network downtime

## Browser Compatibility

### Test Browsers
- [ ] Chrome/Chromium
- [ ] Firefox
- [ ] Safari
- [ ] Edge
- [ ] Brave

## Known Limitations

1. **Wallet Extensions Required**: Users must have Freighter or Albedo installed
2. **Browser Only**: Service requires browser environment for wallet integration
3. **Network Latency**: Transaction confirmation can take 5-10 seconds
4. **Resource Estimation**: Simulation provides estimates, actual costs may vary slightly

## Troubleshooting

### Common Issues

**Issue:** "Wallet not connected"
- **Solution:** Ensure Freighter/Albedo is installed and unlocked

**Issue:** "Simulation failed"
- **Solution:** Check contract ID, method name, and argument types

**Issue:** "Out of gas"
- **Solution:** Increase resource limits or optimize contract code

**Issue:** "Transaction timeout"
- **Solution:** Check network status, retry transaction

**Issue:** "Invalid contract ID"
- **Solution:** Verify contract is deployed on the correct network

## Test Results Template

```
Test Date: ___________
Tester: ___________
Network: [ ] Testnet [ ] Mainnet [ ] Futurenet

Acceptance Criteria:
[ ] Read-only contract call successful
[ ] State-changing call triggers wallet signature
[ ] Out-of-gas errors handled correctly
[ ] Events parsed from transaction metadata
[ ] WASM deployment successful

Notes:
_________________________________
_________________________________
_________________________________
```

## Continuous Integration

For automated testing, consider:
1. Mock wallet service for unit tests
2. Use Stellar Quickstart for integration tests
3. Deploy test contracts automatically
4. Run tests on every PR
5. Monitor test coverage (target: >80%)
