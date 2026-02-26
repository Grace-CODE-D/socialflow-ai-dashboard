# Wallet Service Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     React Application                        │
│  ┌───────────────────────────────────────────────────────┐  │
│  │           WalletConnectExample.tsx                    │  │
│  │  (UI Component for wallet connection)                 │  │
│  └───────────────────┬───────────────────────────────────┘  │
│                      │                                       │
│                      ▼                                       │
│  ┌───────────────────────────────────────────────────────┐  │
│  │              WalletService (Singleton)                │  │
│  │  ┌─────────────────────────────────────────────────┐  │  │
│  │  │  Provider Registry                              │  │  │
│  │  │  - getAvailableProviders()                      │  │  │
│  │  │  - connectWallet()                              │  │  │
│  │  │  - disconnectWallet()                           │  │  │
│  │  │  - switchWallet()                               │  │  │
│  │  │  - signTransaction()                            │  │  │
│  │  │  - signAuthEntry()                              │  │  │
│  │  └─────────────────────────────────────────────────┘  │  │
│  │                                                         │  │
│  │  ┌─────────────────────────────────────────────────┐  │  │
│  │  │  Session Management                             │  │  │
│  │  │  - saveSession()                                │  │  │
│  │  │  - loadSession()                                │  │  │
│  │  │  - 30-min timeout                               │  │  │
│  │  │  - Activity tracking                            │  │  │
│  │  │  - Encrypted storage                            │  │  │
│  │  └─────────────────────────────────────────────────┘  │  │
│  └───────────────┬───────────────────┬───────────────────┘  │
│                  │                   │                       │
│                  ▼                   ▼                       │
│  ┌───────────────────────┐  ┌───────────────────────┐      │
│  │  FreighterProvider    │  │   AlbedoProvider      │      │
│  │  ┌─────────────────┐  │  │  ┌─────────────────┐  │      │
│  │  │ isInstalled()   │  │  │  │ isInstalled()   │  │      │
│  │  │ connect()       │  │  │  │ connect()       │  │      │
│  │  │ disconnect()    │  │  │  │ disconnect()    │  │      │
│  │  │ getPublicKey()  │  │  │  │ getPublicKey()  │  │      │
│  │  │ signTx()        │  │  │  │ signTx()        │  │      │
│  │  │ signAuth()      │  │  │  │ signAuth()      │  │      │
│  │  └─────────────────┘  │  │  └─────────────────┘  │      │
│  └───────────┬───────────┘  └───────────┬───────────┘      │
│              │                           │                   │
└──────────────┼───────────────────────────┼───────────────────┘
               │                           │
               ▼                           ▼
    ┌──────────────────┐      ┌──────────────────┐
    │ window.freighter │      │  window.albedo   │
    │  (Extension)     │      │  (Web/CDN)       │
    └──────────────────┘      └──────────────────┘
               │                           │
               ▼                           ▼
    ┌──────────────────────────────────────────┐
    │         Stellar Blockchain               │
    │  (PUBLIC or TESTNET Network)             │
    └──────────────────────────────────────────┘
```

## Component Layers

### Layer 1: UI Components
- **WalletConnectExample.tsx**: Example React component
- **Custom Components**: Application-specific wallet UI

### Layer 2: Service Layer
- **WalletService**: Main orchestrator and singleton instance
- **Provider Registry**: Manages multiple wallet providers
- **Session Manager**: Handles persistence and security

### Layer 3: Provider Layer
- **FreighterProvider**: Freighter wallet implementation
- **AlbedoProvider**: Albedo wallet implementation
- **Future Providers**: xBull, Rabet, etc.

### Layer 4: Wallet APIs
- **window.freighter**: Browser extension API
- **window.albedo**: Web-based wallet API

### Layer 5: Blockchain
- **Stellar Network**: PUBLIC or TESTNET

## Data Flow

### Connection Flow
```
User Click
    ↓
UI Component
    ↓
walletService.connectWallet('Freighter', 'TESTNET')
    ↓
FreighterProvider.connect()
    ↓
window.freighter.getPublicKey()
    ↓
User Approval in Extension
    ↓
Public Key Returned
    ↓
WalletService saves session
    ↓
UI Updated with connection status
```

### Transaction Signing Flow
```
Transaction Created
    ↓
UI Component
    ↓
walletService.signTransaction(xdr)
    ↓
Activity Refresh (reset timeout)
    ↓
FreighterProvider.signTransaction()
    ↓
window.freighter.signTransaction(xdr)
    ↓
User Approval in Extension
    ↓
Signed XDR Returned
    ↓
Submit to Stellar Network
```

### Session Restoration Flow
```
App Startup
    ↓
walletService.loadSession()
    ↓
Read from localStorage
    ↓
Decrypt session data
    ↓
Check expiration (30 min)
    ↓
Reconnect to provider
    ↓
Verify public key matches
    ↓
Restore connection state
```

## Security Architecture

### Session Security
```
┌─────────────────────────────────────────┐
│         Session Data (In Memory)        │
│  - Provider Name                        │
│  - Public Key                           │
│  - Network                              │
│  - Last Activity Timestamp              │
│  - Connected At Timestamp               │
└─────────────────┬───────────────────────┘
                  │
                  ▼
         ┌────────────────┐
         │   Encryption   │
         │   (Base64)     │
         └────────┬───────┘
                  │
                  ▼
         ┌────────────────┐
         │  localStorage  │
         │  (Encrypted)   │
         └────────────────┘
```

### Timeout Mechanism
```
User Activity
    ↓
refreshActivity()
    ↓
Clear existing timeout
    ↓
Set new 30-min timeout
    ↓
Save updated timestamp
    ↓
[30 minutes pass]
    ↓
Timeout fires
    ↓
disconnectWallet()
    ↓
