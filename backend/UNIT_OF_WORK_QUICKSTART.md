# Unit of Work Quick Start

## Installation

Already included in `src/shared/utils/`

## Basic Usage

### Step 1: Import

```typescript
import { UnitOfWork } from '@shared/utils/UnitOfWork';
import { UserRepository, OrganizationRepository } from '@shared/utils/BaseRepository';
import { prisma } from '@shared/lib/prisma';
```

### Step 2: Create Unit of Work

```typescript
const unitOfWork = new UnitOfWork(prisma);
```

### Step 3: Execute Transaction

```typescript
const result = await unitOfWork.execute(async (context) => {
  const userRepo = new UserRepository(context.prisma);
  const orgRepo = new OrganizationRepository(context.prisma);

  // All operations are atomic
  const org = await orgRepo.create({ name: 'Company' });
  const user = await userRepo.create({
    email: 'user@example.com',
    organizationId: org.id,
  });

  return { user, org };
});
```

## Common Patterns

### Create Related Entities

```typescript
await unitOfWork.execute(async (context) => {
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

### Update Multiple Entities

```typescript
await unitOfWork.execute(async (context) => {
  const userRepo = new UserRepository(context.prisma);
  const orgRepo = new OrganizationRepository(context.prisma);

  const [user, org] = await Promise.all([
    userRepo.update(userId, { name: 'New Name' }),
    orgRepo.update(orgId, { status: 'active' }),
  ]);

  return { user, org };
});
```

### Delete with Validation

```typescript
await unitOfWork.execute(async (context) => {
  const userRepo = new UserRepository(context.prisma);
  const orgRepo = new OrganizationRepository(context.prisma);

  const user = await userRepo.findById(userId);
  if (!user) throw new Error('User not found');

  await userRepo.delete(userId);
  await orgRepo.update(user.organizationId, { userCount: -1 });

  return { success: true };
});
```

## Error Handling

```typescript
try {
  const result = await unitOfWork.execute(async (context) => {
    // Operations here
  });
} catch (error) {
  // All changes automatically rolled back
  console.error('Transaction failed:', error);
}
```

## Creating Custom Repository

```typescript
import { BaseRepository } from '@shared/utils/BaseRepository';

export class MyRepository extends BaseRepository {
  async findById(id: string) {
    return this.getClient().myTable.findUnique({
      where: { id },
    });
  }

  async create(data: any) {
    return this.getClient().myTable.create({ data });
  }
}
```

## Key Points

✅ All operations are atomic  
✅ Automatic rollback on error  
✅ No manual transaction management  
✅ Type-safe with TypeScript  
✅ Works with any Prisma model  

## Examples

See `UnitOfWorkExample.ts` for complete examples:
- `exampleCreateUserWithOrganization`
- `exampleCreateUserWithSubscription`
- `exampleUpdateUserAndOrganization`
- `exampleMultipleOperations`
