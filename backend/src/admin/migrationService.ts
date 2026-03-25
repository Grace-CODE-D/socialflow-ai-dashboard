import Redis from 'ioredis';
import { getConfiguredQueueNames, getRedisConnection } from '../config/runtime';
import { Logger } from '../lib/logger';
import { ADMIN_MIGRATIONS_SET_KEY, KNOWN_QUEUES_SET_KEY } from './constants';

interface MigrationContext {
  redis: Redis;
  logger: Logger;
}

interface MigrationDefinition {
  name: string;
  description: string;
  run: (context: MigrationContext) => Promise<Record<string, unknown>>;
}

export interface MigrationStatus {
  name: string;
  description: string;
  applied: boolean;
}

export interface RunMigrationsOptions {
  name?: string;
  dryRun?: boolean;
}

export interface RunMigrationsResult {
  executed: string[];
  skipped: string[];
  dryRun: boolean;
}

const migrations: MigrationDefinition[] = [
  {
    name: '20260324_sync_configured_queues',
    description: 'Persist configured BullMQ queue names in Redis for admin tooling discovery.',
    run: async ({ redis, logger }) => {
      const queueNames = getConfiguredQueueNames();

      if (queueNames.length === 0) {
        logger.warn('No configured queues were found while running migration', {
          migration: '20260324_sync_configured_queues',
        });

        return { syncedQueues: 0 };
      }

      const syncedQueues = await redis.sadd(KNOWN_QUEUES_SET_KEY, ...queueNames);
      logger.info('Persisted configured queues for admin discovery', {
        migration: '20260324_sync_configured_queues',
        queueNames,
        syncedQueues,
      });

      return { syncedQueues };
    },
  },
];

export const listMigrations = async (): Promise<MigrationStatus[]> => {
  const redis = new Redis(getRedisConnection());

  try {
    const applied = new Set(await redis.smembers(ADMIN_MIGRATIONS_SET_KEY));

    return migrations.map((migration) => ({
      name: migration.name,
      description: migration.description,
      applied: applied.has(migration.name),
    }));
  } finally {
    redis.disconnect();
  }
};

export const runMigrations = async (
  options: RunMigrationsOptions,
  logger: Logger,
): Promise<RunMigrationsResult> => {
  const redis = new Redis(getRedisConnection());

  try {
    const applied = new Set(await redis.smembers(ADMIN_MIGRATIONS_SET_KEY));
    const matchingMigrations = migrations.filter((migration) => !options.name || migration.name === options.name);
    const pending = matchingMigrations.filter((migration) => !applied.has(migration.name));

    if (pending.length === 0) {
      return {
        executed: [],
        skipped: matchingMigrations.map((migration) => migration.name),
        dryRun: Boolean(options.dryRun),
      };
    }

    const executed: string[] = [];

    for (const migration of pending) {
      logger.info('Running migration', {
        migration: migration.name,
        dryRun: Boolean(options.dryRun),
      });

      if (!options.dryRun) {
        await migration.run({ redis, logger });
        await redis.sadd(ADMIN_MIGRATIONS_SET_KEY, migration.name);
      }

      executed.push(migration.name);
    }

    return {
      executed,
      skipped: matchingMigrations.filter((migration) => applied.has(migration.name)).map((migration) => migration.name),
      dryRun: Boolean(options.dryRun),
    };
  } finally {
    redis.disconnect();
  }
};