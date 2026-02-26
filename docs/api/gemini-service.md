# Gemini Service API

AI-powered content generation using Google's Gemini models.

## Methods

### generateContent()

Generate platform-optimized content.

```typescript
function generateContent(params: GenerateParams): Promise<string>

interface GenerateParams {
  prompt: string
  platform?: 'twitter' | 'instagram' | 'tiktok' | 'linkedin'
  tone?: 'professional' | 'casual' | 'friendly'
  maxLength?: number
}
```

**Example:**
```typescript
const content = await generateContent({
  prompt: 'Web3 innovation announcement',
  platform: 'twitter',
  tone: 'professional',
  maxLength: 280
})
```

### analyzeSentiment()

Analyze text sentiment and engagement potential.

```typescript
function analyzeSentiment(text: string): Promise<SentimentResult>

interface SentimentResult {
  score: number // -1 to 1
  magnitude: number
  label: 'positive' | 'neutral' | 'negative'
}
```

### generateHashtags()

Generate relevant hashtags for content.

```typescript
function generateHashtags(content: string, count?: number): Promise<string[]>
```

## Configuration

```typescript
import { GeminiService } from './services/geminiService'

const service = new GeminiService({
  apiKey: process.env.VITE_GEMINI_API_KEY,
  model: 'gemini-1.5-pro'
})
```

## Error Handling

```typescript
try {
  const content = await generateContent(params)
} catch (error) {
  if (error.code === 'RATE_LIMIT') {
    // Handle rate limiting
  }
}
```
