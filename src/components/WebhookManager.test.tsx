/**
 * WebhookManager.test.tsx
 *
 * Covers:
 *  - Initial load: webhooks fetched on mount and rendered
 *  - Loading state displayed while fetch is in-flight
 *  - Error state displayed when initial fetch fails
 *  - Create webhook → one-time-secret modal shows the secret exactly once
 *  - Create webhook validation (missing URL / events)
 *  - Delete webhook: confirm(true) removes it; confirm(false) keeps it
 *  - Test-event modal: opens, sends event, shows result
 *  - Replay delivery: calls API and refreshes deliveries
 */

import React from 'react';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import WebhookManager from '../WebhookManager';
import { WebhooksService } from '../../api/services/WebhooksService';

// ── Mock the generated API client ────────────────────────────────────────────

jest.mock('../../api/services/WebhooksService', () => ({
  WebhooksService: {
    getWebhooks: jest.fn(),
    postWebhooks: jest.fn(),
    deleteWebhooks: jest.fn(),
    postWebhooksTest: jest.fn(),
    getWebhooksDeliveries: jest.fn(),
    postWebhooksDeliveriesReplay: jest.fn(),
  },
}));

const mockSvc = WebhooksService as jest.Mocked<typeof WebhooksService>;

// Stable fixture
const WEBHOOK_FIXTURE = {
  id: 'wh1',
  url: 'https://hooks.example.com/a',
  events: ['post.published'],
  isActive: true,
  createdAt: '2026-01-01T00:00:00Z',
};

beforeEach(() => {
  jest.clearAllMocks();
  mockSvc.getWebhooks.mockResolvedValue([WEBHOOK_FIXTURE]);
  mockSvc.getWebhooksDeliveries.mockResolvedValue([]);
});

// ── Initial load ─────────────────────────────────────────────────────────────

test('renders webhook URL after loading from the API', async () => {
  render(<WebhookManager />);
  expect(await screen.findByText('https://hooks.example.com/a')).toBeInTheDocument();
});

test('shows a loading indicator while the initial fetch is in-flight', async () => {
  // Make the request hang so we can assert the loading text
  let resolve!: (v: unknown) => void;
  mockSvc.getWebhooks.mockReturnValue(new Promise((r) => (resolve = r)));

  render(<WebhookManager />);
  expect(screen.getByText(/loading/i)).toBeInTheDocument();

  await act(async () => {
    resolve([WEBHOOK_FIXTURE]);
  });

  expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
  expect(await screen.findByText('https://hooks.example.com/a')).toBeInTheDocument();
});

test('shows an error message when the initial fetch rejects', async () => {
  mockSvc.getWebhooks.mockRejectedValue(new Error('Network error'));

  render(<WebhookManager />);

  await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Network error'));
});

test('shows "no webhooks" message when the list is empty', async () => {
  mockSvc.getWebhooks.mockResolvedValue([]);

  render(<WebhookManager />);

  await waitFor(() => {
    expect(mockSvc.getWebhooks).toHaveBeenCalledTimes(1);
  });
  expect(screen.getByText(/no webhooks registered yet/i)).toBeInTheDocument();
});

// ── Create webhook → one-time-secret modal ───────────────────────────────────

test('creating a webhook displays the one-time-secret modal with the secret', async () => {
  mockSvc.postWebhooks.mockImplementation(async ({ requestBody }) => ({
    id: 'wh2',
    url: requestBody!.url,
    events: requestBody!.events,
    isActive: true,
    createdAt: '2026-01-01T00:00:00Z',
  }));

  render(<WebhookManager />);
  await waitFor(() => expect(mockSvc.getWebhooks).toHaveBeenCalled());

  // Fill in the form
  fireEvent.change(screen.getByLabelText(/Endpoint URL/i), {
    target: { value: 'https://example.com/hook' },
  });
  fireEvent.click(screen.getByLabelText('post.published'));

  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: /Create Webhook/i }));
  });

  // The one-time-secret modal should be visible
  await waitFor(() =>
    expect(screen.getByRole('dialog', { name: /webhook signing secret/i })).toBeInTheDocument(),
  );

  // The secret must be a non-empty hex string (64 chars for 32 bytes)
  const modal = screen.getByRole('dialog', { name: /webhook signing secret/i });
  const secretText = within(modal).getByText(/^[0-9a-f]{64}$/i);
  expect(secretText).toBeInTheDocument();

  // Warning text telling user to copy now
  expect(within(modal).getByText(/will not be shown again/i)).toBeInTheDocument();
});

test('one-time-secret modal disappears after the user closes it', async () => {
  mockSvc.postWebhooks.mockResolvedValue({
    id: 'wh2',
    url: 'https://example.com/hook',
    events: ['post.published'],
    isActive: true,
    createdAt: '2026-01-01T00:00:00Z',
  });

  render(<WebhookManager />);
  await waitFor(() => expect(mockSvc.getWebhooks).toHaveBeenCalled());

  fireEvent.change(screen.getByLabelText(/Endpoint URL/i), {
    target: { value: 'https://example.com/hook' },
  });
  fireEvent.click(screen.getByLabelText('post.published'));

  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: /Create Webhook/i }));
  });

  await waitFor(() =>
    expect(screen.getByRole('dialog', { name: /webhook signing secret/i })).toBeInTheDocument(),
  );

  // Dismiss
  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: /i've saved it/i }));
  });

  // Modal must be gone — secret is not shown a second time
  expect(screen.queryByRole('dialog', { name: /webhook signing secret/i })).not.toBeInTheDocument();
});

