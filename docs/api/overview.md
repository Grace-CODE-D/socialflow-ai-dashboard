# API Overview

SocialFlow provides a comprehensive API for blockchain and AI operations.

## Core Services

### Gemini Service
AI-powered content generation and analysis.

### Stellar Service
Blockchain operations and wallet management.

### Transaction Queue
Transaction lifecycle management.

## Service Architecture

```typescript
// Service pattern
interface Service {
  initialize(): Promise<void>
  execute(params: Params): Promise<Result>
  cleanup(): Promise<void>
}
```

## Error Handling

All services use consistent error handling:

```typescript
try {
  const result = await service.execute(params)
} catch (error) {
  if (error instanceof ServiceError) {
    // Handle service-specific error
  }
}
```

## Type Safety

Full TypeScript support with strict typing:

```typescript
interface CreatePostParams {
  content: string
  platforms: Platform[]
  media?: string[]
  scheduledTime?: Date
}
```

## Next Steps

- [Gemini Service API](/api/gemini-service)
- [Stellar Service API](/api/stellar-service)
- [Transaction Queue API](/api/transaction-queue)
