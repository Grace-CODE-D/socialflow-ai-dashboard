import { predictiveService } from '../PredictiveService';
import { PostAnalysisInput } from '../../types/predictive';

describe('PredictiveService', () => {
  describe('predictReach', () => {
    it('should predict reach for a basic post', async () => {
      const input: PostAnalysisInput = {
        content: 'Test post content',
        platform: 'instagram',
      };

      const prediction = await predictiveService.predictReach(input);

      expect(prediction).toBeDefined();
      expect(prediction.reachScore).toBeGreaterThanOrEqual(0);
      expect(prediction.reachScore).toBeLessThanOrEqual(100);
      expect(prediction.estimatedReach).toBeDefined();
      expect(prediction.confidence).toBeGreaterThan(0);
      expect(prediction.confidence).toBeLessThanOrEqual(1);
    });

    it('should give higher score for optimized content', async () => {
      const basicPost: PostAnalysisInput = {
        content: 'Test',
        platform: 'instagram',
      };

      const optimizedPost: PostAnalysisInput = {
        content: 'Amazing new product launch! 🚀 Check it out and let us know what you think! #innovation #tech #startup',
        platform: 'instagram',
        hashtags: ['innovation', 'tech', 'startup'],
        mediaType: 'image',
        followerCount: 450000,
      };

      const basicPrediction = await predictiveService.predictReach(basicPost);
      const optimizedPrediction = await predictiveService.predictReach(optimizedPost);

      expect(optimizedPrediction.reachScore).toBeGreaterThan(basicPrediction.reachScore);
    });

    it('should provide recommendations for improvement', async () => {
      const input: PostAnalysisInput = {
        content: 'Short post',
        platform: 'instagram',
      };

      const prediction = await predictiveService.predictReach(input);

      expect(prediction.recommendations).toBeDefined();
      expect(Array.isArray(prediction.recommendations)).toBe(true);
      expect(prediction.recommendations.length).toBeGreaterThan(0);
    });

    it('should calculate estimated reach based on follower count', async () => {
      const input: PostAnalysisInput = {
        content: 'Test post with good content and hashtags #test #social',
        platform: 'instagram',
        hashtags: ['test', 'social'],
        followerCount: 100000,
      };

      const prediction = await predictiveService.predictReach(input);

      expect(prediction.estimatedReach.expected).toBeGreaterThan(0);
      expect(prediction.estimatedReach.min).toBeLessThan(prediction.estimatedReach.expected);
      expect(prediction.estimatedReach.max).toBeGreaterThan(prediction.estimatedReach.expected);
    });

    it('should suggest optimal posting time', async () => {
      const input: PostAnalysisInput = {
        content: 'Test post',
        platform: 'instagram',
      };

      const prediction = await predictiveService.predictReach(input);

      expect(prediction.optimalPostTime).toBeDefined();
      expect(prediction.optimalPostTime).toBeInstanceOf(Date);
    });
  });

  describe('batchPredict', () => {
    it('should predict reach for multiple posts', async () => {
      const inputs: PostAnalysisInput[] = [
        { content: 'Post 1', platform: 'instagram' },
        { content: 'Post 2', platform: 'tiktok' },
        { content: 'Post 3', platform: 'linkedin' },
      ];

      const predictions = await predictiveService.batchPredict(inputs);

      expect(predictions).toHaveLength(3);
      predictions.forEach(pred => {
        expect(pred.reachScore).toBeGreaterThanOrEqual(0);
        expect(pred.reachScore).toBeLessThanOrEqual(100);
      });
    });
  });

  describe('comparePosts', () => {
    it('should compare two posts and determine winner', async () => {
      const postA: PostAnalysisInput = {
        content: 'Basic post',
        platform: 'instagram',
      };

      const postB: PostAnalysisInput = {
        content: 'Optimized post with great content! 🚀 #trending #viral',
        platform: 'instagram',
        hashtags: ['trending', 'viral'],
        mediaType: 'video',
      };

      const comparison = await predictiveService.comparePosts(postA, postB);

      expect(comparison.postA).toBeDefined();
      expect(comparison.postB).toBeDefined();
      expect(comparison.winner).toMatch(/^(A|B|tie)$/);
      expect(comparison.postB.reachScore).toBeGreaterThan(comparison.postA.reachScore);
    });
  });

  describe('getModelMetrics', () => {
    it('should return model metrics', () => {
      const metrics = predictiveService.getModelMetrics();

      expect(metrics.accuracy).toBeGreaterThan(0);
      expect(metrics.accuracy).toBeLessThanOrEqual(1);
      expect(metrics.version).toBeDefined();
      expect(metrics.sampleSize).toBeGreaterThan(0);
      expect(metrics.lastTrainedAt).toBeInstanceOf(Date);
    });
  });

  describe('updateHistoricalData', () => {
    it('should update historical performance data', () => {
      const initialMetrics = predictiveService.getModelMetrics();
      
      predictiveService.updateHistoricalData(
        'instagram',
        75000,
        6.5,
        'image',
        ['tech', 'innovation']
      );

      // Verify data was updated (metrics should remain consistent)
      const updatedMetrics = predictiveService.getModelMetrics();
      expect(updatedMetrics.version).toBe(initialMetrics.version);
    });
  });
});
