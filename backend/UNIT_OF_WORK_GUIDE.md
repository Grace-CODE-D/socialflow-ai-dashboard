# Unit of Work Pattern

## Overview

The Unit of Work pattern manages complex transactions that span multiple repositories, ensuring data atomicity. All operations within a Unit of Work either succeed together or fail together, with automatic rollback on error.

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Unit of Work                          │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  ┌──────────────────────────────────────────────────┐   │
│  │  execute(callback, repositories)                 │   │
│  │  - Wraps callback in Prisma $transaction         │   │
│  │  - Provides transaction-scoped context           │   │
│  │  - Handles commit/rollback automatically         │   │
│  └──────────────────────────────────────────────────┘   │
│           │                                               │
│           ├─ Prisma $transaction                         │
│           ├─ Automatic rollback on error                 │
│           └─ Atomic operations                           │
│                                                           │
│  ┌──────────────────────────────────────────────────┐   │
│  │  executeMultiple(operations)                     │   │
│  │  - Execute multiple independent operations       │   │
│  │  - All succeed or all rollback                   │   │
│  └──────────────────────────────────────────────────┘   │
│                                                           │
│  ┌──────────────────────────────────────────────────┐   │
│  │  IUnitOfWorkContext                              │   │
│  │  - prisma: Transaction-scoped Prisma client      │   │
│  │  - repositories: Repository instances            │   │
│  └──────────────────────────────────────────────────┘   │
│                                                           │
└─────────────────────────────────────────────────────────┘
```

## Core Components

### UnitOfWork Class

```typescript
export class UnitOfWork {
  execute<T>(
    callback: UnitOfWorkCallback<T>,
    repositories?: IRepository
  ): Promise<T>

  executeMultiple<T>(
    operations: Array<(tx: PrismaClient) => Promise<T>>
  ): Promise<T[]>
}
```

### IUnitOfWorkContext

```typescript
export interface IUnitOfWorkContext {
  prisma: PrismaClient;        // Transaction-scoped Prisma client
  repositories: IRepository;    // Repository instances
}
```

### BaseRepository

```typescript
export abstract class BaseRepository {
  protected getClient(): PrismaClient
}
```

## Usage Patterns

### Pattern 1: Simple Transaction

```typescript
import { UnitOfWork } from '@shared/utils/UnitOfWork';
import { UserRepository, OrganizationRepository } from '@shared/utils/BaseRepository';

const unitOfWork = new UnitOfWork(prisma);

const result = await unitOfWork.execute(async (context) => {
  const userRepo = new UserRepository(context.prisma);
  const orgRepo = new OrganizationRepository(context.prisma);

  // Create organization
  const org = await orgRepo.create({ name: 'Acme Corp' });

  // Create user linked to organization
  const user = await userRepo.create({
    email: 'user@example.com',
    organizationId: org.id,
  });

  return { user, org };
});
```

### Pattern 2: Complex Multi-Step Transaction

```typescript
const result = await unitOfWork.execute(async (context) => {
  const userRepo = new UserRepository(context.prisma);
  const orgRepo = new OrganizationRepository(context.prisma);
  const subRepo = new SubscriptionRepository(context.prisma);

  // Step 1: Create organization
  const org = await orgRepo.create({ name: 'Company' });

  // Step 2: Create user
  const user = await userRepo.create({
    email: 'user@example.com',
    organizationId: org.id,
  });

  // Step 3: Create subscription
  const subscription = await subRepo.create({
    userId: user.id,
    organizationId: org.id,
    plan: 'premium',
  });

  return { user, org, subscription };
});
```

### Pattern 3: Parallel Operations

```typescript
const result = await unitOfWork.execute(async (context) => {
  const userRepo = new UserRepository(context.prisma);
  const orgRepo = new OrganizationRepository(context.prisma);

  // Execute operations in parallel
  const [user, org] = await Promise.all([
    userRepo.create({ email: 'user@example.com' }),
    orgRepo.create({ name: 'Company' }),
  ]);

  return { user, org };
});
```

### Pattern 4: Multiple Independent Operations

```typescript
const results = await unitOfWork.executeMultiple([
  async (tx) => {
    const userRepo = new UserRepository(tx);
    return userRepo.create({ email: 'user1@example.com' });
  },
  async (tx) => {
    const orgRepo = new OrganizationRepository(tx);
    return orgRepo.create({ name: 'Company' });
  },
]);
```

## Error Handling

### Automatic Rollback

```typescript
try {
  const result = await unitOfWork.execute(async (context) => {
    const userRepo = new UserRepository(context.prisma);
    const orgRepo = new OrganizationRepository(context.prisma);

    const org = await orgRepo.create({ name: 'Company' });
    const user = await userRepo.create({
      email: 'user@example.com',
      organizationId: org.id,
    });

    // If this throws, both org and user creation are rolled back
    if (!user.email) {
      throw new Error('Invalid email');
    }

    return { user, org };
  });
} catch (error) {
  // All changes rolled back automatically
  console.error('Transaction failed:', error);
}
```

## Benefits

✅ **Atomicity**: All operations succeed or all fail  
✅ **Consistency**: Data remains in valid state  
✅ **Isolation**: Operations don't interfere with each other  
✅ **Durability**: Committed changes persist  
✅ **Automatic Rollback**: No manual rollback needed  
✅ **Clean Interface**: Simple, intuitive API  
✅ **Type Safe**: Full TypeScript support  
✅ **Error Handling**: Built-in logging and error handling  

## Creating Custom Repositories

### Step 1: Extend BaseRepository

```typescript
import { BaseRepository } from '@shared/utils/BaseRepository';

