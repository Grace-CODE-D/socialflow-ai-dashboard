# Circuit Breaker Quick Start Guide

## What You Get

Circuit breaker protection for all external API calls to prevent cascading failures.

## 5-Minute Setup

### 1. Install Dependencies (Already Done)

```bash
npm install opossum @types/opossum
```

### 2. Use Protected Services

```typescript
import { aiService } from './services/AIService';
import { twitterService } from './services/TwitterService';

// AI calls are automatically protected
const caption = await aiService.generateCaption('topic', 'instagram');

// Twitter calls are automatically protected
const tweet = await twitterService.postTweet({ text: 'Hello!' });
```

### 3. Monitor Circuit Status

```bash
# Check all circuits
curl http://localhost:3001/api/circuit-breaker/status

# Check specific circuit
curl http://localhost:3001/api/circuit-breaker/status/ai

# Health check
curl http://localhost:3001/api/circuit-breaker/health
```

## How It Works

1. **Normal Operation**: Requests pass through
2. **Failures Detected**: Circuit monitors error rate
3. **Threshold Reached**: Circuit opens (50% failures)
4. **Fail Fast**: New requests rejected immediately
5. **Recovery Attempt**: After 30-60s, circuit tries half-open
6. **Success**: Circuit closes, normal operation resumes

## Configuration

Edit `backend/src/config/circuitBreaker.config.ts`:

```typescript
export const CIRCUIT_CONFIGS = {
  ai: {
    timeout: 30000,              // 30 seconds
    errorThresholdPercentage: 60, // Open after 60% failures
    resetTimeout: 60000,         // Try again after 1 minute
  },
  // ... other services
};
```

## Common Scenarios

### Scenario 1: OpenAI is Down

```
Request 1-5: ✅ Success
Request 6-10: ❌ Failures (OpenAI down)
Circuit: 🔴 OPENS (50% failure rate)
Request 11+: 🚫 Rejected immediately (fail fast)
After 60s: 🟡 HALF-OPEN (testing recovery)
Request: ✅ Success → 🟢 CLOSED
```

### Scenario 2: Twitter Rate Limited

```
Requests: ❌ 429 Rate Limit errors
Circuit: 🔴 OPENS after 40% failures
New requests: 🚫 Rejected (queued for retry)
After 30s: 🟡 HALF-OPEN
Request: ✅ Success → 🟢 CLOSED
```

## Manual Control

```bash
# Force open (maintenance mode)
curl -X POST http://localhost:3001/api/circuit-breaker/ai/open

# Force close (emergency recovery)
curl -X POST http://localhost:3001/api/circuit-breaker/ai/close

# Reset all
curl -X POST http://localhost:3001/api/circuit-breaker/reset
```

## Monitoring

```typescript
// Get stats
const stats = circuitBreakerService.getStats('ai');

console.log({
  state: stats.state,           // 'closed' | 'open' | 'half-open'
  successRate: stats.successes / stats.fires,
  avgLatency: stats.latency.mean,
  failures: stats.failures,
});
```

## Fallback Strategies

### AI Service
```typescript
// Fallback: Generic response
const caption = await aiService.generateCaption(topic, platform);
// If circuit open: "Check out our latest update about {topic}!"
```

### Twitter Service
```typescript
// Fallback: Queue for retry
try {
  await twitterService.postTweet({ text: 'Hello!' });
} catch (error) {
  // "Post queued for retry when service recovers"
}
```

### Translation Service
```typescript
// Fallback: Original text
const result = await translationService.translate({
  text: 'Hello',
  targetLanguages: ['es', 'fr']
});
// If circuit open: Returns original "Hello"
```

## Testing

```bash
# Run tests
npm test -- CircuitBreakerService.test.ts

# Run examples
npx ts-node backend/examples/circuit-breaker-example.ts
```

## Troubleshooting

### Circuit Keeps Opening
- External service may be unstable
- Check service status directly
- Increase `errorThresholdPercentage`
- Increase `volumeThreshold`

### Requests Timing Out
- Increase `timeout` value
- Check network connectivity
- Verify API endpoints

### Fallbacks Not Working
- Ensure fallback function is provided
- Check fallback strategy configuration
- Verify fallback logic

## Production Checklist

- [ ] Configure all API keys in environment
- [ ] Set up monitoring alerts for circuit opens
- [ ] Test fallback strategies
- [ ] Configure appropriate thresholds
- [ ] Set up logging for circuit events
- [ ] Document fallback behavior for users
- [ ] Test manual circuit control
- [ ] Verify health check endpoints

## Key Metrics to Monitor

1. **Circuit State**: Open/Closed/Half-Open
2. **Success Rate**: Successes / Total Fires
3. **Failure Rate**: Failures / Total Fires
4. **Reject Rate**: Rejects / Total Fires
5. **Average Latency**: Response time trends
6. **Time in Open State**: Duration of outages

## Support

For issues or questions:
- Check logs for circuit breaker events
- Review `/api/circuit-breaker/status` endpoint
- Test with `/api/circuit-breaker/health`
- See `IMPLEMENTATION_334.md` for details
