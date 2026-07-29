import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import WebhookManager from '../WebhookManager';
import { WebhooksService } from '../../api/services/WebhooksService';

vi.mock('../../api/services/WebhooksService', () => ({
  WebhooksService: {
    getWebhooks: vi.fn(),
    postWebhooks: vi.fn(),
    deleteWebhooks: vi.fn(),
    postWebhooksTest: vi.fn(),
    getWebhooksDeliveries: vi.fn(),
    postWebhooksDeliveriesReplay: vi.fn(),
  },
}));

const mockSvc = WebhooksService as any;

beforeEach(() => {
  vi.clearAllMocks();
  mockSvc.getWebhooks.mockResolvedValue([
    { id: 'wh1', url: 'https://hooks.example.com/a', events: ['post.published'], isActive: true, createdAt: '2026-01-01T00:00:00Z' },
  ]);
  mockSvc.getWebhooksDeliveries.mockResolvedValue([]);
});

test('loads webhooks from the real API client on mount', async () => {
  render(<WebhookManager />);

  await waitFor(() => expect(mockSvc.getWebhooks).toHaveBeenCalledTimes(1));
  expect(await screen.findByText('https://hooks.example.com/a')).toBeInTheDocument();
});

test('creating a webhook calls WebhooksService.postWebhooks with the form data', async () => {
  mockSvc.postWebhooks.mockResolvedValue({
    id: 'wh2',
    url: 'https://example.com/hook',
    events: ['post.failed'],
    isActive: true,
    createdAt: '2026-01-01T00:00:00Z',
  });

  render(<WebhookManager />);
  await waitFor(() => expect(mockSvc.getWebhooks).toHaveBeenCalled());

  fireEvent.change(screen.getByLabelText(/Endpoint URL/i), { target: { value: 'https://example.com/hook' } });
  fireEvent.click(screen.getByLabelText('post.failed'));

  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: /Create Webhook/i }));
  });

  await waitFor(() =>
    expect(mockSvc.postWebhooks).toHaveBeenCalledWith({
      requestBody: expect.objectContaining({ url: 'https://example.com/hook', events: ['post.failed'] }),
    }),
  );
});

test('deleting a webhook calls WebhooksService.deleteWebhooks with the webhook id', async () => {
  mockSvc.deleteWebhooks.mockResolvedValue(undefined);
  vi.spyOn(window, 'confirm').mockReturnValue(true);

  render(<WebhookManager />);
  await screen.findByText('https://hooks.example.com/a');

  await act(async () => {
    fireEvent.click(screen.getByLabelText('Delete webhook'));
  });

  await waitFor(() => expect(mockSvc.deleteWebhooks).toHaveBeenCalledWith({ id: 'wh1' }));
});

test('replaying a delivery calls WebhooksService.postWebhooksDeliveriesReplay', async () => {
  mockSvc.getWebhooksDeliveries.mockResolvedValue([
    { id: 'd1', eventType: 'post.published', status: 'success', attempts: 1, responseStatus: 200, createdAt: '2026-01-01T00:00:00Z' },
  ]);
  mockSvc.postWebhooksDeliveriesReplay.mockResolvedValue(undefined);

  render(<WebhookManager />);
  await screen.findByText('https://hooks.example.com/a');

  await act(async () => {
    fireEvent.click(screen.getByLabelText('Toggle delivery log'));
  });
  await waitFor(() => expect(mockSvc.getWebhooksDeliveries).toHaveBeenCalledWith({ id: 'wh1' }));

  await act(async () => {
    fireEvent.click(screen.getByLabelText('Replay delivery'));
  });

  await waitFor(() =>
    expect(mockSvc.postWebhooksDeliveriesReplay).toHaveBeenCalledWith({ id: 'wh1', deliveryId: 'd1' }),
  );
});
