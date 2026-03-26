import { PrismaClient } from '@prisma/client';
import { UnitOfWork } from './UnitOfWork';
import { UserRepository, OrganizationRepository, SubscriptionRepository } from './BaseRepository';
import { createLogger } from '../lib/logger';

const logger = createLogger('unitOfWorkExample');

/**
 * Example: Using Unit of Work for atomic multi-repository operations
 */

export async function exampleCreateUserWithOrganization(
  prisma: PrismaClient,
  userData: any,
  orgData: any
) {
  const unitOfWork = new UnitOfWork(prisma);

  try {
    const result = await unitOfWork.execute(async (context) => {
      const userRepo = new UserRepository(context.prisma);
      const orgRepo = new OrganizationRepository(context.prisma);

      // Create organization first
      const organization = await orgRepo.create(orgData);
      logger.info('Organization created', { orgId: organization.id });

      // Create user linked to organization
      const user = await userRepo.create({
        ...userData,
        organizationId: organization.id,
      });
      logger.info('User created', { userId: user.id });

      return { user, organization };
    });

    logger.info('Transaction completed successfully', { result });
    return result;
  } catch (error) {
    logger.error('Transaction failed - all changes rolled back', {
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

/**
 * Example: Complex transaction with subscription creation
 */
export async function exampleCreateUserWithSubscription(
  prisma: PrismaClient,
  userData: any,
  orgData: any,
  subscriptionData: any
) {
  const unitOfWork = new UnitOfWork(prisma);

  try {
    const result = await unitOfWork.execute(async (context) => {
      const userRepo = new UserRepository(context.prisma);
      const orgRepo = new OrganizationRepository(context.prisma);
      const subRepo = new SubscriptionRepository(context.prisma);

      // Step 1: Create organization
      const organization = await orgRepo.create(orgData);

      // Step 2: Create user
      const user = await userRepo.create({
        ...userData,
        organizationId: organization.id,
      });

      // Step 3: Create subscription
      const subscription = await subRepo.create({
        ...subscriptionData,
        userId: user.id,
        organizationId: organization.id,
      });

      return { user, organization, subscription };
    });

    logger.info('Complex transaction completed', { result });
    return result;
  } catch (error) {
    logger.error('Complex transaction failed - all changes rolled back', {
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

/**
 * Example: Update multiple entities atomically
 */
export async function exampleUpdateUserAndOrganization(
  prisma: PrismaClient,
  userId: string,
  orgId: string,
  userData: any,
  orgData: any
) {
  const unitOfWork = new UnitOfWork(prisma);

  try {
    const result = await unitOfWork.execute(async (context) => {
      const userRepo = new UserRepository(context.prisma);
      const orgRepo = new OrganizationRepository(context.prisma);

      // Update both entities atomically
      const [user, organization] = await Promise.all([
        userRepo.update(userId, userData),
        orgRepo.update(orgId, orgData),
      ]);

      return { user, organization };
    });

    logger.info('Update transaction completed', { result });
    return result;
  } catch (error) {
    logger.error('Update transaction failed - all changes rolled back', {
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

/**
 * Example: Using executeMultiple for independent operations
 */
export async function exampleMultipleOperations(
  prisma: PrismaClient,
  operations: Array<(tx: PrismaClient) => Promise<any>>
) {
  const unitOfWork = new UnitOfWork(prisma);

  try {
    const results = await unitOfWork.executeMultiple(operations);
    logger.info('Multiple operations completed', { count: results.length });
    return results;
  } catch (error) {
    logger.error('Multiple operations failed - all changes rolled back', {
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}
