# Stellar Wallet Integration

This module provides a comprehensive wallet integration service for Stellar blockchain, supporting multiple wallet providers with session management and security features.

## Features

- **Multi-Wallet Support**: Freighter and Albedo wallet providers
- **Session Persistence**: Encrypted session storage with auto-reconnect
- **Security**: 30-minute inactivity timeout with activity tracking
- **Provider Detection**: Automatic detection of installed wallet extensions
- **Transaction Signing**: Support for transaction and auth entry signing
- **Error Handling**: Comprehensive error handling with typed exceptions

## Architecture

```
src/blockchain/
├── types/
│   └── wallet.ts              # Type definitions and interfaces
├── services/
│   ├── providers/
│   │   ├── FreighterProvider.ts   # Freighter wallet implementation
│   │   └── AlbedoProvider.ts      # Albedo wallet implementation
│   ├── WalletService.ts           # Main orchestrator service
│   └── __tests__/
│       └── WalletService.test.ts  # Unit tests
└── README.md
```

## Usage

### Basic Connection

```typescript
import { walletService } from './blockchain/services/WalletService';

// Get available wallet providers
const providers = walletService.getAvailableProviders();
console.log('Available wallets:', providers);

// Connect to Freighter on testnet
try {
  const connection = await walletService.connectWallet('Freighter', 'TESTNET');
  console.log('Connected:', connection.publicKey);
} catch (error) {
  if (error instanceof WalletException) {
    console.error('Wallet error:', error.code, error.message);
  }
}
```

### Session Management

```typescript
// On app startup, try to restore previous session
const restored = await walletService.loadSession();
if (restored) {
  console.log('Session restored');
  const connection = walletService.getActiveConnection();
  console.log('Connected as:', connection?.publicKey);
}
```

### Transaction Signing

```typescript
// Sign a transaction
try {
  const result = await walletService.signTransaction(transactionXDR);
  console.log('Signed XDR:', result.signedXDR);
  
  // Submit to Stellar network...
} catch (error) {
  if (error instanceof WalletException) {
    if (error.code === WalletError.USER_REJECTED) {
      console.log('User rejected the transaction');
    }
  }
}
```

### Switching Wallets

```typescript
// Switch from Freighter to Albedo
await walletService.switchWallet('Albedo', 'PUBLIC');
```

### Disconnect

```typescript
// Disconnect and clear session
await walletService.disconnectWallet();
```

## Wallet Providers

### Freighter

Freighter is a browser extension wallet for Stellar. Users need to install it from [freighter.app](https://freighter.app).

**Features:**
- Browser extension (Chrome, Firefox, Edge)
- Secure key storage
- Transaction signing
- Network selection

### Albedo

Albedo is a web-based wallet that doesn't require installation. It uses an intent-based API.

**Features:**
- No installation required
- Works in any browser
- Account selection
- Message signing

## Security Features

### Session Timeout
- Automatic disconnect after 30 minutes of inactivity
- Activity tracking on all wallet operations
- Session refresh on user interactions

### Session Encryption
- Session data encrypted in localStorage
- Only stores provider name and public key
- Never stores private keys

### Error Handling
- Typed error codes for different failure scenarios
- User rejection detection
- Provider availability checks

## Error Codes

```typescript
enum WalletError {
  NOT_INSTALLED = 'WALLET_NOT_INSTALLED',
  USER_REJECTED = 'USER_REJECTED',
  CONNECTION_FAILED = 'CONNECTION_FAILED',
  SIGNING_FAILED = 'SIGNING_FAILED',
  SESSION_EXPIRED = 'SESSION_EXPIRED',
  INVALID_NETWORK = 'INVALID_NETWORK',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}
```

## Testing

Run the test suite:

```bash
npm test -- WalletService.test.ts
```

Tests cover:
- Provider detection and registration
- Connection flows for each provider
- Session persistence and restoration
- Timeout and security features
- Transaction and auth entry signing
- Error handling scenarios

## Requirements Mapping

- **1.1**: Wallet type definitions and interfaces ✓
- **1.2**: Freighter wallet provider ✓
- **1.3**: Albedo wallet provider ✓
- **1.4**: WalletService orchestrator ✓
- **1.5**: Session persistence ✓
- **1.6**: Session timeout and security ✓
- **1.7**: Unit tests ✓
- **15.2**: Multi-wallet support ✓
- **15.3**: Activity tracking ✓
- **15.4**: Automatic timeout ✓
- **15.5**: Encrypted storage ✓

## Future Enhancements

- Add more wallet providers (xBull, Rabet)
- Implement proper encryption library (crypto-js)
- Add hardware wallet support
- Implement wallet connection UI components
- Add network switching functionality
- Implement transaction history tracking
