import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { PostComposer } from '../PostComposer';
import { PostsProvider } from '../../contexts/PostsContext';
import { ToastProvider } from '../../contexts/ToastContext';
import { useAuth } from '../../contexts/AuthContext';
import { predictiveService } from '../../services/PredictiveService';

jest.mock('../../contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}));

jest.mock('../../services/PredictiveService', () => ({
  predictiveService: {
    predictReach: jest.fn(),
  },
}));

const mockUseAuth = useAuth as jest.Mock;
const mockPredictReach = predictiveService.predictReach as jest.Mock;

const basePrediction = {
  reachScore: 72,
  estimatedReach: { min: 1000, max: 5000, expected: 3000 },
  confidence: 0.8,
  factors: [],
  recommendations: [],
};

const renderComposer = () =>
  render(
    <ToastProvider>
      <PostsProvider>
        <PostComposer open onClose={jest.fn()} />
      </PostsProvider>
    </ToastProvider>
  );

beforeEach(() => {
  jest.clearAllMocks();
  mockPredictReach.mockResolvedValue(basePrediction);
});

describe('PostComposer follower count', () => {
  test('uses the account real follower count when provided', async () => {
    mockUseAuth.mockReturnValue({ user: { name: 'Alex', email: 'a@b.com', plan: 'Pro', followerCount: 84213 } });
    renderComposer();

    fireEvent.change(screen.getByPlaceholderText(/Write your caption/), {
      target: { value: 'Hello world, this is a real caption' },
    });

    await waitFor(() => expect(mockPredictReach).toHaveBeenCalled());
    const input = mockPredictReach.mock.calls[0][0];
    expect(input.followerCount).toBe(84213);

    expect(screen.queryByText(/No connected follower count/)).not.toBeInTheDocument();
  });

  test('falls back to a clearly-labeled placeholder when real follower count is unavailable', async () => {
    mockUseAuth.mockReturnValue({ user: { name: 'Alex', email: 'a@b.com', plan: 'Pro' } });
    renderComposer();

    fireEvent.change(screen.getByPlaceholderText(/Write your caption/), {
      target: { value: 'Hello world, this is a real caption' },
    });

    await waitFor(() => expect(mockPredictReach).toHaveBeenCalled());
    const input = mockPredictReach.mock.calls[0][0];
    expect(input.followerCount).not.toBe(120000);

    expect(screen.getByText(/No connected follower count/)).toBeInTheDocument();
  });
});