export class UserRepository extends BaseRepository {
  async findById(id: string) {
    return this.getClient().user.findUnique({
      where: { id },
    });
  }

  async create(data: any) {
    return this.getClient().user.create({
      data,
    });
  }

  async update(id: string, data: any) {
    return this.getClient().user.update({
      where: { id },
      data,
    });
  }

  async delete(id: string) {
    return this.getClient().user.delete({
      where: { id },
    });
  }
}
```

### Step 2: Use in Unit of Work

```typescript
const unitOfWork = new UnitOfWork(prisma);

const result = await unitOfWork.execute(async (context) => {
  const userRepo = new UserRepository(context.prisma);
  return userRepo.create({ email: 'user@example.com' });
});
```

## Best Practices

1. **Keep Transactions Short**: Minimize transaction duration
2. **Avoid Nested Transactions**: Don't nest Unit of Work calls
3. **Handle Errors Gracefully**: Always wrap in try-catch
4. **Use Repositories**: Encapsulate data access logic
5. **Log Operations**: Track transaction lifecycle
6. **Test Rollback**: Verify rollback behavior
7. **Monitor Performance**: Watch for slow transactions

## Testing

### Unit Testing

```typescript
import { UnitOfWork } from '@shared/utils/UnitOfWork';
import { UserRepository } from '@shared/utils/BaseRepository';

describe('Unit of Work', () => {
  it('should commit transaction on success', async () => {
    const unitOfWork = new UnitOfWork(prisma);

    const result = await unitOfWork.execute(async (context) => {
      const userRepo = new UserRepository(context.prisma);
      return userRepo.create({ email: 'test@example.com' });
    });

    expect(result).toBeDefined();
    expect(result.email).toBe('test@example.com');
  });

  it('should rollback transaction on error', async () => {
    const unitOfWork = new UnitOfWork(prisma);

    await expect(
      unitOfWork.execute(async (context) => {
        const userRepo = new UserRepository(context.prisma);
        await userRepo.create({ email: 'test@example.com' });
        throw new Error('Test error');
      })
    ).rejects.toThrow('Test error');

    // Verify user was not created
    const user = await prisma.user.findUnique({
      where: { email: 'test@example.com' },
    });
    expect(user).toBeNull();
  });
});
```

## Performance Considerations

- **Transaction Overhead**: Minimal, uses Prisma's native transactions
- **Connection Pooling**: Respects Prisma connection pool
- **Timeout**: Configurable via Prisma settings
- **Deadlock Handling**: Automatic retry by Prisma

## Limitations

- Cannot nest Unit of Work calls
- Transaction timeout depends on Prisma configuration
- Large transactions may impact performance
- Not suitable for long-running operations

## Migration Guide

### Before (Without Unit of Work)

```typescript
try {
  const org = await prisma.organization.create({ data: orgData });
  const user = await prisma.user.create({
    data: { ...userData, organizationId: org.id },
  });
  return { user, org };
} catch (error) {
  // Manual cleanup needed
  if (org) {
    await prisma.organization.delete({ where: { id: org.id } });
  }
  throw error;
}
```

### After (With Unit of Work)

```typescript
const unitOfWork = new UnitOfWork(prisma);

const result = await unitOfWork.execute(async (context) => {
  const orgRepo = new OrganizationRepository(context.prisma);
  const userRepo = new UserRepository(context.prisma);

  const org = await orgRepo.create(orgData);
  const user = await userRepo.create({
    ...userData,
    organizationId: org.id,
  });

  return { user, org };
});
```

## References

- [Unit of Work Pattern](https://martinfowler.com/eaaCatalog/unitOfWork.html)
- [Prisma Transactions](https://www.prisma.io/docs/concepts/components/prisma-client/transactions)
- [ACID Properties](https://en.wikipedia.org/wiki/ACID)
