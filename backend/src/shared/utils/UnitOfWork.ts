import { PrismaClient } from '@prisma/client';
import { createLogger } from '../lib/logger';

const logger = createLogger('unitOfWork');

/**
 * Repository interface for Unit of Work pattern
 */
export interface IRepository {
  [key: string]: any;
}

/**
 * Unit of Work context containing transaction-scoped repositories
 */
export interface IUnitOfWorkContext {
  prisma: PrismaClient;
  repositories: IRepository;
}

/**
 * Unit of Work callback function
 */
export type UnitOfWorkCallback<T> = (context: IUnitOfWorkContext) => Promise<T>;

/**
 * Unit of Work Pattern Implementation
 * Manages atomic transactions across multiple repositories
 */
export class UnitOfWork {
  constructor(private prisma: PrismaClient) {}

  /**
   * Execute a callback within a transaction context
   * All database operations are atomic - either all succeed or all rollback
   */
  async execute<T>(
    callback: UnitOfWorkCallback<T>,
    repositories?: IRepository
  ): Promise<T> {
    try {
      logger.debug('Starting Unit of Work transaction');

      const result = await this.prisma.$transaction(async (tx) => {
        const context: IUnitOfWorkContext = {
          prisma: tx as PrismaClient,
          repositories: repositories || {},
        };

        return await callback(context);
      });

      logger.debug('Unit of Work transaction committed');
      return result;
    } catch (error) {
      logger.error('Unit of Work transaction failed', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Execute multiple operations in a single transaction
   */
  async executeMultiple<T>(
    operations: Array<(tx: PrismaClient) => Promise<T>>
  ): Promise<T[]> {
    try {
      logger.debug('Starting multi-operation Unit of Work transaction');

      const results = await this.prisma.$transaction(async (tx) => {
        return Promise.all(operations.map((op) => op(tx as PrismaClient)));
      });

      logger.debug('Multi-operation Unit of Work transaction committed');
      return results;
    } catch (error) {
      logger.error('Multi-operation Unit of Work transaction failed', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }
}

/**
 * Factory function to create Unit of Work instance
 */
export function createUnitOfWork(prisma: PrismaClient): UnitOfWork {
  return new UnitOfWork(prisma);
}
