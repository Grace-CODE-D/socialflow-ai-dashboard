import React from 'react';
import { act, render, renderHook, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ToastProvider, useToast } from './ToastContext';

// framer-motion's AnimatePresence and motion components are not relevant to the
// logic under test and require browser layout APIs.  Mock them out so they just
// render their children synchronously.
jest.mock('framer-motion', () => ({
  motion: {
    div: ({
      children,
      ...rest
    }: React.HTMLAttributes<HTMLDivElement> & { children?: React.ReactNode }) => (
      <div {...rest}>{children}</div>
    ),
  },
  AnimatePresence: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
}));

// ─── helpers ──────────────────────────────────────────────────────────────────

/** Render a component that calls useToast() inside a ToastProvider. */
function renderWithProvider() {
  // We expose the context value through a ref captured in the wrapper.
  let api: ReturnType<typeof useToast>;

  function Consumer() {
    api = useToast();
    return null;
  }

  render(
    <ToastProvider>
      <Consumer />
    </ToastProvider>,
  );

  // @ts-expect-error – assigned synchronously above inside Consumer render
  return api!;
}

// ─── useToast outside provider ────────────────────────────────────────────────

test('useToast() throws when rendered outside of ToastProvider', () => {
  // Suppress the React error boundary console output
  const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
  expect(() => renderHook(() => useToast())).toThrow(
    'useToast must be used within a ToastProvider',
  );
  spy.mockRestore();
});

// ─── auto-dismiss ─────────────────────────────────────────────────────────────

describe('auto-dismiss behavior', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('a non-loading toast is removed from the DOM after 3800 ms', async () => {
    const api = renderWithProvider();

    act(() => {
      api.toast('Hello world', 'success');
    });

    expect(screen.getByText('Hello world')).toBeInTheDocument();

    act(() => {
      jest.advanceTimersByTime(3799);
    });
    expect(screen.getByText('Hello world')).toBeInTheDocument();

    act(() => {
      jest.advanceTimersByTime(1); // total: 3800 ms
    });
    expect(screen.queryByText('Hello world')).not.toBeInTheDocument();
  });

  test('a "loading" toast is NOT auto-dismissed', () => {
    const api = renderWithProvider();

    act(() => {
      api.toast('Saving…', 'loading');
    });

    act(() => {
      jest.advanceTimersByTime(10_000);
    });

    expect(screen.getByText('Saving…')).toBeInTheDocument();
  });

  test('dismiss() removes a loading toast immediately', () => {
    const api = renderWithProvider();

    let id: string;
    act(() => {
      id = api.toast('Processing…', 'loading');
    });

    expect(screen.getByText('Processing…')).toBeInTheDocument();

    act(() => {
      api.dismiss(id!);
    });

    expect(screen.queryByText('Processing…')).not.toBeInTheDocument();
  });
});

// ─── multiple toasts / id uniqueness ─────────────────────────────────────────

describe('multiple simultaneous toasts', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  test('all toasts are rendered at the same time', () => {
    const api = renderWithProvider();

    act(() => {
      api.toast('Toast A', 'info');
      api.toast('Toast B', 'success');
      api.toast('Toast C', 'error');
    });

    expect(screen.getByText('Toast A')).toBeInTheDocument();
    expect(screen.getByText('Toast B')).toBeInTheDocument();
    expect(screen.getByText('Toast C')).toBeInTheDocument();
  });

  test('ids returned for multiple toasts are all unique (no collisions)', () => {
    const api = renderWithProvider();

    const ids: string[] = [];
    act(() => {
      // Create enough toasts to surface any id-generation collision.
      for (let i = 0; i < 50; i++) {
        ids.push(api.toast(`Toast ${i}`, 'info'));
      }
    });

    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(50);
  });

  test('toast() returns a string id', () => {
    const api = renderWithProvider();

    let id: string;
    act(() => {
      id = api.toast('Check id', 'info');
    });

    expect(typeof id!).toBe('string');
    expect(id!.length).toBeGreaterThan(0);
  });
});

// ─── dismiss by id ────────────────────────────────────────────────────────────

test('dismiss() removes only the targeted toast, leaving others intact', () => {
  jest.useFakeTimers();
  const api = renderWithProvider();

  let _idA: string;
  let idB: string;

  act(() => {
    _idA = api.toast('Keep me', 'loading');
    idB = api.toast('Remove me', 'loading');
  });

  act(() => {
    api.dismiss(idB!);
  });

  expect(screen.getByText('Keep me')).toBeInTheDocument();
  expect(screen.queryByText('Remove me')).not.toBeInTheDocument();

  jest.useRealTimers();
});