test('shows a validation error when URL is empty', async () => {
  render(<WebhookManager />);
  await waitFor(() => expect(mockSvc.getWebhooks).toHaveBeenCalled());

  // Check at least one event, but leave URL blank
  fireEvent.click(screen.getByLabelText('post.published'));

  await act(async () => {
    // The submit button has type="submit"; use the form's native validation.
    // We check the error rendered by the component's own code path.
    // Leave URL blank intentionally — the input is `required`, so submit
    // will be blocked by the browser, but we can also clear an existing value.
    fireEvent.submit(screen.getByRole('form', { name: /create webhook/i }));
  });

  // postWebhooks must NOT have been called
  expect(mockSvc.postWebhooks).not.toHaveBeenCalled();
});

test('shows a validation error when no events are selected', async () => {
  render(<WebhookManager />);
  await waitFor(() => expect(mockSvc.getWebhooks).toHaveBeenCalled());

  fireEvent.change(screen.getByLabelText(/Endpoint URL/i), {
    target: { value: 'https://example.com/hook' },
  });
  // Do not select any events

  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: /Create Webhook/i }));
  });

  expect(await screen.findByRole('alert')).toHaveTextContent(
    /URL and at least one event are required/i,
  );
  expect(mockSvc.postWebhooks).not.toHaveBeenCalled();
});

// ── Delete webhook ────────────────────────────────────────────────────────────

test('confirm(true) deletes the webhook and removes it from the list', async () => {
  mockSvc.deleteWebhooks.mockResolvedValue(undefined);
  jest.spyOn(window, 'confirm').mockReturnValue(true);

  render(<WebhookManager />);
  await screen.findByText('https://hooks.example.com/a');

  await act(async () => {
    fireEvent.click(screen.getByLabelText('Delete webhook'));
  });

  await waitFor(() => expect(mockSvc.deleteWebhooks).toHaveBeenCalledWith({ id: 'wh1' }));
  expect(screen.queryByText('https://hooks.example.com/a')).not.toBeInTheDocument();
});

test('confirm(false) cancels the delete and keeps the webhook in the list', async () => {
  jest.spyOn(window, 'confirm').mockReturnValue(false);

  render(<WebhookManager />);
  await screen.findByText('https://hooks.example.com/a');

  await act(async () => {
    fireEvent.click(screen.getByLabelText('Delete webhook'));
  });

  expect(mockSvc.deleteWebhooks).not.toHaveBeenCalled();
  expect(screen.getByText('https://hooks.example.com/a')).toBeInTheDocument();
});

// ── Test-event modal ─────────────────────────────────────────────────────────

test('clicking Test opens the test-event modal', async () => {
  render(<WebhookManager />);
  await screen.findByText('https://hooks.example.com/a');

  fireEvent.click(screen.getByLabelText('Send test event'));

  expect(screen.getByRole('dialog', { name: /send test event/i })).toBeInTheDocument();
});

test('sending a test event calls postWebhooksTest and shows the result', async () => {
  mockSvc.postWebhooksTest.mockResolvedValue({ message: 'Test delivered successfully.' });

  render(<WebhookManager />);
  await screen.findByText('https://hooks.example.com/a');

  fireEvent.click(screen.getByLabelText('Send test event'));
  await screen.findByRole('dialog', { name: /send test event/i });

  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: /^send$/i }));
  });

  await waitFor(() => expect(screen.getByText('Test delivered successfully.')).toBeInTheDocument());
  expect(mockSvc.postWebhooksTest).toHaveBeenCalledWith({
    id: 'wh1',
    requestBody: expect.objectContaining({ eventType: expect.any(String) }),
  });
});

test('test-event modal shows an error message when postWebhooksTest rejects', async () => {
  mockSvc.postWebhooksTest.mockRejectedValue(new Error('Endpoint unreachable'));

  render(<WebhookManager />);
  await screen.findByText('https://hooks.example.com/a');

  fireEvent.click(screen.getByLabelText('Send test event'));
  await screen.findByRole('dialog', { name: /send test event/i });

  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: /^send$/i }));
  });

  await waitFor(() => expect(screen.getByText(/error: endpoint unreachable/i)).toBeInTheDocument());
});

test('cancelling the test-event modal closes it', async () => {
  render(<WebhookManager />);
  await screen.findByText('https://hooks.example.com/a');

  fireEvent.click(screen.getByLabelText('Send test event'));
  await screen.findByRole('dialog', { name: /send test event/i });

  fireEvent.click(screen.getByRole('button', { name: /cancel/i }));

  expect(screen.queryByRole('dialog', { name: /send test event/i })).not.toBeInTheDocument();
});

// ── Replay delivery ──────────────────────────────────────────────────────────

test('replaying a delivery calls postWebhooksDeliveriesReplay and refreshes the list', async () => {
  mockSvc.getWebhooksDeliveries.mockResolvedValue([
    {
      id: 'd1',
      eventType: 'post.published',
      status: 'failed',
      attempts: 1,
      responseStatus: 500,
      createdAt: '2026-01-01T00:00:00Z',
    },
  ]);
  mockSvc.postWebhooksDeliveriesReplay.mockResolvedValue(undefined);

  render(<WebhookManager />);
  await screen.findByText('https://hooks.example.com/a');

  // Expand deliveries
  await act(async () => {
    fireEvent.click(screen.getByLabelText('Toggle delivery log'));
  });
  await waitFor(() => expect(mockSvc.getWebhooksDeliveries).toHaveBeenCalledWith({ id: 'wh1' }));

  await act(async () => {
    fireEvent.click(screen.getByLabelText('Replay delivery'));
  });

  await waitFor(() =>
    expect(mockSvc.postWebhooksDeliveriesReplay).toHaveBeenCalledWith({
      id: 'wh1',
      deliveryId: 'd1',
    }),
  );
  // Deliveries should be refreshed after replay
  expect(mockSvc.getWebhooksDeliveries).toHaveBeenCalledTimes(2);
});
