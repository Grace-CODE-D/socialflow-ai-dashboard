# Pull Request: Soroban Contract Bridge (Issue #201)

## Overview
This PR implements the Soroban Contract Bridge feature, enabling SocialFlow to interact with Stellar smart contracts for automated engagement distribution, budgeting treasuries, and public verification.

## Changes Made

### Core Services
- **SmartContractService** (`src/blockchain/services/SmartContractService.ts`)
  - SorobanRpc.Server connection setup
  - `invoke()` helper for contract calls (read-only and state-changing)
  - Simulation before submission for resource usage estimation
  - WASM deployment helper for admins
  - Event parsing from transaction metadata
  - Comprehensive error handling (out-of-gas, simulation failures, etc.)

- **WalletService** (`src/blockchain/services/WalletService.ts`)
  - Integration with Freighter and Albedo wallets
  - Non-custodial transaction signing
  - Auto-detection of available wallets
  - Network-aware signing

### Type Definitions
- **soroban.ts** (`src/blockchain/types/soroban.ts`)
  - ContractInvocationParams
  - ContractSimulationResult
  - ContractInvocationResult
  - WasmDeploymentParams/Result
  - Error type enums

### Configuration
- **soroban.config.ts** (`src/blockchain/config/soroban.config.ts`)
  - Network configurations (Testnet, Mainnet, Futurenet)
  - Default timeout and fee settings

### Utilities
- **sorobanHelpers.ts** (`src/blockchain/utils/sorobanHelpers.ts`)
  - ScVal conversion helpers (toScVal, fromScVal)
  - Type-specific converters (u64, i64, address, symbol, etc.)
  - Error parsing utilities
  - XLM/stroops conversion

### React Integration
- **useSorobanContract** (`src/blockchain/hooks/useSorobanContract.ts`)
  - React hook for easy contract interactions
  - Wallet connection management
  - Read/write contract methods
  - Simulation support
  - Event fetching

### Examples & Documentation
- **contractUsage.ts** - Comprehensive usage examples
- **SorobanDemo.tsx** - Interactive demo component
- **README.md** - Complete API documentation
- **TESTING.md** - Testing guide and acceptance criteria verification

## Technical Implementation

### 1. Read-Only Contract Calls
```typescript
const result = await sorobanService.invoke(
  { contractId, method: 'balance', args: [addressToScVal(userAddress)] },
  sourceAccount,
  ContractCallType.READ_ONLY
);
```
- No wallet signature required
- Uses simulation only
- Returns contract state immediately

### 2. State-Changing Calls
```typescript
const result = await sorobanService.invoke(
  { contractId, method: 'transfer', args: [...] },
  sourceAccount,
  ContractCallType.STATE_CHANGING,
  signTransaction
);
```
- Simulates first to estimate resources
- Triggers wallet signature popup
- Submits transaction to network
- Polls for confirmation
- Parses events from transaction meta

### 3. Resource Estimation
- Automatic simulation before every state-changing call
- Calculates CPU instructions and memory usage
- Estimates minimum resource fee
- Prepares transaction with proper limits

### 4. Error Handling
- **OUT_OF_GAS**: Resource limits exceeded
- **SIMULATION_FAILED**: Pre-flight check failed
- **TRANSACTION_FAILED**: Submission or execution failed
- User-friendly error messages for each type

### 5. Event Parsing
- Extracts events from transaction meta XDR
- Parses event type, topics, and values
- Returns structured event data
- Supports historical event queries

## Acceptance Criteria ✅

- [x] **Successful read-only contract call** - Implemented via `ContractCallType.READ_ONLY`
- [x] **State-changing call triggers wallet signature** - Integrated with Freighter/Albedo
- [x] **Correct handling of out-of-gas errors** - Specific error type and user-friendly messages
- [x] **Event parsing from transaction metadata** - Full XDR parsing implementation
- [x] **WASM deployment helper** - `deployWasm()` method for admins

## Testing

### Manual Testing
1. Install Freighter or Albedo wallet
2. Configure for Testnet
3. Run the demo component
4. Test read-only calls (no signature)
5. Test state-changing calls (with signature)
6. Verify error handling
7. Check event parsing

### Automated Testing
See `src/blockchain/TESTING.md` for comprehensive test plan

## Dependencies Added
- `@stellar/stellar-sdk` - Official Stellar SDK with Soroban support

## Security Considerations
- ✅ Private keys never accessed by the service
- ✅ All transaction signing delegated to wallet providers
- ✅ Simulation performed before every state-changing call
- ✅ Resource limits automatically calculated
- ✅ Network passphrase validation

## Usage Example

```typescript
import { useSorobanContract } from './blockchain/hooks/useSorobanContract';

function MyComponent() {
  const { 
    connectWallet, 
    readContract, 
    writeContract 
  } = useSorobanContract('CONTRACT_ID', 'TESTNET');

  // Connect wallet
  await connectWallet();

  // Read contract state
  const balance = await readContract('balance', [addressToScVal(address)]);

  // Execute transaction
  const result = await writeContract('transfer', [
    addressToScVal(from),
    addressToScVal(to),
    u64ToScVal(amount)
  ]);
}
```

## Next Steps
1. Integrate with SocialFlow dashboard UI
2. Create contract-specific wrappers for engagement campaigns
3. Implement real-time event listeners
4. Add transaction history tracking
5. Build admin panel for contract deployment

## Files Changed
- `package.json` - Added @stellar/stellar-sdk dependency
- `src/blockchain/` - New directory with complete implementation
  - services/ (SmartContractService, WalletService)
  - types/ (TypeScript interfaces)
  - config/ (Network configurations)
  - utils/ (Helper functions)
  - hooks/ (React integration)
  - examples/ (Usage examples)
  - components/ (Demo component)
  - README.md (Documentation)
  - TESTING.md (Test plan)
  - index.ts (Centralized exports)

## Branch
`features/issue-201-Soroban-Contract-Bridge`

## Target Branch
`develop`

## Related Issues
Closes #201

---

**Ready for Review** ✅

All acceptance criteria met. Comprehensive documentation and examples included. No TypeScript errors. Ready to merge into develop branch.
