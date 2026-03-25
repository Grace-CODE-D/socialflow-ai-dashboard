/**
 * Example usage of Predictive Reach Analysis
 */

import { predictiveService } from '../src/services/PredictiveService';
import { PostAnalysisInput } from '../src/types/predictive';

// Example 1: Basic reach prediction
async function basicPrediction() {
  console.log('=== Basic Reach Prediction ===\n');

  const post: PostAnalysisInput = {
    content: 'Excited to announce our new product launch! 🚀 Check it out! #innovation #tech #startup',
    platform: 'instagram',
    hashtags: ['innovation', 'tech', 'startup'],
    mediaType: 'image',
    followerCount: 450000,
  };

  const prediction = await predictiveService.predictReach(post);

  console.log(`Reach Score: ${prediction.reachScore}/100`);
  console.log(`Expected Reach: ${prediction.estimatedReach.expected.toLocaleString()}`);
  console.log(`Range: ${prediction.estimatedReach.min.toLocaleString()} - ${prediction.estimatedReach.max.toLocaleString()}`);
  console.log(`Confidence: ${Math.round(prediction.confidence * 100)}%`);
  console.log(`\nTop Factors:`);
  prediction.factors.slice(0, 3).forEach(factor => {
    console.log(`  ${factor.impact === 'positive' ? '✓' : '✗'} ${factor.name}: ${factor.description}`);
  });
  console.log(`\nRecommendations:`);
  prediction.recommendations.forEach((rec, i) => {
    console.log(`  ${i + 1}. ${rec}`);
  });
  console.log('\n');
}

// Example 2: Compare two posts
async function comparePostVersions() {
  console.log('=== A/B Testing: Compare Two Posts ===\n');

  const versionA: PostAnalysisInput = {
    content: 'New product available now',
    platform: 'instagram',
  };

  const versionB: PostAnalysisInput = {
    content: 'Exciting news! 🎉 Our new product is here! Check it out and share your thoughts! #newproduct #innovation #tech',
    platform: 'instagram',
    hashtags: ['newproduct', 'innovation', 'tech'],
    mediaType: 'video',
    followerCount: 450000,
  };

  const comparison = await predictiveService.comparePosts(versionA, versionB);

  console.log(`Version A Score: ${comparison.postA.reachScore}/100`);
  console.log(`Version B Score: ${comparison.postB.reachScore}/100`);
  console.log(`\nWinner: Version ${comparison.winner}`);
  console.log(`\nVersion B improvements:`);
  comparison.postB.recommendations.forEach((rec, i) => {
    console.log(`  ${i + 1}. ${rec}`);
  });
  console.log('\n');
}

// Example 3: Batch prediction for scheduled posts
async function batchPrediction() {
  console.log('=== Batch Prediction for Scheduled Posts ===\n');

  const scheduledPosts: PostAnalysisInput[] = [
    {
      content: 'Monday motivation! 💪 Start your week strong! #motivation #monday',
      platform: 'linkedin',
      scheduledTime: new Date('2024-03-25T08:00:00'),
      hashtags: ['motivation', 'monday'],
      mediaType: 'image',
    },
    {
      content: 'Behind the scenes of our latest project 🎬 #BTS #creative',
      platform: 'tiktok',
      scheduledTime: new Date('2024-03-25T18:00:00'),
      hashtags: ['BTS', 'creative'],
      mediaType: 'video',
    },
    {
      content: 'Weekend vibes! What are your plans? 🌴 #weekend #lifestyle',
      platform: 'instagram',
      scheduledTime: new Date('2024-03-30T11:00:00'),
      hashtags: ['weekend', 'lifestyle'],
      mediaType: 'carousel',
    },
  ];

  const predictions = await predictiveService.batchPredict(scheduledPosts);

  predictions.forEach((pred, index) => {
    const post = scheduledPosts[index];
    console.log(`Post ${index + 1} (${post.platform}):`);
    console.log(`  Score: ${pred.reachScore}/100`);
    console.log(`  Expected Reach: ${pred.estimatedReach.expected.toLocaleString()}`);
    console.log(`  Scheduled: ${post.scheduledTime?.toLocaleString()}`);
    console.log(`  Top Recommendation: ${pred.recommendations[0] || 'None'}`);
    console.log('');
  });

  const avgScore = predictions.reduce((sum, p) => sum + p.reachScore, 0) / predictions.length;
  console.log(`Average Reach Score: ${Math.round(avgScore)}/100\n`);
}

// Example 4: Optimal timing analysis
async function optimalTimingAnalysis() {
  console.log('=== Optimal Posting Times ===\n');

  const platforms = ['instagram', 'tiktok', 'linkedin', 'x'];

  platforms.forEach(platform => {
    const optimalTime = predictiveService.findOptimalPostTime(platform);
    console.log(`${platform.charAt(0).toUpperCase() + platform.slice(1)}:`);
    console.log(`  Next optimal time: ${optimalTime.toLocaleString()}`);
    console.log('');
  });
}

// Example 5: Learning from actual performance
function updateWithActualPerformance() {
  console.log('=== Update Model with Actual Performance ===\n');

  // After a post is published, feed back the actual results
  predictiveService.updateHistoricalData(
    'instagram',
    75000,  // actual reach
    6.8,    // engagement rate
    'image',
    ['tech', 'innovation', 'startup']
  );

  console.log('✓ Historical data updated');
  console.log('Model will use this data for future predictions\n');
}

// Example 6: Get model metrics
function checkModelMetrics() {
  console.log('=== Model Metrics ===\n');

  const metrics = predictiveService.getModelMetrics();

  console.log(`Accuracy: ${Math.round(metrics.accuracy * 100)}%`);
  console.log(`Training Samples: ${metrics.sampleSize.toLocaleString()}`);
  console.log(`Version: ${metrics.version}`);
  console.log(`Last Trained: ${metrics.lastTrainedAt.toLocaleDateString()}`);
  console.log('\n');
}

// Run all examples
async function runAllExamples() {
  try {
    await basicPrediction();
    await comparePostVersions();
    await batchPrediction();
    await optimalTimingAnalysis();
    updateWithActualPerformance();
    checkModelMetrics();
    
    console.log('✅ All examples completed successfully!');
  } catch (error) {
    console.error('Error running examples:', error);
  }
}

// Run if executed directly
if (require.main === module) {
  runAllExamples();
}

export {
  basicPrediction,
  comparePostVersions,
  batchPrediction,
  optimalTimingAnalysis,
  updateWithActualPerformance,
  checkModelMetrics,
};
