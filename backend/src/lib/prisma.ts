import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { trace, SpanStatusCode } from '@opentelemetry/api';

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

const tracer = trace.getTracer('socialflow-db');

function createInstrumentedPrisma(): PrismaClient {
  const client = new PrismaClient({ datasourceUrl: process.env.DATABASE_URL });

  // Wrap every query in a span via Prisma middleware
  client.$use(async (params, next) => {
    const spanName = `db.${params.model ?? 'unknown'}.${params.action}`;
    const span = tracer.startSpan(spanName, {
      attributes: {
        'db.system': 'postgresql',
        'db.operation': params.action,
        'db.prisma.model': params.model ?? '',
      },
    });

    try {
      const result = await next(params);
      span.setStatus({ code: SpanStatusCode.OK });
      return result;
    } catch (err) {
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: err instanceof Error ? err.message : String(err),
      });
      span.recordException(err as Error);
      throw err;
    } finally {
      span.end();
    }
  });

  return client;
}

export const prisma = globalForPrisma.prisma ?? createInstrumentedPrisma();

// Reuse the same instance across hot-reloads in development
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
