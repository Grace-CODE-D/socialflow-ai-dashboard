import fs from 'fs/promises';
import path from 'path';
import { DataRetentionConfig, getDataRetentionConfig } from '../config/runtime';
import { createLogger } from '../lib/logger';

const DAY_MS = 24 * 60 * 60 * 1000;

export interface DataPruningSummary {
  scannedFiles: number;
  eligibleFiles: number;
  archivedFiles: number;
  deletedFiles: number;
  skippedFiles: number;
  errors: Array<{ filePath: string; reason: string }>;
}

interface PruningTarget {
  category: 'logs' | 'analytics';
  basePath: string;
  retentionDays: number;
}

const logger = createLogger('data-pruning');

const toAbsolutePath = (value: string): string => {
  return path.isAbsolute(value) ? value : path.resolve(process.cwd(), value);
};

const exists = async (targetPath: string): Promise<boolean> => {
  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
};

const getAllFiles = async (directoryPath: string): Promise<string[]> => {
  const entries = await fs.readdir(directoryPath, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map(async (entry) => {
      const entryPath = path.join(directoryPath, entry.name);
      if (entry.isDirectory()) {
        return getAllFiles(entryPath);
      }

      return [entryPath];
    }),
  );

  return nested.flat();
};

const ensureDirectory = async (directoryPath: string): Promise<void> => {
  await fs.mkdir(directoryPath, { recursive: true });
};

const archiveFile = async (sourceFilePath: string, destinationRoot: string, relativePath: string): Promise<void> => {
  const destinationPath = path.join(destinationRoot, relativePath);
  const destinationDirectory = path.dirname(destinationPath);

  await ensureDirectory(destinationDirectory);
  await fs.rename(sourceFilePath, destinationPath);
};

const pruneTarget = async (
  target: PruningTarget,
  config: DataRetentionConfig,
  summary: DataPruningSummary,
): Promise<void> => {
  const absoluteBasePath = toAbsolutePath(target.basePath);
  const basePathExists = await exists(absoluteBasePath);

  if (!basePathExists) {
    logger.warn('Retention path does not exist, skipping target', {
      category: target.category,
      path: absoluteBasePath,
    });
    return;
  }

  const files = await getAllFiles(absoluteBasePath);
  const threshold = Date.now() - target.retentionDays * DAY_MS;

  for (const filePath of files) {
    summary.scannedFiles += 1;

    try {
      const stats = await fs.stat(filePath);

      if (stats.mtimeMs > threshold) {
        summary.skippedFiles += 1;
        continue;
      }

      summary.eligibleFiles += 1;

      if (config.mode === 'archive') {
        const archiveRoot = path.join(toAbsolutePath(config.archiveDirectory), target.category);
        const relativePath = path.relative(absoluteBasePath, filePath);
        await archiveFile(filePath, archiveRoot, relativePath);
        summary.archivedFiles += 1;
      } else {
        await fs.unlink(filePath);
        summary.deletedFiles += 1;
      }
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      summary.errors.push({ filePath, reason });
    }
  }
};

export const runDataPruning = async (overrideConfig?: Partial<DataRetentionConfig>): Promise<DataPruningSummary> => {
  const defaultConfig = getDataRetentionConfig();
  const config: DataRetentionConfig = {
    ...defaultConfig,
    ...overrideConfig,
  };

  const summary: DataPruningSummary = {
    scannedFiles: 0,
    eligibleFiles: 0,
    archivedFiles: 0,
    deletedFiles: 0,
    skippedFiles: 0,
    errors: [],
  };

  logger.info('Starting data retention pruning run', {
    mode: config.mode,
    logsRetentionDays: config.logsRetentionDays,
    analyticsRetentionDays: config.analyticsRetentionDays,
    logsPaths: config.logsPaths,
    analyticsPaths: config.analyticsPaths,
  });

  const targets: PruningTarget[] = [
    ...config.logsPaths.map((basePath) => ({
      category: 'logs' as const,
      basePath,
      retentionDays: config.logsRetentionDays,
    })),
    ...config.analyticsPaths.map((basePath) => ({
      category: 'analytics' as const,
      basePath,
      retentionDays: config.analyticsRetentionDays,
    })),
  ];

  for (const target of targets) {
    await pruneTarget(target, config, summary);
  }

  logger.info('Data retention pruning completed', {
    ...summary,
    errorCount: summary.errors.length,
  });

  return summary;
};