Clear session
```

## Type System

### Core Types
```typescript
NetworkType = 'PUBLIC' | 'TESTNET'

WalletProvider {
  metadata: WalletProviderMetadata
  isInstalled(): boolean
  connect(network): Promise<string>
  disconnect(): Promise<void>
  getPublicKey(): string | null
  signTransaction(xdr, network): Promise<SignTransactionResult>
  signAuthEntry(entry, network): Promise<SignAuthEntryResult>
}

WalletConnection {
  publicKey: string
  provider: string
  network: NetworkType
  connectedAt: number
}

WalletSession {
  providerName: string
  publicKey: string
  network: NetworkType
  lastActivity: number
  connectedAt: number
}
```

## Error Handling

### Error Flow
```
Operation Attempted
    ↓
Try Block
    ↓
[Error Occurs]
    ↓
Catch Block
    ↓
Check Error Type
    ↓
┌─────────────────────────────────┐
│ User Rejection?                 │
│   → WalletError.USER_REJECTED   │
├─────────────────────────────────┤
│ Not Installed?                  │
│   → WalletError.NOT_INSTALLED   │
├─────────────────────────────────┤
│ Connection Failed?              │
│   → WalletError.CONNECTION_FAILED│
├─────────────────────────────────┤
│ Signing Failed?                 │
│   → WalletError.SIGNING_FAILED  │
└─────────────────────────────────┘
    ↓
Throw WalletException
    ↓
UI Handles Error
    ↓
Display User-Friendly Message
```

## Provider Pattern

### Adding New Provider
```typescript
// 1. Create provider class
class NewWalletProvider implements WalletProvider {
  metadata = {
    name: 'NewWallet',
    icon: '🔐',
    description: 'New wallet provider'
  };
  
  // Implement all interface methods
  isInstalled() { ... }
  connect() { ... }
  disconnect() { ... }
  getPublicKey() { ... }
  signTransaction() { ... }
  signAuthEntry() { ... }
}

// 2. Register in WalletService constructor
constructor() {
  const newWallet = new NewWalletProvider();
  this.providers.set(newWallet.metadata.name, newWallet);
}

// 3. Use immediately
walletService.connectWallet('NewWallet', 'TESTNET');
```

## State Management

### Connection States
```
┌──────────┐
│  IDLE    │ ← Initial state, no wallet connected
└────┬─────┘
     │ connectWallet()
     ▼
┌──────────┐
│CONNECTING│ ← Waiting for user approval
└────┬─────┘
     │ User approves
     ▼
┌──────────┐
│CONNECTED │ ← Active connection, can sign transactions
└────┬─────┘
     │ disconnectWallet() or timeout
     ▼
┌──────────┐
│  IDLE    │
└──────────┘
```

## Testing Architecture

### Test Structure
```
WalletService.test.ts
├── Mock Setup
│   ├── localStorage mock
│   ├── window.freighter mock
│   └── window.albedo mock
├── Provider Tests
│   ├── Detection tests
│   ├── Registration tests
│   └── Metadata tests
├── Connection Tests
│   ├── Freighter connection
│   ├── Albedo connection
│   ├── Error handling
│   └── User rejection
├── Session Tests
│   ├── Persistence
│   ├── Restoration
│   ├── Expiration
│   └── Validation
├── Security Tests
│   ├── Timeout
│   ├── Activity refresh
│   └── Encryption
└── Signing Tests
    ├── Transaction signing
    ├── Auth entry signing
    └── Error scenarios
```

## Performance Considerations

### Optimization Points
1. **Lazy Loading**: Albedo SDK loaded on-demand
2. **Singleton Pattern**: Single service instance
3. **Efficient Storage**: Minimal session data
4. **Timeout Management**: Single interval for monitoring
5. **Provider Registry**: O(1) lookup by name

## Security Considerations

### What We Store
✅ Provider name
✅ Public key
✅ Network selection
✅ Timestamps

### What We DON'T Store
❌ Private keys
❌ Seed phrases
❌ Transaction history
❌ Sensitive user data

## Extension Points

### Future Enhancements
1. **More Providers**: xBull, Rabet, Ledger
2. **Better Encryption**: Use crypto-js or similar
3. **Network Switching**: Dynamic network changes
4. **Transaction History**: Track signed transactions
5. **Multi-Account**: Support multiple accounts
6. **Hardware Wallets**: Ledger/Trezor support

## Dependencies

### Runtime
- React (UI components)
- TypeScript (type safety)

### Development
- Jest (testing)
- ts-jest (TypeScript testing)
- @types/jest (type definitions)

### External (Optional)
- Freighter extension (user installs)
- Albedo SDK (loaded from CDN)

## File Organization

```
src/blockchain/
├── types/
│   └── wallet.ts              # All type definitions
├── services/
│   ├── providers/
│   │   ├── FreighterProvider.ts
│   │   └── AlbedoProvider.ts
│   ├── WalletService.ts       # Main service
│   └── __tests__/
│       └── WalletService.test.ts
├── examples/
│   └── WalletConnectExample.tsx
├── index.ts                   # Public exports
├── README.md                  # Main documentation
├── QUICK_START.md            # Quick reference
└── ARCHITECTURE.md           # This file
```

## Best Practices

### Using the Service
1. Always check `isInstalled()` before connecting
2. Handle `WalletException` errors appropriately
3. Refresh session on app startup
4. Clear session on logout
5. Never store private keys

### Adding Providers
1. Implement full `WalletProvider` interface
2. Add comprehensive error handling
3. Support both networks (PUBLIC/TESTNET)
4. Test all methods thoroughly
5. Document provider-specific features

### Testing
1. Mock all external dependencies
2. Test error scenarios
3. Verify session persistence
4. Check timeout behavior
5. Maintain >70% coverage
