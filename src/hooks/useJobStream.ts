import { useEffect, useRef, useCallback, useState } from 'react';

export type JobStatus = 'pending' | 'processing' | 'completed' | 'failed';
export type JobType = 'video_transcoding' | 'ai_generation';

export interface JobProgressEvent {
  jobId: string;
  userId: string;
  type: JobType;
  status: JobStatus;
  progress: number;
  message?: string;
  error?: string;
  meta?: Record<string, unknown>;
}

export interface JobState {
  [jobId: string]: JobProgressEvent;
}

interface UseJobStreamOptions {
  /** Called on every job_progress event */
  onProgress?: (event: JobProgressEvent) => void;
  /** Called when a job transitions to the failed state */
  onJobFailed?: (event: JobProgressEvent) => void;
  /** Base URL — defaults to '' (same origin) */
  baseUrl?: string;
  /** Maximum reconnect attempts before surfacing an error */
  maxRetries?: number;
}

const INITIAL_RETRY_DELAY_MS = 1000;
const MAX_RETRY_DELAY_MS = 30_000;

/**
 * useJobStream — subscribes to /api/realtime/stream via SSE.
 *
 * Automatically reconnects with exponential backoff on disconnect.
 * Pass the JWT token from your auth store.
 */
export function useJobStream(token: string | null, options: UseJobStreamOptions = {}) {
  const [jobs, setJobs] = useState<JobState>({});
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryError, setRetryError] = useState<string | null>(null);
  const esRef = useRef<EventSource | null>(null);
  const retryRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const retryDelay = useRef(INITIAL_RETRY_DELAY_MS);
  const retryCount = useRef(0);
  const lastEventId = useRef<string | null>(null);
  const mountedRef = useRef(false);
  const { onProgress, onJobFailed, baseUrl = '', maxRetries = 5 } = options;

  const cleanupStream = useCallback(() => {
    esRef.current?.close();
    esRef.current = null;
    if (retryRef.current) {
      clearTimeout(retryRef.current);
      retryRef.current = null;
    }
  }, []);

  const connect = useCallback(() => {
    if (!token || !mountedRef.current) return;

    cleanupStream();

    // Fetch a short-lived SSE ticket before connecting
    (async () => {
      try {
        const ticketResponse = await fetch(`${baseUrl}/api/auth/sse-ticket`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!ticketResponse.ok) {
          throw new Error(`Failed to obtain SSE ticket: ${ticketResponse.status}`);
        }

        const { ticket } = await ticketResponse.json();

        if (!mountedRef.current) return;

        // Use the short-lived ticket instead of the JWT
        const params = new URLSearchParams({ ticket });
        if (lastEventId.current) params.set('lastEventId', lastEventId.current);
        const es = new EventSource(`${baseUrl}/api/realtime/stream?${params.toString()}`);
        esRef.current = es;

        es.addEventListener('connected', () => {
          if (!mountedRef.current) return;
          setConnected(true);
          setError(null);
          retryCount.current = 0;
          retryDelay.current = INITIAL_RETRY_DELAY_MS;
        });

        es.addEventListener('job_progress', (e: MessageEvent) => {
          if (!mountedRef.current) return;
          if (e.lastEventId) lastEventId.current = e.lastEventId;
          try {
            const event: JobProgressEvent = JSON.parse(e.data as string);
            setJobs((prev: JobState) => ({ ...prev, [event.jobId]: event }));
            onProgress?.(event);
            if (event.status === 'failed') {
              onJobFailed?.(event);
            }
          } catch {
            // malformed event — ignore
          }
        });

        // Handle explicit 'failed' SSE event type emitted by the backend
        es.addEventListener('failed', (e: MessageEvent) => {
          if (!mountedRef.current) return;
          if (e.lastEventId) lastEventId.current = e.lastEventId;
          try {
            const event: JobProgressEvent = JSON.parse(e.data as string);
            const failedEvent: JobProgressEvent = { ...event, status: 'failed' };
            setJobs((prev: JobState) => ({ ...prev, [failedEvent.jobId]: failedEvent }));
            onProgress?.(failedEvent);
            onJobFailed?.(failedEvent);
          } catch {
            // malformed event — ignore
          }
        });

        es.onerror = () => {
          if (!mountedRef.current) return;
          setConnected(false);
          es.close();
          esRef.current = null;

          if (retryCount.current >= maxRetries) {
            setError(`Stream disconnected after ${maxRetries} reconnection attempts.`);
            return;
          }

          // Exponential backoff: 1s → 2s → 4s → … capped at 30s
          const delay = Math.min(retryDelay.current, MAX_RETRY_DELAY_MS);
          retryDelay.current = Math.min(delay * 2, MAX_RETRY_DELAY_MS);
          retryCount.current += 1;
          retryRef.current = setTimeout(connect, delay);
        };
      } catch (err) {
        // Ticket fetch failed — retry with backoff
        if (!mountedRef.current) return;
        setConnected(false);
        
        if (retryCount.current >= maxRetries) {
          setError(`Failed to establish SSE connection after ${maxRetries} attempts.`);
          return;
        }

        const delay = Math.min(retryDelay.current, MAX_RETRY_DELAY_MS);
        retryDelay.current = Math.min(delay * 2, MAX_RETRY_DELAY_MS);
        retryCount.current += 1;
        retryRef.current = setTimeout(connect, delay);
      }
    })();
  }, [token, baseUrl, onProgress, onJobFailed, maxRetries, cleanupStream]);

  useEffect(() => {
    mountedRef.current = true;
    connect();
    return () => {
      mountedRef.current = false;
      cleanupStream();
    };
  }, [connect, cleanupStream]);

  const clearJob = useCallback((jobId: string) => {
    setJobs((prev: JobState) => {
      const next = { ...prev };
      delete next[jobId];
      return next;
    });
  }, []);

  /**
   * Re-enqueue a failed job by POSTing to the backend retry endpoint.
   * Clears the local failed state so the UI shows a fresh pending entry.
   */
  const retryJob = useCallback(
    async (jobId: string): Promise<void> => {
      if (!token) return;
      const previousJob = jobs[jobId];
      setRetryError(null);
      setJobs((prev: JobState) => {
        if (!prev[jobId]) return prev;
        return { ...prev, [jobId]: { ...prev[jobId], status: 'pending', progress: 0, error: undefined } };
      });

      let response: Response;
      try {
        response = await fetch(`${baseUrl}/api/v1/jobs/${encodeURIComponent(jobId)}/retry`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch (err) {
        setJobs((prev: JobState) => (previousJob ? { ...prev, [jobId]: previousJob } : prev));
        setRetryError(err instanceof Error ? err.message : 'Failed to retry job');
        return;
      }

      if (!response.ok) {
        setJobs((prev: JobState) => (previousJob ? { ...prev, [jobId]: previousJob } : prev));
        const message = `Retry failed with status ${response.status}`;
        setRetryError(message);
        if (previousJob) {
          onJobFailed?.(previousJob);
        }
      }
    },
    [token, baseUrl, jobs, onJobFailed],
  );

  return { jobs, connected, error, retryError, clearJob, retryJob };
}
