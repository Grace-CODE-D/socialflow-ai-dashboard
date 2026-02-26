# Stellar Service API

Blockchain operations on the Stellar network.

## Methods

### connectWallet()

Connect to Stellar wallet.

```typescript
function connectWallet(type: 'freighter' | 'albedo'): Promise<Wallet>

interface Wallet {
  publicKey: string
  signTransaction(tx: Transaction): Promise<Transaction>
  signMessage(message: string): Promise<string>
}
```

### createAsset()

Create custom token.

```typescript
function createAsset(params: AssetParams): Promise<Asset>

interface AssetParams {
  code: string
  supply: string
  decimals?: number
}
```

### sendPayment()

Send payment transaction.

```typescript
function sendPayment(params: PaymentParams): Promise<TransactionResult>

interface PaymentParams {
  destination: string
  asset: string
  amount: string
  memo?: string
}
```

### establishTrustline()

Create trustline for asset.

```typescript
function establishTrustline(params: TrustlineParams): Promise<TransactionResult>

interface TrustlineParams {
  asset: string
  limit?: string
}
```

## Transaction Building

```typescript
const tx = await buildTransaction({
  source: publicKey,
  operations: [
    {
      type: 'payment',
      destination: 'RECIPIENT',
      asset: 'XLM',
      amount: '10'
    }
  ]
})
```

## Network Configuration

```typescript
const service = new StellarService({
  network: 'testnet',
  horizonUrl: 'https://horizon-testnet.stellar.org'
})
```
