# Dependency Injection with InversifyJS

## Overview

The SocialFlow backend now uses InversifyJS for dependency injection, improving testability and decoupling service dependencies.

## Installation

```bash
npm install inversify reflect-metadata
```

## Configuration

### Container Setup (`src/config/inversify.config.ts`)

The DI container is configured with all services registered as singletons:

```typescript
import { container, TYPES } from '../config/inversify.config';

// Services are automatically resolved from the container
const healthService = container.get<HealthService>(TYPES.HealthService);
```

## Service Registration

### Core Services

- `HealthService` - System health monitoring
- `HealthMonitor` - Metric evaluation and alerting
- `NotificationManager` - Alert delivery
- `AlertConfigService` - Alert configuration management

### Existing Services

All major services are registered in the container:

- `TranslationService`
- `PredictiveService`
- `TwitterService`
- `YouTubeService`
- `FacebookService`
- `VideoService`
- `CircuitBreakerService`
- `BillingService`
- `AIService`
- `SocketService`

## Using the DI Container

### Option 1: Service Factory (Recommended for Backward Compatibility)

```typescript
import { getHealthService, getHealthMonitor } from '../services/serviceFactory';

const healthService = getHealthService();
const monitor = getHealthMonitor();
```

### Option 2: Direct Container Access

```typescript
import { container, TYPES } from '../config/inversify.config';

const healthService = container.get<HealthService>(TYPES.HealthService);
```

### Option 3: Constructor Injection (For New Services)

```typescript
import { injectable, inject } from 'inversify';
import { TYPES } from '../config/inversify.config';

@injectable()
export class MyService {
  constructor(
    @inject(TYPES.HealthService) private healthService: HealthService,
    @inject(TYPES.NotificationManager) private notificationManager: NotificationManager
  ) {}
}
```

## Refactoring Existing Services

### Step 1: Add Decorators

```typescript
import 'reflect-metadata';
import { injectable, inject } from 'inversify';
import { TYPES } from '../config/inversify.config';

@injectable()
export class MyService {
  constructor(
    @inject(TYPES.HealthService) private healthService: HealthService
  ) {}
}
```

### Step 2: Register in Container

```typescript
// In inversify.config.ts
container.bind(TYPES.MyService).to(MyService).inSingletonScope();
```

### Step 3: Update Exports

```typescript
// Remove singleton instance export
// export const myService = new MyService();

// Use service factory instead
export function getMyService(): MyService {
  return container.get<MyService>(TYPES.MyService);
}
```

## Testing with DI

### Mocking Dependencies

```typescript
import { Container } from 'inversify';
import { TYPES } from '../config/inversify.config';

describe('HealthService', () => {
  let container: Container;
  let healthService: HealthService;
  let mockMonitor: HealthMonitor;

  beforeEach(() => {
    container = new Container();
    mockMonitor = {
      recordMetric: jest.fn(),
      getMetrics: jest.fn(),
    } as any;

    container.bind(TYPES.HealthMonitor).toConstantValue(mockMonitor);
    container.bind(TYPES.HealthService).to(HealthService);

    healthService = container.get<HealthService>(TYPES.HealthService);
  });

  it('should record metrics', async () => {
    await healthService.getSystemStatus();
    expect(mockMonitor.recordMetric).toHaveBeenCalled();
  });
});
```

## Singleton Scope

All services are registered with singleton scope, meaning:

- Only one instance is created per container
- The same instance is reused across the application
- Ideal for stateless services and configuration

```typescript
container.bind(TYPES.HealthService).toSelf().inSingletonScope();
```

## Transient Scope (For New Services)

If you need a new instance each time:

```typescript
container.bind(TYPES.MyService).toSelf().inTransientScope();
```

## Adding New Services

### 1. Create Service Class

```typescript
import 'reflect-metadata';
import { injectable, inject } from 'inversify';
import { TYPES } from '../config/inversify.config';

@injectable()
export class MyNewService {
  constructor(
    @inject(TYPES.HealthService) private healthService: HealthService
  ) {}

  async doSomething() {
    // Implementation
  }
}
```

### 2. Add Type Symbol

```typescript
// In inversify.config.ts
export const TYPES = {
  MyNewService: Symbol.for('MyNewService'),
  // ... other types
};
```

### 3. Register in Container

```typescript
// In inversify.config.ts
container.bind(TYPES.MyNewService).to(MyNewService).inSingletonScope();
```

### 4. Create Factory Function

```typescript
// In serviceFactory.ts
export function getMyNewService(): MyNewService {
  return container.get<MyNewService>(TYPES.MyNewService);
}
```

## Migration Path

### Phase 1: Core Services (Complete)
- HealthService
- HealthMonitor
- NotificationManager
- AlertConfigService

### Phase 2: Major Services (Recommended Next)
- TranslationService
- PredictiveService
- TwitterService
- YouTubeService
- FacebookService

### Phase 3: Remaining Services
- VideoService
- CircuitBreakerService
- BillingService
- AIService
- SocketService

## Best Practices

1. **Always use `@injectable()` decorator** on classes that will be injected
2. **Use `@inject(TYPES.ServiceName)` for dependencies** in constructors
3. **Register services in container** before using them
4. **Use service factory functions** for backward compatibility
5. **Keep singleton scope** for stateless services
6. **Mock dependencies in tests** using container binding

## Troubleshooting

### "Cannot find symbol" Error

Ensure the service is registered in `inversify.config.ts`:

```typescript
container.bind(TYPES.MyService).to(MyService).inSingletonScope();
```

### "reflect-metadata" Not Imported

Add at the top of your file:

```typescript
import 'reflect-metadata';
```

### Circular Dependencies

Use lazy injection:

```typescript
@injectable()
export class ServiceA {
  constructor(
    @inject(TYPES.ServiceB) private serviceB: () => ServiceB
  ) {}

  doSomething() {
    const b = this.serviceB();
  }
}
```

## References

- [InversifyJS Documentation](https://inversify.io/)
- [TypeScript Decorators](https://www.typescriptlang.org/docs/handbook/decorators.html)
- [Dependency Injection Pattern](https://en.wikipedia.org/wiki/Dependency_injection)
