/**
 * tracing.ts
 *
 * OpenTelemetry SDK initialisation — must be imported BEFORE any other module
 * so auto-instrumentation patches are applied at startup.
 *
 * Usage:
 *   import './tracing';          // ESM / ts-node
 *   node -r ./dist/tracing.js … // CommonJS pre-require
 *
 * Supported exporters (OTEL_EXPORTER env var):
 *   jaeger   → Jaeger HTTP collector  (default)
 *   honeycomb → Honeycomb OTLP endpoint
 *   otlp     → Generic OTLP/HTTP endpoint
 */

import { NodeSDK } from '@opentelemetry/sdk-node';
import { Resource } from '@opentelemetry/resources';
import { ATTR_SERVICE_NAME, ATTR_SERVICE_VERSION } from '@opentelemetry/semantic-conventions';
import { SimpleSpanProcessor, BatchSpanProcessor } from '@opentelemetry/sdk-trace-base';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { JaegerExporter } from '@opentelemetry/exporter-jaeger';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { SpanExporter } from '@opentelemetry/sdk-trace-base';
import { createLogger } from './lib/logger';

const logger = createLogger('tracing');

// ─── Exporter factory ────────────────────────────────────────────────────────

function buildExporter(): SpanExporter {
  const exporterType = (process.env.OTEL_EXPORTER ?? 'jaeger').toLowerCase();

  switch (exporterType) {
    case 'honeycomb': {
      const apiKey = process.env.HONEYCOMB_API_KEY;
      const dataset = process.env.HONEYCOMB_DATASET ?? 'socialflow-ai-dashboard';
      if (!apiKey) {
        logger.warn('HONEYCOMB_API_KEY is not set — traces will not be exported');
      }
      return new OTLPTraceExporter({
        url: 'https://api.honeycomb.io/v1/traces',
        headers: {
          'x-honeycomb-team': apiKey ?? '',
          'x-honeycomb-dataset': dataset,
        },
      });
    }

    case 'otlp': {
      const endpoint =
        process.env.OTEL_EXPORTER_OTLP_ENDPOINT ?? 'http://localhost:4318/v1/traces';
      return new OTLPTraceExporter({ url: endpoint });
    }

    case 'jaeger':
    default: {
      const endpoint =
        process.env.JAEGER_ENDPOINT ?? 'http://localhost:14268/api/traces';
      return new JaegerExporter({ endpoint });
    }
  }
}

// ─── SDK initialisation ──────────────────────────────────────────────────────

const isDebug = process.env.OTEL_DEBUG === 'true';
const serviceName = process.env.OTEL_SERVICE_NAME ?? 'socialflow-ai-dashboard';

const exporter = buildExporter();

// Use BatchSpanProcessor in production for throughput; Simple in debug for immediacy.
const spanProcessor = isDebug
  ? new SimpleSpanProcessor(exporter)
  : new BatchSpanProcessor(exporter, {
      maxQueueSize: 512,
      scheduledDelayMillis: 5_000,
    });

export const sdk = new NodeSDK({
  resource: new Resource({
    [ATTR_SERVICE_NAME]: serviceName,
    [ATTR_SERVICE_VERSION]: process.env.npm_package_version ?? '0.0.0',
    environment: process.env.NODE_ENV ?? 'development',
  }),
  spanProcessors: [spanProcessor],
  instrumentations: [
    getNodeAutoInstrumentations({
      // Reduce noise from internal fs polling
      '@opentelemetry/instrumentation-fs': { enabled: false },
    }),
  ],
});

sdk.start();
logger.info('OpenTelemetry tracing initialised', {
  service: serviceName,
  exporter: process.env.OTEL_EXPORTER ?? 'jaeger',
});

// Flush spans on graceful shutdown
process.on('SIGTERM', () => {
  sdk
    .shutdown()
    .then(() => logger.info('OTel SDK shut down cleanly'))
    .catch((err: unknown) => logger.error('OTel SDK shutdown error', err));
});
