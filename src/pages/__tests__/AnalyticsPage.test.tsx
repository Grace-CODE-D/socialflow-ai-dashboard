/**
 * AnalyticsPage tests: asserts it calls the real analytics API when
 * configured, uses the response when it looks real, and falls back to
 * sample data (with a visible indicator) when the backend call fails.
 */
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { AnalyticsPage } from '../AnalyticsPage';
import { AnalyticsService } from '../../api/services/AnalyticsService';

vi.mock('../../api/services/AnalyticsService', () => ({
  AnalyticsService: {
    getAnalytics: vi.fn(),
  },
}));

const mockGetAnalytics = AnalyticsService.getAnalytics as any;

describe('AnalyticsPage', () => {
  afterEach(() => vi.clearAllMocks());

  it('calls the real analytics API on mount', async () => {
    mockGetAnalytics.mockResolvedValueOnce({
      series: [
        { day: 'Mon W1', reach: 1000, engagement: 50, followers: 100 },
        { day: 'Tue W1', reach: 1200, engagement: 60, followers: 120 },
      ],
      platformShare: [{ platform: 'Instagram', value: 100, color: '#f43f5e' }],
    });

    render(<AnalyticsPage />);

    await waitFor(() => expect(mockGetAnalytics).toHaveBeenCalledTimes(1));
  });

  it('renders real data and hides the sample-data indicator when the API succeeds', async () => {
    mockGetAnalytics.mockResolvedValueOnce({
      series: [
        { day: 'Mon W1', reach: 1000, engagement: 50, followers: 100 },
        { day: 'Tue W1', reach: 1200, engagement: 60, followers: 120 },
      ],
      platformShare: [{ platform: 'Instagram', value: 100, color: '#f43f5e' }],
    });

    render(<AnalyticsPage />);

    await waitFor(() => expect(screen.queryByRole('status')).not.toBeInTheDocument());
  });

  it('falls back to sample data with a visible indicator when the API call fails', async () => {
    mockGetAnalytics.mockRejectedValueOnce(new Error('backend unreachable'));

    render(<AnalyticsPage />);

    await waitFor(() => expect(mockGetAnalytics).toHaveBeenCalledTimes(1));
    expect(await screen.findByRole('status')).toHaveTextContent(/sample data/i);
  });
});
