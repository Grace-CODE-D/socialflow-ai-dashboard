import { act, renderHook } from '@testing-library/react';
import { useJobStream } from './useJobStream';

class MockEventSource {
  static instances: MockEventSource[] = [];
  url: string;
  onerror: (() => void) | null = null;
  listeners: Record<string, Array<(event: MessageEvent) => void>> = {};
  closed = false;

  constructor(url: string) {
    this.url = url;
    MockEventSource.instances.push(this);
  }

  addEventListener(type: string, fn: (event: MessageEvent) => void) {
    this.listeners[type] = this.listeners[type] ?? [];
    this.listeners[type].push(fn);
  }

  close() {
    this.closed = true;
  }

  emit(type: string, data: unknown, lastEventId = '') {
    for (const fn of this.listeners[type] ?? []) {
      fn({ data: JSON.stringify(data), lastEventId } as MessageEvent);
    }
  }
}

(global as unknown as { EventSource: typeof MockEventSource }).EventSource = MockEventSource;

beforeEach(() => {
  MockEventSource.instances = [];
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

test('updates job state from progress events', () => {
  const { result } = renderHook(() => useJobStream('token'));

  act(() => {
    MockEventSource.instances[0].emit('job_progress', {
      jobId: 'job1',
      userId: 'user1',
      type: 'ai_generation',
      status: 'processing',
      progress: 42,
    });
  });

  expect(result.current.jobs.job1.progress).toBe(42);
});

test('reconnects with backoff and resumes from last event id', () => {
  renderHook(() => useJobStream('token'));

  act(() => {
    MockEventSource.instances[0].emit(
      'job_progress',
      {
        jobId: 'job2',
        userId: 'user1',
        type: 'video_transcoding',
        status: 'processing',
        progress: 10,
      },
      'evt-1',
    );
    MockEventSource.instances[0].onerror?.();
    jest.advanceTimersByTime(1000);
  });

  expect(MockEventSource.instances[1].url).toContain('lastEventId=evt-1');
});

test('reverts optimistic pending state and surfaces an error on a failed retry response', async () => {
  const fetchMock = jest.fn().mockResolvedValue({ ok: false, status: 500 } as Response);
  (global as unknown as { fetch: typeof fetch }).fetch = fetchMock as unknown as typeof fetch;

  const { result } = renderHook(() => useJobStream('token'));

  act(() => {
    MockEventSource.instances[0].emit('job_progress', {
      jobId: 'job3',
      userId: 'user1',
      type: 'ai_generation',
      status: 'failed',
      progress: 20,
      error: 'boom',
    });
  });

  await act(async () => {
    await result.current.retryJob('job3');
  });

  expect(fetchMock).toHaveBeenCalledWith(
    expect.stringContaining('/api/v1/jobs/job3/retry'),
    expect.objectContaining({ method: 'POST' }),
  );
  expect(result.current.jobs.job3.status).toBe('failed');
  expect(result.current.jobs.job3.progress).toBe(20);
  expect(result.current.retryError).toMatch(/500/);
});

test('stops reconnecting after maxRetries', () => {
  const { result } = renderHook(() => useJobStream('token', { maxRetries: 2 }));

  act(() => {
    for (let i = 0; i < 3; i += 1) {
      MockEventSource.instances[MockEventSource.instances.length - 1].onerror?.();
      jest.advanceTimersByTime(60_000);
    }
  });

  expect(result.current.error).toMatch(/reconnection attempts/);
});
