# Dependency Injection Quick Start

## Using Existing Services

### Via Service Factory (Recommended)

```typescript
import { getHealthService, getHealthMonitor } from '../services/serviceFactory';

const healthService = getHealthService();
const monitor = getHealthMonitor();
```

### Via Container

```typescript
import { container, TYPES } from '../config/inversify.config';

const healthService = container.get<HealthService>(TYPES.HealthService);
```

## Creating a New Injectable Service

### 1. Add Decorators

```typescript
import 'reflect-metadata';
import { injectable, inject } from 'inversify';
import { TYPES } from '../config/inversify.config';

@injectable()
export class UserService {
  constructor(
    @inject(TYPES.HealthService) private healthService: HealthService
  ) {}

  async getUser(id: string) {
    // Implementation
  }
}
```

### 2. Register in Container

```typescript
// In src/config/inversify.config.ts
export const TYPES = {
  UserService: Symbol.for('UserService'),
  // ... other types
};

container.bind(TYPES.UserService).to(UserService).inSingletonScope();
```

### 3. Create Factory Function

```typescript
// In src/services/serviceFactory.ts
export function getUserService(): UserService {
  return container.get<UserService>(TYPES.UserService);
}
```

## Testing with Mocks

```typescript
import { Container } from 'inversify';
import { TYPES } from '../config/inversify.config';

describe('UserService', () => {
  let container: Container;
  let userService: UserService;

  beforeEach(() => {
    container = new Container();
    
    // Mock dependencies
    const mockHealthService = {
      getSystemStatus: jest.fn(),
    };

    container.bind(TYPES.HealthService).toConstantValue(mockHealthService);
    container.bind(TYPES.UserService).to(UserService);

    userService = container.get<UserService>(TYPES.UserService);
  });

  it('should get user', async () => {
    const user = await userService.getUser('123');
    expect(user).toBeDefined();
  });
});
```

## Key Points

✅ Always import `reflect-metadata` at the top  
✅ Use `@injectable()` on classes  
✅ Use `@inject(TYPES.Service)` for dependencies  
✅ Register in container with singleton scope  
✅ Create factory functions for backward compatibility  
✅ Mock dependencies in tests  

## Common Patterns

### Injecting Multiple Dependencies

```typescript
@injectable()
export class ComplexService {
  constructor(
    @inject(TYPES.HealthService) private health: HealthService,
    @inject(TYPES.NotificationManager) private notifications: NotificationManager,
    @inject(TYPES.AlertConfigService) private config: AlertConfigService
  ) {}
}
```

### Optional Dependencies

```typescript
import { optional } from 'inversify';

@injectable()
export class MyService {
  constructor(
    @inject(TYPES.HealthService) @optional() private health?: HealthService
  ) {}
}
```

### Lazy Injection

```typescript
@injectable()
export class ServiceA {
  constructor(
    @inject(TYPES.ServiceB) private serviceB: () => ServiceB
  ) {}
}
```
