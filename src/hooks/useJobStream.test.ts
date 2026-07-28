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

// Mock fetch for SSE ticket endpoint
const mockFetch = jest.fn();
global.fetch = mockFetch as any;

beforeEach(() => {
  MockEventSource.instances = [];
  jest.useFakeTimers();
  
  // Default mock response for SSE ticket endpoint
  mockFetch.mockResolvedValue({
    ok: true,
    json: async () => ({ ticket: 'mock-sse-ticket-123', expiresIn: 30 }),
  });
});

afterEach(() => {
  jest.useRealTimers();
  mockFetch.mockClear();
});

test('updates job state from progress events', async () => {
  const { result } = renderHook(() => useJobStream('token'));

  // Wait for ticket fetch and EventSource to be created
  await act(async () => {
    await Promise.resolve(); // flush promises
    jest.runAllTimers();
  });

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

test('fetches SSE ticket before connecting', async () => {
  renderHook(() => useJobStream('my-jwt-token', { baseUrl: 'http://test' }));

  await act(async () => {
    await Promise.resolve(); // flush promises
    jest.runAllTimers();
  });

  expect(mockFetch).toHaveBeenCalledWith(
    'http://test/api/auth/sse-ticket',
    expect.objectContaining({
      method: 'POST',
      headers: { Authorization: 'Bearer my-jwt-token' },
    })
  );
});

test('uses SSE ticket instead of JWT in EventSource URL', async () => {
  renderHook(() => useJobStream('my-jwt-token'));

  await act(async () => {
    await Promise.resolve(); // flush promises
    jest.runAllTimers();
  });

  const esUrl = MockEventSource.instances[0].url;
  expect(esUrl).toContain('ticket=mock-sse-ticket-123');
  expect(esUrl).not.toContain('token=');
  expect(esUrl).not.toContain('my-jwt-token');
});

test('reconnects with backoff and resumes from last event id', async () => {
  renderHook(() => useJobStream('token'));

  await act(async () => {
    await Promise.resolve();
    jest.runAllTimers();
  });

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
  });

  await act(async () => {
    jest.advanceTimersByTime(1000);
    await Promise.resolve(); // flush promises for new ticket fetch
    jest.runAllTimers();
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

  await act(async () => {
    await Promise.resolve();
    jest.runAllTimers();
  });

  await act(async () => {
    for (let i = 0; i < 3; i += 1) {
      MockEventSource.instances[MockEventSource.instances.length - 1].onerror?.();
      jest.advanceTimersByTime(60_000);
      await Promise.resolve();
      jest.runAllTimers();
    }
  });

  expect(result.current.error).toMatch(/connection after/);
});
