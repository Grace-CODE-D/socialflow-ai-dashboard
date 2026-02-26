# AI Content Generation Examples

Advanced examples for AI-powered content creation.

## Multi-Platform Content

```typescript
const platforms = ['twitter', 'instagram', 'linkedin']

const posts = await Promise.all(
  platforms.map(platform => 
    gemini.generateContent({
      prompt: 'Launch announcement for new feature',
      platform,
      tone: 'professional'
    })
  )
)

posts.forEach((content, i) => {
  console.log(`${platforms[i]}:`, content)
})
```

## Sentiment Analysis

```typescript
const comments = [
  'This is amazing!',
  'Not sure about this...',
  'Absolutely love it!'
]

const sentiments = await Promise.all(
  comments.map(text => gemini.analyzeSentiment(text))
)

sentiments.forEach((result, i) => {
  console.log(`Comment: ${comments[i]}`)
  console.log(`Sentiment: ${result.label} (${result.score})`)
})
```

## Automated Responses

```typescript
const userMessage = 'How do I mint a token?'

const response = await gemini.generateResponse({
  message: userMessage,
  context: 'customer support',
  tone: 'helpful',
  includeLinks: true
})

console.log('AI Response:', response)
```

## Hashtag Generation

```typescript
const content = 'Launching our new Web3 creator platform'

const hashtags = await gemini.generateHashtags(content, 5)

console.log('Suggested hashtags:', hashtags)
// Output: ['#Web3', '#CreatorEconomy', '#Blockchain', '#NFT', '#Crypto']
```

## Content Optimization

```typescript
const draft = 'Check out our new thing'

const optimized = await gemini.optimizeContent({
  content: draft,
  platform: 'twitter',
  goals: ['engagement', 'clarity', 'cta']
})

console.log('Optimized:', optimized)
```
