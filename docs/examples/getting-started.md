# Getting Started with Examples

Practical code examples to help you build with SocialFlow.

## Basic Setup

```typescript
import { GeminiService } from './services/geminiService'
import { StellarService } from './services/stellarService'

// Initialize services
const gemini = new GeminiService({
  apiKey: process.env.VITE_GEMINI_API_KEY
})

const stellar = new StellarService({
  network: 'testnet'
})
```

## Create Your First Post

```typescript
// Generate AI content
const content = await gemini.generateContent({
  prompt: 'Exciting Web3 announcement',
  platform: 'twitter',
  maxLength: 280
})

// Create post
const post = {
  content,
  platforms: ['twitter'],
  timestamp: new Date()
}

console.log('Generated post:', post)
```

## Connect Wallet

```typescript
// Connect Freighter wallet
const wallet = await stellar.connectWallet('freighter')

console.log('Connected wallet:', wallet.publicKey)

// Check balance
const balance = await stellar.getBalance(wallet.publicKey)
console.log('XLM Balance:', balance)
```

## Send Payment

```typescript
// Send XLM payment
const result = await stellar.sendPayment({
  destination: 'RECIPIENT_ADDRESS',
  asset: 'XLM',
  amount: '10',
  memo: 'Thank you!'
})

console.log('Transaction hash:', result.hash)
```

## Next Examples

- [AI Content Generation](/examples/ai-content)
- [Token Minting](/examples/token-minting)
- [NFT Deployment](/examples/nft-deployment)
