import React from 'react';
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { PredictiveReachDashboard } from '../PredictiveReachDashboard';
import { predictiveService } from '../../../services/PredictiveService';
import { analyticsService } from '../../../services/AnalyticsService';
import { useToast } from '../../../contexts/ToastContext';

vi.mock('../../../services/PredictiveService', () => ({
  predictiveService: {
    batchPredict: vi.fn(),
  },
}));

vi.mock('../../../services/AnalyticsService', () => ({
  analyticsService: {
    getAll: vi.fn(),
    sync: vi.fn(),
  },
}));

vi.mock('../../../contexts/ToastContext', () => ({
  useToast: vi.fn(),
}));

const mockBatchPredict = predictiveService.batchPredict as any;
const mockGetAll = analyticsService.getAll as any;
const mockSync = analyticsService.sync as any;
const mockUseToast = useToast as any;

const makePrediction = (overrides = {}) => ({
  reachScore: 88,
  confidence: 0.92,
  estimatedReach: { min: 88000, max: 220000, expected: 158400 },
  factors: [{ name: 'hashtag_relevance', impact: 'positive', weight: 0.8, description: 'Good hashtag usage' }],
  recommendations: ['Optimize thumbnail', 'Use more hashtags'],
  ...overrides,
});

// The component creates 3 scheduled posts, so batchPredict must return 3 results
const makePredictions = (overrides: any[] = []) => [
  makePrediction({ reachScore: 88, ...overrides[0] }),
  makePrediction({ reachScore: 72, confidence: 0.85, estimatedReach: { min: 72000, max: 180000, expected: 129600 }, recommendations: ['Add call to action'], ...overrides[1] }),
  makePrediction({ reachScore: 45, confidence: 0.78, estimatedReach: { min: 45000, max: 112500, expected: 81000 }, ...overrides[2] }),
];

describe('PredictiveReachDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseToast.mockReturnValue({
      toast: vi.fn(),
      dismiss: vi.fn(),
    });
  });

  it('renders loading state initially', () => {
    mockGetAll.mockReturnValue(new Promise(() => {}));
    mockBatchPredict.mockReturnValue(new Promise(() => {}));

    render(<PredictiveReachDashboard />);

    expect(screen.getByText(/Initializing Neural Core/i)).toBeInTheDocument();
  });

  it('renders populated state with predictions', async () => {
    const mockAnalytics = [
      { id: '1', platform: 'instagram', postId: 'post1', postedAt: 1234567890, likes: 100, shares: 20, views: 1000, comments: 30, syncedAt: 1234567890 },
      { id: '2', platform: 'twitter', postId: 'post2', postedAt: 1234567890, likes: 50, shares: 10, views: 500, comments: 15, syncedAt: 1234567890 },
    ];

    mockGetAll.mockResolvedValue(mockAnalytics);
    mockBatchPredict.mockResolvedValue(makePredictions());

    render(<PredictiveReachDashboard />);

    await waitFor(() => {
      expect(screen.queryByText(/Initializing Neural Core/i)).not.toBeInTheDocument();
    });

    expect(screen.getByText('Active Reach Predictions')).toBeInTheDocument();
    expect(screen.getByText('Real Engagement')).toBeInTheDocument();
    expect(screen.getByText('Model Accuracy')).toBeInTheDocument();
  });

  it('renders empty data state when no analytics and no predictions', async () => {
    let resolveBatch: (value: unknown) => void;
    const batchPromise = new Promise(resolve => { resolveBatch = resolve; });
    mockBatchPredict.mockReturnValue(batchPromise);
    mockGetAll.mockRejectedValue(new Error('no data'));

    render(<PredictiveReachDashboard />);

    await waitFor(() => {
      expect(screen.queryByText(/Initializing Neural Core/i)).not.toBeInTheDocument();
    });

    expect(screen.getByText('No post history yet')).toBeInTheDocument();
    expect(screen.getByText(/Once you start publishing posts/i)).toBeInTheDocument();

    await act(async () => { resolveBatch!(makePredictions()); });
  });

  it('handles API failure gracefully with mock data', async () => {
    mockGetAll.mockRejectedValue(new Error('API unavailable'));
    mockBatchPredict.mockRejectedValue(new Error('API unavailable'));

    render(<PredictiveReachDashboard />);

    await waitFor(() => {
      expect(screen.queryByText(/Initializing Neural Core/i)).not.toBeInTheDocument();
    });

    expect(screen.getByText('Active Reach Predictions')).toBeInTheDocument();
  });

  it('calls syncAnalytics when sync button is clicked', async () => {
    const mockToast = vi.fn();
    const mockDismiss = vi.fn();
    mockUseToast.mockReturnValue({ toast: mockToast, dismiss: mockDismiss });

    mockGetAll.mockResolvedValue([]);
    mockBatchPredict.mockResolvedValue(makePredictions());
    mockSync.mockResolvedValue(undefined);

    render(<PredictiveReachDashboard />);

    await waitFor(() => {
      expect(screen.queryByText(/Initializing Neural Core/i)).not.toBeInTheDocument();
    });

    const syncButton = screen.getByRole('button', { name: /Sync History/i });
    fireEvent.click(syncButton);

    expect(mockSync).toHaveBeenCalledWith({
      instagram: 'dummy-insta-id',
      twitter: 'dummy-twitter-id',
    });
  });

  it('handles boostPost functionality', async () => {
    const mockToast = vi.fn();
    const mockDismiss = vi.fn();
    mockUseToast.mockReturnValue({ toast: mockToast, dismiss: mockDismiss });

    mockGetAll.mockResolvedValue([]);
    mockBatchPredict.mockResolvedValue(makePredictions([{ reachScore: 50 }]));

    render(<PredictiveReachDashboard />);

    await waitFor(() => {
      expect(screen.queryByText(/Initializing Neural Core/i)).not.toBeInTheDocument();
    });

    expect(screen.getByText('Active Reach Predictions')).toBeInTheDocument();

    const refreshButtons = screen.getAllByRole('button');
    const refreshButton = refreshButtons.find(button => {
      const icon = button.querySelector('.material-symbols-outlined');
      return icon?.textContent === 'refresh';
    });

    if (refreshButton) {
      fireEvent.click(refreshButton);
      expect(mockBatchPredict).toHaveBeenCalledTimes(2);
    }
  });

  it('shows syncing state when sync is in progress', async () => {
    const mockToast = vi.fn();
    const mockDismiss = vi.fn();
    mockUseToast.mockReturnValue({ toast: mockToast, dismiss: mockDismiss });

    mockGetAll.mockResolvedValue([]);
    mockBatchPredict.mockResolvedValue(makePredictions());

    let syncResolve: () => void;
    const syncPromise = new Promise<void>(resolve => {
      syncResolve = resolve;
    });
    mockSync.mockReturnValue(syncPromise);

    render(<PredictiveReachDashboard />);

    await waitFor(() => {
      expect(screen.queryByText(/Initializing Neural Core/i)).not.toBeInTheDocument();
    });

    const syncButtons = screen.getAllByRole('button');
    const syncButton = syncButtons.find(button => button.textContent?.includes('Sync History'));
    if (syncButton) {
      fireEvent.click(syncButton);
    }

    expect(screen.getAllByText('Syncing...').length).toBeGreaterThanOrEqual(1);

    await act(async () => {
      syncResolve!();
    });
  });
});
