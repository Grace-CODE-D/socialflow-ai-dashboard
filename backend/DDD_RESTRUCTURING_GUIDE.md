# Domain-Driven Design (DDD) Restructuring

## Overview

The codebase has been restructured from a flat, layer-based architecture to a Domain-Driven Design (DDD) structure that groups code by business domains/features rather than technical layers.

## New Structure

```
src/
├── modules/                    # Domain modules
│   ├── health/                # Health monitoring domain
│   │   ├── services/
│   │   ├── routes.ts
│   │   └── index.ts
│   │
│   ├── social/                # Social media integration domain
│   │   ├── services/
│   │   ├── routes.*.ts
│   │   └── index.ts
│   │
│   ├── content/               # Content management domain
│   │   ├── services/
│   │   ├── routes.*.ts
│   │   └── index.ts
│   │
│   ├── billing/               # Billing domain
│   │   ├── services/
│   │   ├── routes.ts
│   │   └── index.ts
│   │
│   ├── auth/                  # Authentication domain
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── routes.ts
│   │   └── index.ts
│   │
│   ├── organization/          # Organization management domain
│   │   ├── controllers/
│   │   ├── routes.ts
│   │   └── index.ts
│   │
│   ├── webhook/               # Webhook domain
│   │   ├── services/
│   │   ├── routes.ts
│   │   └── index.ts
│   │
│   ├── analytics/             # Analytics domain
│   │   ├── routes.ts
│   │   └── index.ts
│   │
│   └── index.ts               # Module registry
│
├── shared/                    # Shared resources
│   ├── middleware/
│   ├── lib/
│   ├── config/
│   ├── types/
│   ├── utils/
│   ├── schemas/
│   └── index.ts
│
├── app.ts
└── server.ts
```

## Module Boundaries

### Health Module
**Responsibility**: System health monitoring and alerting

**Contains**:
- `HealthService` - Health check orchestration
- `HealthMonitor` - Metric evaluation
- `NotificationProvider` - Alert delivery (Slack, PagerDuty)
- `AlertConfigService` - Alert configuration

**Routes**:
- `GET /api/health/status`
- `GET /api/health/metrics`
- `GET /api/health/config`

### Social Module
**Responsibility**: Social media platform integrations

**Contains**:
- `TwitterService` - Twitter API integration
- `YouTubeService` - YouTube API integration
- `FacebookService` - Facebook API integration

**Routes**:
- `/api/youtube/*`
- `/api/facebook/*`

### Content Module
**Responsibility**: Content creation and management

**Contains**:
- `VideoService` - Video processing
- `TranslationService` - Content translation
- `TTSService` - Text-to-speech conversion

**Routes**:
- `/api/video/*`
- `/api/translation/*`
- `/api/tts/*`

### Billing Module
**Responsibility**: Billing and subscription management

**Contains**:
- `BillingService` - Billing operations

**Routes**:
- `/api/billing/*`

### Auth Module
**Responsibility**: Authentication and authorization

**Contains**:
- `AuthController` - Auth endpoints
- `AuthMiddleware` - Auth verification

**Routes**:
- `/api/auth/*`

### Organization Module
**Responsibility**: Organization and team management

**Contains**:
- `OrganizationController` - Organization operations

**Routes**:
- `/api/organizations/*`
- `/api/roles/*`

### Webhook Module
**Responsibility**: Webhook management and delivery

**Contains**:
- `WebhookDispatcher` - Webhook delivery

**Routes**:
- `/api/webhooks/*`

### Analytics Module
**Responsibility**: Analytics and metrics tracking

**Routes**:
- `/api/analytics/*`

### Shared
**Responsibility**: Cross-cutting concerns

**Contains**:
- Middleware (auth, error handling, validation, etc.)
- Libraries (logger, database, event bus, etc.)
- Configuration (CORS, runtime, DI container, etc.)
- Types and schemas
- Utilities

## Dependency Rules

### ✅ Allowed
- Modules can depend on `Shared`
- Modules can use shared middleware, lib, config, types

### ❌ Not Allowed
- Modules should NOT depend on other modules
- No circular dependencies
- No cross-module imports

