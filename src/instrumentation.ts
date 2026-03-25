/**
 * Manual instrumentation helpers for critical paths.
 * Use these to wrap DB queries, AI calls, and any custom operations
 * that need detailed span-level visibility.
 *
 * Usage:
 *   import { traceDbQuery, traceAiCall, withSpan } from './instrumentation';
 *
 *   const result = await traceDbQuery('users.findById', async () => db.find(...));
 *   const reply  = await traceAiCall('gemini.generate', model, async () => ai.generate(...));
 */

import { trace, SpanStatusCode, SpanKind, context, Span } from '@opentelemetry/api';

const tracer = trace.getTracer('socialflow-ai-dashboard');

/**
 * Generic span wrapper — runs fn inside a named span and records errors.
 */
export async function withSpan<T>(
  name: string,
  attributes: Record<string, string | number | boolean>,
  fn: (span: Span) => Promise<T>,
): Promise<T> {
  return tracer.startActiveSpan(name, { kind: SpanKind.INTERNAL, attributes }, async (span) => {
    try {
      const result = await fn(span);
      span.setStatus({ code: SpanStatusCode.OK });
      return result;
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error(String(err));
      span.recordException(error);
      span.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
      throw err;
    } finally {
      span.end();
    }
  });
}

/**
 * Instrument a database query.
 * @param operation  Human-readable operation name, e.g. 'users.findById'
 * @param dbSystem   Database type, e.g. 'postgresql', 'mongodb', 'redis'
 * @param fn         Async function executing the query
 */
export async function traceDbQuery<T>(
  operation: string,
  dbSystem: string,
  fn: () => Promise<T>,
): Promise<T> {
  return withSpan(
    `db.${operation}`,
    {
      'db.system': dbSystem,
      'db.operation': operation,
      'span.kind': 'client',
    },
    () => fn(),
  );
}

/**
 * Instrument an AI / LLM API call.
 * @param operation  e.g. 'gemini.generateContent', 'openai.chatCompletion'
 * @param model      Model identifier, e.g. 'gemini-pro'
 * @param fn         Async function making the AI call
 */
export async function traceAiCall<T>(
  operation: string,
  model: string,
  fn: () => Promise<T>,
): Promise<T> {
  return withSpan(
    `ai.${operation}`,
    {
      'ai.operation': operation,
      'ai.model': model,
      'span.kind': 'client',
    },
    () => fn(),
  );
}

/**
 * Instrument an outbound HTTP call to an external service.
 * @param service  Service name, e.g. 'stellar-horizon', 'ipfs'
 * @param method   HTTP method
 * @param url      Target URL
 * @param fn       Async function making the request
 */
export async function traceHttpCall<T>(
  service: string,
  method: string,
  url: string,
  fn: () => Promise<T>,
): Promise<T> {
  return withSpan(
    `http.${service}`,
    {
      'http.method': method.toUpperCase(),
      'http.url': url,
      'peer.service': service,
      'span.kind': 'client',
    },
    () => fn(),
  );
}

export { tracer };
