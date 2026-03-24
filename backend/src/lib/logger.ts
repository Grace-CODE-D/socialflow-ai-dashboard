const formatMetadata = (metadata?: unknown): string => {
  if (metadata === undefined) {
    return '';
  }

  return ` ${JSON.stringify(metadata)}`;
};

const writeLog = (
  level: 'INFO' | 'WARN' | 'ERROR',
  scope: string,
  message: string,
  metadata?: unknown,
): void => {
  const line = `${new Date().toISOString()} [${scope}] ${level} ${message}${formatMetadata(metadata)}`;

  if (level === 'ERROR') {
    console.error(line);
    return;
  }

  if (level === 'WARN') {
    console.warn(line);
    return;
  }

  console.info(line);
};

export interface Logger {
  info: (message: string, metadata?: unknown) => void;
  warn: (message: string, metadata?: unknown) => void;
  error: (message: string, metadata?: unknown) => void;
}

export const createLogger = (scope: string): Logger => {
  return {
    info: (message, metadata) => {
      writeLog('INFO', scope, message, metadata);
    },
    warn: (message, metadata) => {
      writeLog('WARN', scope, message, metadata);
    },
    error: (message, metadata) => {
      writeLog('ERROR', scope, message, metadata);
    },
  };
};