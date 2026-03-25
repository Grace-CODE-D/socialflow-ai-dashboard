# DDD Migration Guide

## Quick Reference

### Import Changes

#### Health Module
```typescript
// Before
import { healthService } from '../services/healthService';
import { HealthMonitor } from '../services/healthMonitor';

// After
import { HealthService, HealthMonitor } from '@modules/health';
```

#### Social Module
```typescript
// Before
import { TwitterService } from '../services/TwitterService';
import { YouTubeService } from '../services/YouTubeService';

// After
import { TwitterService, YouTubeService } from '@modules/social';
```

#### Content Module
```typescript
// Before
import { VideoService } from '../services/VideoService';
import { TranslationService } from '../services/TranslationService';

// After
import { VideoService, TranslationService } from '@modules/content';
```

#### Billing Module
```typescript
// Before
import { BillingService } from '../services/BillingService';

// After
import { BillingService } from '@modules/billing';
```

#### Shared Resources
```typescript
// Before
import { logger } from '../lib/logger';
import { authMiddleware } from '../middleware/authMiddleware';

// After
import { logger } from '@shared/lib/logger';
import { authMiddleware } from '@shared/middleware/authMiddleware';
```

## Route Registration

### Before
```typescript
// app.ts
import healthRoutes from './routes/health';
import youtubeRoutes from './routes/youtube';
import facebookRoutes from './routes/facebook';

app.use('/api/health', healthRoutes);
app.use('/api/youtube', youtubeRoutes);
app.use('/api/facebook', facebookRoutes);
```

### After
```typescript
// app.ts
import { registerModules } from './modules';

registerModules(app);
```

## Module Structure

### Creating a New Module

1. Create directory:
```bash
mkdir -p src/modules/my-module/services
```

2. Create `index.ts`:
```typescript
export { MyService } from './services/myService';
export { default as myModuleRoutes } from './routes';
```

3. Create `routes.ts`:
```typescript
import { Router } from 'express';
import { MyService } from './services/myService';

const router = Router();

router.get('/', (req, res) => {
  // Handle request
});

export default router;
```

4. Register in `src/modules/index.ts`:
```typescript
import { myModuleRoutes } from './my-module';

export function registerModules(app: any): void {
  app.use('/api/my-module', myModuleRoutes);
}
```

## Dependency Injection

### Module Services with DI

```typescript
import { injectable, inject } from 'inversify';
import { TYPES } from '@shared/config/inversify.config';

@injectable()
export class MyService {
  constructor(
    @inject(TYPES.Logger) private logger: Logger
  ) {}
}
```

## Testing

### Module Testing

```typescript
import { MyService } from '@modules/my-module';

describe('MyModule', () => {
  let service: MyService;

  beforeEach(() => {
    service = new MyService();
  });

  it('should work', () => {
    expect(service).toBeDefined();
  });
});
```

## Path Aliases

### TypeScript Configuration

Update `tsconfig.json`:

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@modules/*": ["src/modules/*"],
      "@shared/*": ["src/shared/*"]
    }
  }
}
```

## Checklist

- [ ] Update all imports to use new module paths
- [ ] Update route registration in app.ts
- [ ] Update TypeScript paths in tsconfig.json
- [ ] Test all modules
- [ ] Update documentation
- [ ] Remove old directories (routes, services, controllers, etc.)

## Common Issues

### Issue: Module not found
**Solution**: Check import path and ensure module is registered in `modules/index.ts`

### Issue: Circular dependency
**Solution**: Move shared code to `shared/` directory

### Issue: Type not found
**Solution**: Check if type is exported from module `index.ts`

## Rollback

If needed, revert to old structure:
```bash
git checkout HEAD -- src/
```

## Performance

- No performance impact
- Same number of files
- Better code organization
- Easier to optimize per module
