// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { usePredictiveReach } from './usePredictiveReach';
import { predictiveService } from '../services/PredictiveService';
import { PostAnalysisInput, ReachPrediction } from '../types/predictive';

vi.mock('../services/PredictiveService', () => ({
  predictiveService: {
    predictReach: vi.fn(),
  },
}));

const mockPredictReach = predictiveService.predictReach as ReturnType<typeof vi.fn>;

const buildPostData = (overrides: Partial<PostAnalysisInput> = {}): PostAnalysisInput => ({
  content: 'hello world',
  platform: 'instagram',
  ...overrides,
});

const prediction: ReachPrediction = {
  reachScore: 80,
  estimatedReach: { min: 100, max: 200, expected: 150 },
  confidence: 0.9,
  factors: [],
  recommendations: [],
};

describe('usePredictiveReach', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mockPredictReach.mockReset();
    mockPredictReach.mockResolvedValue(prediction);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('does not call predictReach before the debounce delay elapses', () => {
    renderHook(() => usePredictiveReach(buildPostData(), { debounceMs: 500 }));

    act(() => {
      vi.advanceTimersByTime(499);
    });

    expect(mockPredictReach).not.toHaveBeenCalled();
  });

  it('calls predictReach after the debounce delay elapses', async () => {
    renderHook(() => usePredictiveReach(buildPostData(), { debounceMs: 500 }));

    await act(async () => {
      vi.advanceTimersByTime(500);
    });

    expect(mockPredictReach).toHaveBeenCalledTimes(1);
  });

  it('resets the debounce timer when postData.content changes', () => {
    const { rerender } = renderHook(
      ({ postData }) => usePredictiveReach(postData, { debounceMs: 500 }),
      { initialProps: { postData: buildPostData({ content: 'first' }) } },
    );

    act(() => {
      vi.advanceTimersByTime(300);
    });

    rerender({ postData: buildPostData({ content: 'first updated' }) });

    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(mockPredictReach).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(200);
    });

    expect(mockPredictReach).toHaveBeenCalledTimes(1);
  });

  it('clears the pending timeout on unmount', () => {
    const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout');

    const { unmount } = renderHook(() => usePredictiveReach(buildPostData(), { debounceMs: 500 }));

    unmount();

    expect(clearTimeoutSpy).toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(mockPredictReach).not.toHaveBeenCalled();
  });
});
