# Asset Minting

Create custom tokens on the Stellar network.

## Token Creation

```typescript
const token = await mintAsset({
  code: 'MYTOKEN',
  supply: 1000000,
  decimals: 7
})
```

## Configuration

- **Asset Code**: 1-12 alphanumeric characters
- **Supply**: Total token amount
- **Decimals**: Precision (default: 7)

## Distribution

```typescript
await distributeTokens({
  asset: 'MYTOKEN',
  recipients: [
    { address: 'ADDR1', amount: '1000' },
    { address: 'ADDR2', amount: '500' }
  ]
})
```

## Use Cases

- Brand loyalty tokens
- Community rewards
- Governance tokens
- Utility tokens
