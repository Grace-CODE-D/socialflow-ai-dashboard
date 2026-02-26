# Wallet Service Quick Start

## Installation

```bash
npm install
```

## Basic Usage

### 1. Import

```typescript
import { walletService } from './src/blockchain';
```

### 2. Connect Wallet

```typescript
// Get available wallets
const providers = walletService.getAvailableProviders();

// Connect to Freighter
const connection = await walletService.connectWallet('Freighter', 'TESTNET');
console.log(connection.publicKey);
```

### 3. Sign Transaction

```typescript
const result = await walletService.signTransaction(transactionXDR);
console.log(result.signedXDR);
```

### 4. Disconnect

```typescript
await walletService.disconnectWallet();
```

## React Hook Example

```typescript
import { useState, useEffect } from 'react';
import { walletService } from './src/blockchain';

export function useWallet() {
  const [connection, setConnection] = useState(null);

  useEffect(() => {
    walletService.loadSession().then(restored => {
      if (restored) {
        setConnection(walletService.getActiveConnection());
      }
    });
  }, []);

  const connect = async (provider: string) => {
    const conn = await walletService.connectWallet(provider, 'TESTNET');
    setConnection(conn);
  };

  const disconnect = async () => {
    await walletService.disconnectWallet();
    setConnection(null);
  };

  return { connection, connect, disconnect };
}
```

## Error Handling

```typescript
import { WalletException, WalletError } from './src/blockchain';

try {
  await walletService.connectWallet('Freighter', 'TESTNET');
} catch (error) {
  if (error instanceof WalletException) {
    switch (error.code) {
      case WalletError.NOT_INSTALLED:
        console.log('Please install the wallet extension');
        break;
      case WalletError.USER_REJECTED:
        console.log('Connection was rejected');
        break;
      default:
        console.error(error.message);
    }
  }
}
```

## Testing

```bash
# Run tests
npm test

# Watch mode
npm run test:watch

# Coverage
npm run test:coverage
```

## Supported Wallets

- **Freighter**: Browser extension (Chrome, Firefox, Edge)
- **Albedo**: Web-based, no installation required

## Security Features

- ✅ 30-minute auto-disconnect on inactivity
- ✅ Encrypted session storage
- ✅ Never stores private keys
- ✅ Activity-based session refresh

## API Reference

### walletService.getAvailableProviders()
Returns list of wallet providers with installation status.

### walletService.connectWallet(providerName, network)
Connects to specified wallet provider.
- `providerName`: 'Freighter' | 'Albedo'
- `network`: 'PUBLIC' | 'TESTNET'

### walletService.disconnectWallet()
Disconnects current wallet and clears session.

### walletService.switchWallet(providerName, network?)
Switches to different wallet provider.

### walletService.getActiveConnection()
Returns current wallet connection or null.

### walletService.signTransaction(xdr)
Signs transaction with connected wallet.

### walletService.signAuthEntry(entry)
Signs auth entry for Stellar authentication.

### walletService.loadSession()
Attempts to restore previous session.

## Common Patterns

### Auto-reconnect on App Start

```typescript
useEffect(() => {
  walletService.loadSession();
}, []);
```

### Check Connection Status

```typescript
const isConnected = walletService.getActiveConnection() !== null;
```

### Handle Multiple Wallets

```typescript
const providers = walletService.getAvailableProviders();
const installed = providers.filter(p => p.isInstalled);
```

## Troubleshooting

**Wallet not connecting?**
- Check if extension is installed
- Verify network selection
- Check browser console for errors

**Session not persisting?**
- Ensure localStorage is enabled
- Check for 30-minute timeout
- Verify no browser privacy settings blocking storage

**Tests failing?**
- Run `npm install` to ensure dependencies
- Clear Jest cache: `npx jest --clearCache`
- Check Node.js version (16+ required)

## Next Steps

1. Review full documentation in `README.md`
2. Check example component in `examples/WalletConnectExample.tsx`
3. Read implementation guide in `WALLET_IMPLEMENTATION_GUIDE.md`
4. Explore test cases in `__tests__/WalletService.test.ts`
