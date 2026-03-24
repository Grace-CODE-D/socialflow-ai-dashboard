export interface PostAnalysisInput {
  content: string;
  platform: 'instagram' | 'tiktok' | 'facebook' | 'youtube' | 'linkedin' | 'x';
  scheduledTime?: Date;
  hashtags?: string[];
  mentions?: string[];
  mediaType?: 'text' | 'image' | 'video' | 'carousel';
  followerCount?: number;
}

export interface ReachPrediction {
  reachScore: number; // 0-100 score
  estimatedReach: {
    min: number;
    max: number;
    expected: number;
  };
  confidence: number; // 0-1 confidence level
  factors: ReachFactor[];
  recommendations: string[];
  optimalPostTime?: Date;
  competitorBenchmark?: number;
}

export interface ReachFactor {
  name: string;
  impact: 'positive' | 'negative' | 'neutral';
  weight: number; // 0-1
  description: string;
}

export interface HistoricalPerformance {
  platform: string;
  avgReach: number;
  avgEngagement: number;
  bestPostingTimes: number[]; // Hours of day (0-23)
  topHashtags: string[];
  contentTypePerformance: Record<string, number>;
}

export interface TrendAnalysis {
  trending: boolean;
  trendScore: number; // 0-100
  relatedTopics: string[];
  seasonality: 'high' | 'medium' | 'low';
}

export interface MLModelMetrics {
  accuracy: number;
  lastTrainedAt: Date;
  sampleSize: number;
  version: string;
}
