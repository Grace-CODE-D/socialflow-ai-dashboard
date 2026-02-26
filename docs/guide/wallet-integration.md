# Wallet Integration

Connect Stellar wallets for blockchain operations.

## Supported Wallets

### Freighter
Browser extension wallet with simple interface.

### Albedo
Web-based wallet with advanced features.

## Connection

```typescript
import { connectWallet } from './services/stellarService'

const wallet = await connectWallet('freighter')
console.log('Connected:', wallet.publicKey)
```

## Operations

### Sign Transaction
```typescript
const signed = await wallet.signTransaction(transaction)
```

### Sign Message
```typescript
const signature = await wallet.signMessage('Verify ownership')
```

## Security

- Never store private keys
- Always verify transaction details
- Use secure connections only
- Implement timeout mechanisms
