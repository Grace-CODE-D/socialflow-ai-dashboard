import React, { useState, useEffect } from 'react';
import { predictiveService } from '../../services/PredictiveService';
import { PostAnalysisInput, ReachPrediction } from '../../types/predictive';

const MaterialIcon = ({ name, className }: { name: string; className?: string }) => (
  <span className={`material-symbols-outlined ${className}`}>{name}</span>
);

interface ScheduledPostWithPrediction {
  id: string;
  content: string;
  platform: string;
  scheduledTime: Date;
  prediction: ReachPrediction;
}

export const PredictiveReachDashboard: React.FC = () => {
  const [predictions, setPredictions] = useState<ScheduledPostWithPrediction[]>([]);
  const [loading, setLoading] = useState(true);
  const [modelMetrics, setModelMetrics] = useState(predictiveService.getModelMetrics());

  useEffect(() => {
    loadPredictions();
  }, []);

  const loadPredictions = async () => {
    setLoading(true);
    try {
      // Mock scheduled posts - in production, fetch from backend
      const scheduledPosts: PostAnalysisInput[] = [
        {
          content: 'Excited to announce our new product launch! 🚀 Check it out #innovation #tech #startup',
          platform: 'instagram',
          scheduledTime: new Date(Date.now() + 3600000),
          hashtags: ['innovation', 'tech', 'startup'],
          mediaType: 'image',
          followerCount: 450000,
        },
        {
          content: 'Behind the scenes of our latest campaign. Link in bio! #BTS #marketing',
          platform: 'tiktok',
          scheduledTime: new Date(Date.now() + 7200000),
          hashtags: ['BTS', 'marketing'],
          mediaType: 'video',
          followerCount: 280000,
        },
        {
          content: 'Industry insights: The future of social media marketing',
          platform: 'linkedin',
          scheduledTime: new Date(Date.now() + 10800000),
          hashtags: [],
          mediaType: 'text',
          followerCount: 10000,
        },
      ];

      const results = await predictiveService.batchPredict(scheduledPosts);
      
      const postsWithPredictions = scheduledPosts.map((post, index) => ({
        id: `post-${index}`,
        content: post.content,
        platform: post.platform,
        scheduledTime: post.scheduledTime!,
        prediction: results[index],
      }));

      setPredictions(postsWithPredictions);
    } catch (error) {
      console.error('Failed to load predictions:', error);
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number): string => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-blue-500';
    if (score >= 40) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getScoreTextColor = (score: number): string => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-blue-400';
    if (score >= 40) return 'text-yellow-400';
    return 'text-red-400';
  };

  if (loading) {
    return (
      <div className="bg-dark-surface rounded-xl p-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-blue"></div>
          <span className="ml-3 text-gray-subtext">Loading predictions...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Model Metrics */}
      <div className="bg-dark-surface rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <MaterialIcon name="psychology" className="text-primary-blue text-3xl" />
            <div>
              <h2 className="text-xl font-bold text-white">Predictive Reach Analysis</h2>
              <p className="text-sm text-gray-subtext">ML-powered reach predictions for your posts</p>
            </div>
          </div>
          <button
            onClick={loadPredictions}
            className="flex items-center gap-2 px-4 py-2 bg-dark-bg rounded-lg text-sm text-white hover:bg-dark-border transition-colors"
          >
            <MaterialIcon name="refresh" className="text-base" />
            Refresh
          </button>
        </div>

        {/* Model Metrics */}
        <div className="grid grid-cols-4 gap-4 mt-6">
          <div className="bg-dark-bg rounded-lg p-4 text-center">
            <MaterialIcon name="model_training" className="text-primary-blue text-2xl mb-2" />
            <p className="text-2xl font-bold text-white">{Math.round(modelMetrics.accuracy * 100)}%</p>
            <p className="text-xs text-gray-subtext mt-1">Model Accuracy</p>
          </div>
          <div className="bg-dark-bg rounded-lg p-4 text-center">
            <MaterialIcon name="dataset" className="text-primary-teal text-2xl mb-2" />
            <p className="text-2xl font-bold text-white">{modelMetrics.sampleSize.toLocaleString()}</p>
            <p className="text-xs text-gray-subtext mt-1">Training Samples</p>
          </div>
          <div className="bg-dark-bg rounded-lg p-4 text-center">
            <MaterialIcon name="schedule" className="text-purple-400 text-2xl mb-2" />
            <p className="text-2xl font-bold text-white">{predictions.length}</p>
            <p className="text-xs text-gray-subtext mt-1">Scheduled Posts</p>
          </div>
          <div className="bg-dark-bg rounded-lg p-4 text-center">
            <MaterialIcon name="update" className="text-yellow-400 text-2xl mb-2" />
            <p className="text-sm font-bold text-white">v{modelMetrics.version}</p>
            <p className="text-xs text-gray-subtext mt-1">Model Version</p>
          </div>
        </div>
      </div>

      {/* Scheduled Posts with Predictions */}
      <div className="bg-dark-surface rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Scheduled Posts Analysis</h3>
        
        {predictions.length === 0 ? (
          <div className="text-center py-12">
            <MaterialIcon name="event_busy" className="text-gray-600 text-5xl mb-3" />
            <p className="text-gray-subtext">No scheduled posts to analyze</p>
          </div>
        ) : (
          <div className="space-y-4">
            {predictions.map((post) => (
              <div key={post.id} className="bg-dark-bg rounded-lg p-5 hover:bg-dark-border/50 transition-all">
                <div className="flex items-start gap-4">
                  {/* Reach Score Badge */}
                  <div className="flex-shrink-0">
                    <div className="relative w-16 h-16">
                      <svg className="w-16 h-16 transform -rotate-90">
                        <circle
                          cx="32"
                          cy="32"
                          r="28"
                          stroke="currentColor"
                          strokeWidth="4"
                          fill="none"
                          className="text-dark-surface"
                        />
                        <circle
                          cx="32"
                          cy="32"
                          r="28"
                          stroke="currentColor"
                          strokeWidth="4"
                          fill="none"
                          strokeDasharray={`${(post.prediction.reachScore / 100) * 175.93} 175.93`}
                          className={getScoreColor(post.prediction.reachScore)}
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className={`text-lg font-bold ${getScoreTextColor(post.prediction.reachScore)}`}>
                          {Math.round(post.prediction.reachScore)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Post Details */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-semibold text-primary-blue capitalize">
                        {post.platform}
                      </span>
                      <span className="text-xs text-gray-subtext">
                        {post.scheduledTime.toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <p className="text-sm text-white mb-3 line-clamp-2">{post.content}</p>
                    
                    {/* Estimated Reach */}
                    <div className="flex items-center gap-4 text-xs">
                      <div>
                        <span className="text-gray-subtext">Expected Reach: </span>
                        <span className="text-white font-semibold">
                          {(post.prediction.estimatedReach.expected / 1000).toFixed(1)}k
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-subtext">Range: </span>
                        <span className="text-white">
                          {(post.prediction.estimatedReach.min / 1000).toFixed(1)}k - {(post.prediction.estimatedReach.max / 1000).toFixed(1)}k
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-subtext">Confidence: </span>
                        <span className="text-white">{Math.round(post.prediction.confidence * 100)}%</span>
                      </div>
                    </div>

                    {/* Top Recommendations */}
                    {post.prediction.recommendations.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-dark-border">
                        <p className="text-xs text-gray-subtext mb-2">Top Recommendation:</p>
                        <p className="text-xs text-primary-teal">
                          💡 {post.prediction.recommendations[0]}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2">
                    <button className="p-2 bg-dark-surface rounded-lg hover:bg-primary-blue/20 transition-colors">
                      <MaterialIcon name="edit" className="text-primary-blue text-base" />
                    </button>
                    <button className="p-2 bg-dark-surface rounded-lg hover:bg-red-500/20 transition-colors">
                      <MaterialIcon name="delete" className="text-red-400 text-base" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Performance Insights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-dark-surface rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <MaterialIcon name="trending_up" className="text-green-400 text-2xl" />
            <div>
              <h3 className="text-sm font-medium text-white">Avg Predicted Reach</h3>
              <p className="text-xs text-gray-subtext">Across all scheduled posts</p>
            </div>
          </div>
          <p className="text-3xl font-bold text-white">
            {predictions.length > 0
              ? (predictions.reduce((sum, p) => sum + p.prediction.estimatedReach.expected, 0) / predictions.length / 1000).toFixed(1)
              : '0'}k
          </p>
        </div>

        <div className="bg-dark-surface rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <MaterialIcon name="star" className="text-yellow-400 text-2xl" />
            <div>
              <h3 className="text-sm font-medium text-white">Best Performing</h3>
              <p className="text-xs text-gray-subtext">Highest reach score</p>
            </div>
          </div>
          <p className="text-3xl font-bold text-white">
            {predictions.length > 0
              ? Math.round(Math.max(...predictions.map(p => p.prediction.reachScore)))
              : '0'}
          </p>
        </div>

        <div className="bg-dark-surface rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <MaterialIcon name="insights" className="text-primary-blue text-2xl" />
            <div>
              <h3 className="text-sm font-medium text-white">Avg Confidence</h3>
              <p className="text-xs text-gray-subtext">Prediction reliability</p>
            </div>
          </div>
          <p className="text-3xl font-bold text-white">
            {predictions.length > 0
              ? Math.round((predictions.reduce((sum, p) => sum + p.prediction.confidence, 0) / predictions.length) * 100)
              : '0'}%
          </p>
        </div>
      </div>
    </div>
  );
};
