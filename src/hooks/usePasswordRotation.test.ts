/**
 * usePasswordRotation.test.ts
 *
 * Covers:
 *  - Missing accessToken → sets error, does NOT call fetch
 *  - Successful password change → isLoading lifecycle, no error after success
 *  - Server returns ok:false with a message → error propagates to state
 *  - Server returns ok:false without a message → falls back to generic message
 *  - Network failure (fetch rejects) → error propagates to state
 *  - changePassword re-throws after setting error (caller can handle)
 */

import { act, renderHook } from '@testing-library/react';
import { usePasswordRotation } from './usePasswordRotation';

// ── setup ─────────────────────────────────────────────────────────────────────

const mockFetch = jest.fn();
const mockGetItem = jest.spyOn(Storage.prototype, 'getItem');

beforeEach(() => {
  jest.clearAllMocks();
  global.fetch = mockFetch as unknown as typeof fetch;
});

afterEach(() => {
  jest.resetAllMocks();
});

// ── helper ────────────────────────────────────────────────────────────────────

function renderPasswordRotation() {
  return renderHook(() => usePasswordRotation());
}

// ── initial state ─────────────────────────────────────────────────────────────

test('starts with isLoading=false and error=null', () => {
  mockGetItem.mockReturnValue(null);
  const { result } = renderPasswordRotation();

  expect(result.current.isLoading).toBe(false);
  expect(result.current.error).toBeNull();
});

// ── missing token path ─────────────────────────────────────────────────────────

test('sets error when accessToken is absent and does not call fetch', async () => {
  mockGetItem.mockReturnValue(null);

  const { result } = renderPasswordRotation();

  await act(async () => {
    await expect(result.current.changePassword('OldPass1!', 'NewPass1!')).rejects.toThrow(
      'No access token found',
    );
  });

  expect(mockFetch).not.toHaveBeenCalled();
  expect(result.current.error).toBe('No access token found');
  expect(result.current.isLoading).toBe(false);
});

// ── successful change ─────────────────────────────────────────────────────────

test('calls fetch with correct URL, method, headers and body on success', async () => {
  mockGetItem.mockReturnValue('my-jwt-token');
  mockFetch.mockResolvedValue({
    ok: true,
    json: async () => ({ message: 'Password changed.' }),
  });

  const { result } = renderPasswordRotation();

  await act(async () => {
    await result.current.changePassword('OldPass1!', 'NewPass123!');
  });

  expect(mockFetch).toHaveBeenCalledWith('/api/auth/change-password', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer my-jwt-token',
    },
    body: JSON.stringify({ currentPassword: 'OldPass1!', newPassword: 'NewPass123!' }),
  });
});

test('isLoading is true during the request and false after it resolves', async () => {
  mockGetItem.mockReturnValue('my-jwt-token');

  let resolveFetch!: (value: unknown) => void;
  mockFetch.mockReturnValue(
    new Promise((resolve) => {
      resolveFetch = resolve;
    }),
  );

  const { result } = renderPasswordRotation();

  let pendingPromise: Promise<void>;
  act(() => {
    pendingPromise = result.current.changePassword('OldPass1!', 'NewPass123!');
  });

  // While the request is in-flight loading should be true
  expect(result.current.isLoading).toBe(true);

  await act(async () => {
    resolveFetch({ ok: true, json: async () => ({ message: 'ok' }) });
    await pendingPromise!;
  });

  expect(result.current.isLoading).toBe(false);
});

test('error remains null and changePassword resolves on success', async () => {
  mockGetItem.mockReturnValue('token-abc');
  mockFetch.mockResolvedValue({
    ok: true,
    json: async () => ({ message: 'Done' }),
  });

  const { result } = renderPasswordRotation();

  await act(async () => {
    await expect(result.current.changePassword('Old', 'NewPass123!')).resolves.toBeUndefined();
  });

  expect(result.current.error).toBeNull();
});

// ── server error path ─────────────────────────────────────────────────────────

test('propagates server error message to error state when ok is false', async () => {
  mockGetItem.mockReturnValue('token-abc');
  mockFetch.mockResolvedValue({
    ok: false,
    json: async () => ({ message: 'Current password is incorrect' }),
  });

  const { result } = renderPasswordRotation();

  await act(async () => {
    await expect(result.current.changePassword('WrongPass', 'NewPass123!')).rejects.toThrow(
      'Current password is incorrect',
    );
  });

  expect(result.current.error).toBe('Current password is incorrect');
  expect(result.current.isLoading).toBe(false);
});

test('falls back to generic message when server error has no message field', async () => {
  mockGetItem.mockReturnValue('token-abc');
  mockFetch.mockResolvedValue({
    ok: false,
    json: async () => ({}),
  });

  const { result } = renderPasswordRotation();

  await act(async () => {
    await expect(result.current.changePassword('Old', 'NewPass123!')).rejects.toThrow(
      'Failed to change password',
    );
  });

  expect(result.current.error).toBe('Failed to change password');
});

// ── network failure ───────────────────────────────────────────────────────────

test('sets error when fetch itself rejects (network failure)', async () => {
  mockGetItem.mockReturnValue('token-abc');
  mockFetch.mockRejectedValue(new Error('Network request failed'));

  const { result } = renderPasswordRotation();

  await act(async () => {
    await expect(result.current.changePassword('Old', 'NewPass123!')).rejects.toThrow(
      'Network request failed',
    );
  });

  expect(result.current.error).toBe('Network request failed');
  expect(result.current.isLoading).toBe(false);
});

// ── re-throw behavior ─────────────────────────────────────────────────────────

test('changePassword re-throws so callers can handle the error', async () => {
  mockGetItem.mockReturnValue(null); // triggers missing-token error

  const { result } = renderPasswordRotation();

  let caughtError: Error | undefined;
  await act(async () => {
    try {
      await result.current.changePassword('Old', 'New');
    } catch (e) {
      caughtError = e as Error;
    }
  });

  expect(caughtError).toBeInstanceOf(Error);
  expect(caughtError!.message).toBe('No access token found');
});