### 📡 Cross-Module Communication
Use the event bus for cross-module communication:

```typescript
// Module A
import { eventBus } from '@shared/lib/eventBus';
eventBus.emit('user.created', { userId: '123' });

// Module B
eventBus.on('user.created', (data) => {
  // Handle event
});
```

## Module Structure Template

Each module should follow this structure:

```
module-name/
├── services/
│   ├── service1.ts
│   └── service2.ts
├── controllers/
│   └── controller.ts
├── middleware/
│   └── middleware.ts
├── types.ts
├── routes.ts
└── index.ts
```

### Module Index File

```typescript
// Export all public APIs
export { Service1 } from './services/service1';
export { Service2 } from './services/service2';
export { default as moduleRoutes } from './routes';
```

### Module Routes File

```typescript
import { Router } from 'express';
import { Service1 } from './services/service1';

const router = Router();

router.get('/', (req, res) => {
  // Handle request
});

export default router;
```

## Migration Guide

### For Existing Code
1. Import from modules instead of old paths
2. Use shared resources from `shared/`
3. Update relative imports

### Before
```typescript
import { healthService } from '../services/healthService';
import { logger } from '../lib/logger';
```

### After
```typescript
import { HealthService } from '@modules/health';
import { logger } from '@shared/lib/logger';
```

## Benefits

✅ **Better Organization**: Code grouped by business domain  
✅ **Easier Navigation**: Clear module boundaries  
✅ **Reduced Coupling**: Modules are independent  
✅ **Scalability**: Easy to add new modules  
✅ **Maintainability**: Clear responsibility per module  
✅ **Testability**: Isolated module testing  
✅ **Reusability**: Shared resources centralized  

## Adding a New Module

1. Create module directory: `src/modules/new-module/`
2. Create subdirectories: `services/`, `controllers/`, etc.
3. Create `index.ts` with exports
4. Create `routes.ts` with routes
5. Register in `src/modules/index.ts`
6. Update `app.ts` to use module registry

## Shared Resources

### Middleware
- `authMiddleware` - Authentication
- `error` - Error handling
- `requestId` - Request ID tracking
- `validate` - Input validation
- `audit` - Audit logging
- `checkPermission` - Permission checking
- `orgMiddleware` - Organization context
- `requireCredits` - Credit validation
- `tracingMiddleware` - Distributed tracing
- `prismaSoftDelete` - Soft delete support

### Libraries
- `logger` - Logging
- `errors` - Error definitions
- `prisma` - Database client
- `eventBus` - Event publishing

### Configuration
- `cors` - CORS settings
- `runtime` - Runtime configuration
- `inversify.config` - DI container
- `circuitBreaker.config` - Circuit breaker
- `tts.config` - TTS configuration
- `video.config` - Video configuration

## No Circular Dependencies

The DDD structure ensures no circular dependencies:

```
Modules → Shared
  ↓
Shared (no dependencies)
```

Each module can only depend on Shared, never on other modules.

## Testing

### Module Testing
```typescript
import { HealthService } from '@modules/health';

describe('Health Module', () => {
  it('should check health', async () => {
    const service = new HealthService();
    const status = await service.getSystemStatus();
    expect(status).toBeDefined();
  });
});
```

### Shared Testing
```typescript
import { logger } from '@shared/lib/logger';

describe('Logger', () => {
  it('should log messages', () => {
    logger.info('test message');
  });
});
```

## Future Enhancements

1. **Module Versioning**: Support multiple versions of modules
2. **Module Plugins**: Allow external module plugins
3. **Module Configuration**: Per-module configuration
4. **Module Lifecycle**: Init, start, stop hooks
5. **Module Dependencies**: Explicit module dependencies
6. **Module Isolation**: Complete module isolation

## References

- [Domain-Driven Design](https://en.wikipedia.org/wiki/Domain-driven_design)
- [Modular Architecture](https://en.wikipedia.org/wiki/Modular_design)
- [Hexagonal Architecture](https://en.wikipedia.org/wiki/Hexagonal_architecture_(software))
