# SocialFlow API Reference

## Overview

This document provides comprehensive API documentation for all SocialFlow services, interfaces, and public methods.

---

## Table of Contents

1. [Gemini AI Service](#gemini-ai-service)
2. [Type Definitions](#type-definitions)
3. [Error Handling](#error-handling)
4. [Best Practices](#best-practices)
5. [Webhooks](#webhooks)

---

## Gemini AI Service

**Module:** `services/geminiService`

The Gemini AI Service provides intelligent content generation and automation capabilities powered by Google's Gemini AI models.

### Configuration

```typescript
// Environment Variables Required
API_KEY=your_google_gemini_api_key
```

### Error Codes

| Code | Description | Resolution |
|------|-------------|------------|
| `GEMINI_INVALID_API_KEY` | API key is missing or invalid | Set valid API_KEY in environment variables |
| `GEMINI_NETWORK_ERROR` | Network request failed | Check internet connection and retry |
| `GEMINI_RATE_LIMIT` | Rate limit exceeded | Implement exponential backoff |
| `GEMINI_INVALID_INPUT` | Invalid input parameters | Validate input before calling |
| `GEMINI_GENERATION_FAILED` | Model generation failed | Check API status and retry |

### Methods

#### `generateCaption()`

Generates AI-powered social media captions optimized for specific platforms.

**Signature:**
```typescript
generateCaption(
  topic: string,
  platform: string,
  tone?: string
): Promise<string>
```

**Parameters:**
- `topic` (string, required): The subject or theme for the caption
- `platform` (string, required): Target social media platform
  - Supported: `'instagram'`, `'tiktok'`, `'facebook'`, `'youtube'`, `'linkedin'`, `'x'`
- `tone` (string, optional): Desired tone of voice
  - Default: `'professional'`
  - Options: `'professional'`, `'casual'`, `'friendly'`, `'formal'`, `'exciting'`, `'humorous'`

**Returns:**
- `Promise<string>`: Generated caption with relevant hashtags

**Throws:**
- `GeminiServiceError`: When API key is invalid or generation fails

**Example:**
```typescript
import { generateCaption } from './services/geminiService';

// Basic usage
const caption = await generateCaption(
  'New product launch',
  'instagram'
);

// With custom tone
const excitingCaption = await generateCaption(
  'Summer sale announcement',
  'tiktok',
  'exciting'
);

// Error handling
try {
  const caption = await generateCaption(topic, platform, tone);
  console.log('Generated:', caption);
} catch (error) {
  if (error instanceof GeminiServiceError) {
    console.error(`Error ${error.code}:`, error.message);
  }
}
```

---

#### `generateReply()`

Generates intelligent quick reply suggestions based on conversation context.

**Signature:**
```typescript
generateReply(
  conversationHistory: string
): Promise<string[]>
```

**Parameters:**
- `conversationHistory` (string, required): Complete conversation thread for context analysis
  - Format: Multi-line string with speaker labels
  - Example: `"User: Question?\nYou: Response."`

**Returns:**
- `Promise<string[]>`: Array of 3 suggested reply messages

**Throws:**
- `GeminiServiceError`: When API key is invalid or generation fails

**Example:**
```typescript
import { generateReply } from './services/geminiService';

// Build conversation history
const history = `
User: When will my order arrive?
You: We're checking on that for you.
User: It's been 2 weeks already.
`;

// Generate replies
const suggestions = await generateReply(history);
console.log(suggestions);
// Output:
// [
//   "I sincerely apologize for the delay. Let me escalate this immediately.",
//   "I understand your frustration. I'll get you a tracking update within the hour.",
//   "Thank you for your patience. I'm contacting our shipping team now."
// ]

// Use in UI
suggestions.forEach((reply, index) => {
  console.log(`Option ${index + 1}: ${reply}`);
});
```

---

## Type Definitions

**Module:** `types.ts`

### Enums

#### `View`

Application view navigation states.

```typescript
enum View {
  DASHBOARD = 'DASHBOARD',
  ANALYTICS = 'ANALYTICS',
  CALENDAR = 'CALENDAR',
  CREATE_POST = 'CREATE_POST',
  MEDIA_LIBRARY = 'MEDIA_LIBRARY',
  INBOX = 'INBOX',
  SETTINGS = 'SETTINGS'
}
```

#### `Platform`

Supported social media platforms.

```typescript
enum Platform {
  INSTAGRAM = 'instagram',
  TIKTOK = 'tiktok',
  FACEBOOK = 'facebook',
  YOUTUBE = 'youtube',
  LINKEDIN = 'linkedin',
  X = 'x'
}
```

### Interfaces

#### `Post`

Represents a social media post with scheduling and analytics.

```typescript
interface Post {
  id: string;                    // Unique identifier
  platform: Platform;            // Target platform
  content: string;               // Post text content
  image?: string;                // Optional image URL
  date: Date;                    // Scheduled/published date
  status: 'scheduled' | 'published' | 'draft';
  stats?: {
    likes: number;
    views: number;
  };
}
```

**Example:**
```typescript
const post: Post = {
  id: 'post_123',
  platform: Platform.INSTAGRAM,
  content: 'Check out our new feature! 🚀 #innovation',
  image: 'https://example.com/image.jpg',
  date: new Date('2026-03-01'),
  status: 'scheduled',
  stats: {
    likes: 0,
    views: 0
  }
};
```

---

#### `Message`

Individual message in a conversation thread.

```typescript
interface Message {
  id: string;           // Unique message identifier
  sender: string;       // Sender name
  avatar: string;       // Avatar URL
  text: string;         // Message content
  timestamp: string;    // ISO timestamp
  isMe: boolean;        // True if sent by user
}
```

---

#### `Conversation`

Complete conversation thread with metadata.

```typescript
interface Conversation {
  id: string;                              // Unique conversation ID
  platform: 'instagram' | 'facebook' | 'x'; // Source platform
  user: string;                            // Other participant name
  avatar: string;                          // Participant avatar URL
  lastMessage: string;                     // Preview text
  unread: boolean;                         // Unread status
  status: 'new' | 'pending' | 'resolved';  // Conversation state
  messages: Message[];                     // Full message history
}
```

**Example:**
```typescript
const conversation: Conversation = {
  id: 'conv_456',
  platform: 'instagram',
  user: 'john_doe',
  avatar: 'https://example.com/avatar.jpg',
  lastMessage: 'Thanks for the quick response!',
  unread: false,
  status: 'resolved',
  messages: [
    {
      id: 'msg_1',
      sender: 'john_doe',
      avatar: 'https://example.com/avatar.jpg',
      text: 'Hi, I have a question',
      timestamp: '2026-02-25T10:00:00Z',
      isMe: false
    },
    {
      id: 'msg_2',
      sender: 'SocialFlow',
      avatar: 'https://example.com/brand.jpg',
      text: 'Happy to help! What can I assist with?',
      timestamp: '2026-02-25T10:01:00Z',
      isMe: true
    }
  ]
};
```

---

#### `AnalyticsStorageSettings`

Configuration for blockchain-based analytics storage.

```typescript
interface AnalyticsStorageSettings {
  storageFrequency: 'daily' | 'weekly' | 'monthly' | 'manual';
  autoStorage: boolean;
  estimatedMonthlyCost: number;
  storageHistory: StorageRecord[];
}
```

---

#### `StorageRecord`

Individual blockchain storage transaction record.

```typescript
interface StorageRecord {
  id: string;                                    // Record identifier
  timestamp: Date;                               // Storage time
  dataSize: number;                              // Size in bytes
  transactionHash?: string;                      // Blockchain tx hash
  cost: number;                                  // Cost in XLM
  status: 'pending' | 'completed' | 'failed';    // Transaction status
}
```

---

## Error Handling

### GeminiServiceError

Custom error class for Gemini AI operations.

```typescript
class GeminiServiceError extends Error {
  code: GeminiErrorCode;
  originalError?: unknown;
}
```

**Usage:**
```typescript
import { generateCaption, GeminiServiceError, GeminiErrorCode } from './services/geminiService';

try {
  const caption = await generateCaption(topic, platform);
} catch (error) {
  if (error instanceof GeminiServiceError) {
    switch (error.code) {
      case GeminiErrorCode.INVALID_API_KEY:
        console.error('Please configure your API key');
        break;
      case GeminiErrorCode.RATE_LIMIT:
        console.error('Rate limit exceeded, please wait');
        break;
      case GeminiErrorCode.NETWORK_ERROR:
        console.error('Network error, retrying...');
        break;
      default:
        console.error('Generation failed:', error.message);
    }
  }
}
```

---

## Best Practices

### 1. API Key Management

```typescript
// ✅ Good: Use environment variables
const apiKey = process.env.API_KEY;

// ❌ Bad: Hardcode API keys
const apiKey = 'AIza...'; // Never do this!
```

### 2. Error Handling

```typescript
// ✅ Good: Comprehensive error handling
try {
  const result = await generateCaption(topic, platform);
  return result;
} catch (error) {
  if (error instanceof GeminiServiceError) {
    // Handle specific error types
    logError(error.code, error.message);
  }
  throw error;
}

// ❌ Bad: Silent failures
const result = await generateCaption(topic, platform).catch(() => '');
```

### 3. Input Validation

```typescript
// ✅ Good: Validate before calling
if (!topic || !platform) {
  throw new Error('Missing required parameters');
}
const caption = await generateCaption(topic, platform);

// ❌ Bad: No validation
const caption = await generateCaption(topic, platform);
```

### 4. Rate Limiting

```typescript
// ✅ Good: Implement rate limiting
import pLimit from 'p-limit';
const limit = pLimit(5); // Max 5 concurrent requests

const captions = await Promise.all(
  topics.map(topic => 
    limit(() => generateCaption(topic, platform))
  )
);
```

### 5. Caching

```typescript
// ✅ Good: Cache frequently used results
const cache = new Map<string, string>();

async function getCachedCaption(topic: string, platform: string) {
  const key = `${topic}-${platform}`;
  if (cache.has(key)) {
    return cache.get(key)!;
  }
  const caption = await generateCaption(topic, platform);
  cache.set(key, caption);
  return caption;
}
```

---

## Webhooks

**Module:** `src/schemas/webhooks.ts`

To ensure consistency across the ecosystem, all incoming and outgoing webhooks follow a standardized JSON schema and TypeScript interfaces.

### Standard Webhook Payload

All webhooks share a standard envelope containing metadata about the event and a `data` field for the specific payload.

```typescript
interface WebhookEvent<T = any> {
  id: string;                    // Unique identifier for the webhook event
  version: string;               // Schema version (e.g., '1.0')
  event: string;                 // The event type identifier
  createdAt: string;             // ISO 8601 timestamp
  source: string;                // Source system generating the event
  data: T;                       // The event-specific payload
}
```

### Supported Event Types

- `post.published`: Emitted when a scheduled post goes live.
- `post.failed`: Emitted when a post fails to publish.
- `analytics.report_ready`: Emitted when an async analytics report is generated.
- `blockchain.transaction_completed`: Emitted when a Stellar/Soroban transaction confirms.

### Example Payload

```json
{
  "id": "wh_1234567890",
  "version": "1.0",
  "event": "post.published",
  "createdAt": "2026-03-24T10:00:00Z",
  "source": "socialflow-core",
  "data": {
    "postId": "post_123",
    "platform": "instagram",
    "url": "https://instagram.com/p/123456",
    "publishedAt": "2026-03-24T10:00:00Z"
  }
}
```

---

## Version History

- **v1.0.0** (2026-02-25): Initial API documentation
  - Gemini AI Service documentation
  - Type definitions
  - Error handling guide
  - Best practices

---

**Last Updated:** February 25, 2026  
**Maintained By:** SocialFlow Labs
