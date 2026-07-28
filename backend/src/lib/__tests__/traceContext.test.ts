import { trace, context, SpanKind } from '@opentelemetry/api';
import {
  BasicTracerProvider,
  InMemorySpanExporter,
  SimpleSpanProcessor,
} from '@opentelemetry/sdk-trace-base';
import { captureTraceContext, restoreTraceContext } from '../traceContext';

describe('lib/traceContext', () => {
  it('captureTraceContext returns undefined when there is no active span', () => {
    const result = captureTraceContext();
    expect(result).toBeUndefined();
  });

  it('restoreTraceContext returns the current active context when serialized is falsy', () => {
    const ctx = restoreTraceContext(undefined);
    expect(ctx).toBe(context.active());
  });

  it('captures a traceparent from an active span and can restore it into a remote context', () => {
    const exporter = new InMemorySpanExporter();
    const provider = new BasicTracerProvider({
      spanProcessors: [new SimpleSpanProcessor(exporter)],
    });
    trace.setGlobalTracerProvider(provider);
    const tracer = trace.getTracer('test-tracer');

    let captured: ReturnType<typeof captureTraceContext>;

    tracer.startActiveSpan('test-span', { kind: SpanKind.INTERNAL }, (span) => {
      captured = captureTraceContext();
      span.end();
    });

    expect(captured).toBeDefined();
    expect(captured?.traceparent).toMatch(/^00-[0-9a-f]{32}-[0-9a-f]{16}-0[01]$/);

    const restored = restoreTraceContext(captured);
    const remoteSpanContext = trace.getSpanContext(restored);

    expect(remoteSpanContext?.traceId).toBe(
      captured?.traceparent?.split('-')[1],
    );
  });
});
