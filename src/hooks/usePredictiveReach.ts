import { useState, useEffect, useCallback } from 'react';
import { predictiveService } from '../services/PredictiveService';
import { PostAnalysisInput, ReachPrediction } from '../types/predictive';

interface UsePredictiveReachOptions {
  autoAnalyze?: boolean;
  debounceMs?: number;
}

export function usePredictiveReach(
  postData: PostAnalysisInput,
  options: UsePredictiveReachOptions = {}
) {
  const { autoAnalyze = true, debounceMs = 500 } = options;
  
  const [prediction, setPrediction] = useState<ReachPrediction | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyze = useCallback(async () => {
    if (!postData.content || postData.content.length < 3) {
      setPrediction(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await predictiveService.predictReach(postData);
      setPrediction(result);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to analyze reach';
      setError(errorMessage);
      console.error('Reach prediction error:', err);
    } finally {
      setLoading(false);
    }
  }, [postData]);

  useEffect(() => {
    if (!autoAnalyze) return;

    const timer = setTimeout(() => {
      analyze();
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [postData.content, postData.platform, postData.scheduledTime, autoAnalyze, debounceMs, analyze]);

  const refresh = useCallback(() => {
    analyze();
  }, [analyze]);

  return {
    prediction,
    loading,
    error,
    analyze: refresh,
  };
}
