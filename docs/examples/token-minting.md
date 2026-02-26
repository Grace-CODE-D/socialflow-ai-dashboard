# Token Minting Examples

Create and distribute custom tokens on Stellar.

## Basic Token Creation

```typescript
// Create brand token
const token = await stellar.createAsset({
  code: 'BRAND',
  supply: '1000000',
  decimals: 7
})

console.log('Token created:', token.code)
console.log('Issuer:', token.issuer)
```

## Token with Metadata

```typescript
const tokenWithMeta = await stellar.createAsset({
  code: 'CREATOR',
  supply: '500000',
  metadata: {
    name: 'Creator Token',
    description: 'Community rewards token',
    website: 'https://example.com',
    image: 'ipfs://...'
  }
})
```

## Distribute Tokens

```typescript
// Batch distribution
const recipients = [
  { address: 'ADDR1', amount: '1000' },
  { address: 'ADDR2', amount: '500' },
  { address: 'ADDR3', amount: '250' }
]

await stellar.distributeTokens({
  asset: 'BRAND',
  recipients
})

console.log('Tokens distributed to', recipients.length, 'addresses')
```

## Establish Trustlines

```typescript
// User establishes trustline
await stellar.establishTrustline({
  asset: 'BRAND:ISSUER_ADDRESS',
  limit: '10000'
})

console.log('Trustline established')
```

## Token Management

```typescript
// Check token supply
const supply = await stellar.getAssetSupply('BRAND:ISSUER')

// Lock token issuance
await stellar.lockAsset('BRAND')

// Burn tokens
await stellar.burnTokens({
  asset: 'BRAND',
  amount: '1000'
})
```

## Loyalty Program Example

```typescript
// Create loyalty token
const loyalty = await stellar.createAsset({
  code: 'LOYAL',
  supply: '10000000'
})

// Reward user engagement
async function rewardUser(userId: string, points: number) {
  const address = await getUserAddress(userId)
  
  await stellar.sendPayment({
    destination: address,
    asset: 'LOYAL',
    amount: points.toString(),
    memo: 'Engagement reward'
  })
}

await rewardUser('user123', 100)
```
