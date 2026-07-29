import React from 'react';
import { render, screen, act, waitFor } from '@testing-library/react';
import { ReachScoreWidget } from './ReachScoreWidget';
import { predictiveService } from '../services/PredictiveService';

jest.mock('../services/PredictiveService', () => ({
  predictiveService: {
    predictReach: jest.fn(),
  },
}));

const predictMock = predictiveService.predictReach as jest.Mock;

const samplePrediction = {
  reachScore: 72,
  estimatedReach: { min: 1200, expected: 1800, max: 3200 },
  confidence: 0.82,
  factors: [{ name: 'Length', impact: 'positive', weight: 0.2, description: '22 words' }],
  recommendations: ['Keep it up'],
  optimalPostTime: new Date(),
  competitorBenchmark: 50,
};

afterEach(() => {
  jest.clearAllMocks();
});

test('shows loading state while predicting then displays prediction', async () => {
  jest.useFakeTimers();
  // Resolve after a timeout so loading can be asserted
  predictMock.mockImplementation(
    () => new Promise((res) => setTimeout(() => res(samplePrediction), 500)),
  );

  render(
    <ReachScoreWidget
      postData={{
        content: 'Hello world',
        platform: 'instagram',
        mediaType: 'image',
        hashtags: [],
        followerCount: 1000,
        scheduledTime: new Date(),
      }}
    />,
  );

  // loading indicator should be present immediately
  expect(screen.getByText(/Analyzing reach potential/i)).toBeInTheDocument();

  await act(async () => {
    jest.advanceTimersByTime(500);
  });

  await waitFor(() => expect(screen.getByText(/Predicted Reach Score/i)).toBeInTheDocument());
  expect(screen.getByText(/72/)).toBeInTheDocument();
  jest.useRealTimers();
});

test('renders populated score UI when prediction resolves', async () => {
  predictMock.mockResolvedValue(samplePrediction);

  render(
    <ReachScoreWidget
      postData={{
        content: 'Nice post content',
        platform: 'instagram',
        mediaType: 'image',
        hashtags: [],
        followerCount: 1000,
        scheduledTime: new Date(),
      }}
    />,
  );

  await waitFor(() => expect(screen.getByText(/Predicted Reach Score/i)).toBeInTheDocument());
  expect(screen.getByText(/72/)).toBeInTheDocument();
  expect(screen.getByText(/Estimated Reach/i)).toBeInTheDocument();
});

test('handles prediction error and falls back to no-prediction UI', async () => {
  predictMock.mockRejectedValue(new Error('network'));

  render(
    <ReachScoreWidget
      postData={{
        content: 'Hello there',
        platform: 'instagram',
        mediaType: 'image',
        hashtags: [],
        followerCount: 1000,
        scheduledTime: new Date(),
      }}
    />,
  );

  // Wait for effect to finish
  await waitFor(() => expect(predictMock).toHaveBeenCalled());

  // On error the component does not show a score and falls back to the prompt
  expect(screen.getByText(/Enter post content to see reach prediction/i)).toBeInTheDocument();
});
