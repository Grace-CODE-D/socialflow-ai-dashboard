import { Registry, Histogram, Counter, collectDefaultMetrics } from 'prom-client';

export const register = new Registry();

collectDefaultMetrics({ register });

/**
 * SLI buckets (ms) covering health (<200ms p95), general (<500ms p95), AI (<2s p95).
 */
const buckets = [10, 25, 50, 100, 200, 300, 500, 750, 1000, 1500, 2000, 3000, 5000];

export const httpRequestDuration = new Histogram({
  name: 'http_request_duration_ms',
  help: 'HTTP request duration in milliseconds',
  labelNames: ['method', 'route', 'status_code', 'category'] as const,
  buckets,
  registers: [register],
});

export const sliBreachTotal = new Counter({
  name: 'sli_breach_total',
  help: 'Total number of SLI budget breaches',
  labelNames: ['category', 'percentile'] as const,
  registers: [register],
});

/**
 * SLI budgets per endpoint category (milliseconds).
 * p95 / p99 targets per issue requirements.
 */
export const SLI_BUDGETS: Record<string, { p95: number; p99: number }> = {
  health: { p95: 200, p99: 500 },
  auth:   { p95: 500, p99: 1000 },
  ai:     { p95: 2000, p99: 3000 },
  general: { p95: 500, p99: 1000 },
};

/** Map a request path to an SLI category. */
export function resolveCategory(path: string): string {
  if (/^\/(health|status)/.test(path) || /\/health/.test(path)) return 'health';
  if (/\/auth/.test(path)) return 'auth';
  if (/\/(ai|tts|translation)/.test(path)) return 'ai';
  return 'general';
}
