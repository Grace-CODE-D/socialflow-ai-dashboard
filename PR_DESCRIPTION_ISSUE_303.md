# Unit of Work Pattern

## Overview
Implements the Unit of Work pattern to manage complex transactions that span multiple repositories, ensuring data atomicity and consistency.

## Changes
- **UnitOfWork Class**: Manages atomic transactions with automatic rollback
- **BaseRepository**: Abstract repository for data access encapsulation
- **Example Repositories**: UserRepository, OrganizationRepository, SubscriptionRepository
- **Transaction Context**: IUnitOfWorkContext for transaction-scoped operations
- **Multiple Patterns**: Support for single, complex, parallel, and multiple operations

## Key Features
✅ Atomic transactions across multiple repositories  
✅ Automatic rollback on error  
✅ Clean, intuitive API  
✅ Type-safe with TypeScript  
✅ Repository pattern for code reuse  
✅ Parallel operation support  
✅ Comprehensive error handling  

## Usage

### Simple Transaction
```typescript
const unitOfWork = new UnitOfWork(prisma);

const result = await unitOfWork.execute(async (context) => {
  const userRepo = new UserRepository(context.prisma);
  const orgRepo = new OrganizationRepository(context.prisma);

  const org = await orgRepo.create({ name: 'Company' });
  const user = await userRepo.create({
    email: 'user@example.com',
    organizationId: org.id,
  });

  return { user, org };
});
```

### Complex Multi-Step
```typescript
const result = await unitOfWork.execute(async (context) => {
  const userRepo = new UserRepository(context.prisma);
  const orgRepo = new OrganizationRepository(context.prisma);
  const subRepo = new SubscriptionRepository(context.prisma);

  const org = await orgRepo.create({ name: 'Company' });
  const user = await userRepo.create({
    email: 'user@example.com',
    organizationId: org.id,
  });
  const subscription = await subRepo.create({
    userId: user.id,
    organizationId: org.id,
    plan: 'premium',
  });

  return { user, org, subscription };
});
```

### Parallel Operations
```typescript
const result = await unitOfWork.execute(async (context) => {
  const userRepo = new UserRepository(context.prisma);
  const orgRepo = new OrganizationRepository(context.prisma);

  const [user, org] = await Promise.all([
    userRepo.create({ email: 'user@example.com' }),
    orgRepo.create({ name: 'Company' }),
  ]);

  return { user, org };
});
```

## Components

### UnitOfWork
- `execute()` - Execute single transaction
- `executeMultiple()` - Execute multiple operations

### BaseRepository
- Abstract base class for repositories
- Transaction-scoped Prisma client access
- Common CRUD operations

### Example Repositories
- UserRepository
- OrganizationRepository
- SubscriptionRepository

## Benefits
✅ Data consistency and atomicity  
✅ Simplified transaction management  
✅ Automatic error handling and rollback  
✅ Reusable repository pattern  
✅ Type-safe operations  
✅ Easy to test  

## Documentation
- `UNIT_OF_WORK_GUIDE.md` - Comprehensive guide
- `UNIT_OF_WORK_QUICKSTART.md` - Quick reference
- `UnitOfWorkExample.ts` - Usage examples

## Integration
Works seamlessly with:
- Prisma ORM
- InversifyJS DI container
- Existing services and modules

Closes #303
