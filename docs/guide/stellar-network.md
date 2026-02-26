# Stellar Network

SocialFlow integrates deeply with the Stellar blockchain for decentralized economic primitives.

## Overview

Stellar provides fast, low-cost transactions perfect for creator economies:
- **Transaction Speed**: 3-5 seconds
- **Transaction Cost**: ~$0.00001 per operation
- **Multi-Asset Support**: XLM, USDC, custom tokens
- **Smart Contracts**: Soroban for programmable logic

## Wallet Integration

### Supported Wallets

- **Freighter**: Browser extension wallet
- **Albedo**: Web-based wallet with advanced features

### Connection Flow

```typescript
// Connect wallet
const publicKey = await connectWallet('freighter')

// Sign transaction
const signedTx = await signTransaction(transaction)

// Submit to network
const result = await submitTransaction(signedTx)
```

## Asset Management

### Create Custom Token

```typescript
const asset = await createAsset({
  code: 'CREATOR',
  issuer: publicKey,
  supply: 1000000
})
```

### Establish Trustline

```typescript
await establishTrustline({
  asset: 'CREATOR:ISSUER_ADDRESS',
  limit: '10000'
})
```

## Payment Operations

### Send Payment

```typescript
await sendPayment({
  destination: 'RECIPIENT_ADDRESS',
  asset: 'XLM',
  amount: '10'
})
```

### Path Payment

```typescript
await pathPayment({
  sendAsset: 'XLM',
  destAsset: 'USDC',
  amount: '100'
})
```

## Network Configuration

```env
# Testnet (development)
VITE_STELLAR_NETWORK=testnet
VITE_HORIZON_URL=https://horizon-testnet.stellar.org

# Mainnet (production)
VITE_STELLAR_NETWORK=mainnet
VITE_HORIZON_URL=https://horizon.stellar.org
```

## Best Practices

1. **Always Test on Testnet**: Validate transactions before mainnet
2. **Handle Errors**: Network issues can occur
3. **Verify Addresses**: Double-check recipient addresses
4. **Monitor Fees**: Track transaction costs
5. **Secure Keys**: Never expose private keys

## Resources

- [Stellar Documentation](https://developers.stellar.org)
- [Stellar Laboratory](https://laboratory.stellar.org)
- [Stellar Expert](https://stellar.expert)
