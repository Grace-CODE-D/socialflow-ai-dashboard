export type SupportedHashtagPlatform =
  | 'instagram'
  | 'tiktok'
  | 'linkedin'
  | 'x'
  | 'youtube'
  | 'facebook'
  | 'generic';

export interface PlatformTrendSignal {
  tag: string;
  weight: number;
  keywords: string[];
}

export interface HashtagGeneratorOptions {
  text: string;
  platform?: string;
  maxTags?: number;
  trendSignals?: PlatformTrendSignal[];
}

export interface HashtagGeneratorResult {
  platform: SupportedHashtagPlatform;
  hashtags: string[];
  keywords: string[];
  trendMatches: string[];
}

const STOP_WORDS = new Set([
  'a',
  'an',
  'and',
  'are',
  'as',
  'at',
  'be',
  'by',
  'for',
  'from',
  'how',
  'in',
  'into',
  'is',
  'it',
  'of',
  'on',
  'or',
  'our',
  'that',
  'the',
  'this',
  'to',
  'we',
  'with',
  'you',
  'your',
]);

export const DEFAULT_PLATFORM_TRENDS: Record<SupportedHashtagPlatform, PlatformTrendSignal[]> = {
  instagram: [
    { tag: 'ContentCreator', weight: 1.3, keywords: ['creator', 'content', 'brand', 'campaign'] },
    { tag: 'SocialMediaTips', weight: 1.15, keywords: ['social', 'tips', 'growth', 'marketing'] },
    { tag: 'ReelsStrategy', weight: 1.2, keywords: ['video', 'reel', 'short', 'story'] },
    { tag: 'BrandStory', weight: 1.05, keywords: ['story', 'brand', 'launch', 'community'] },
  ],
  tiktok: [
    { tag: 'TikTokGrowth', weight: 1.25, keywords: ['viral', 'growth', 'trend', 'audience'] },
    { tag: 'ForYouStrategy', weight: 1.2, keywords: ['discover', 'reach', 'viral', 'trend'] },
    { tag: 'ShortFormVideo', weight: 1.15, keywords: ['video', 'clip', 'hook', 'short'] },
    { tag: 'CreatorEconomy', weight: 1.05, keywords: ['creator', 'content', 'monetize', 'audience'] },
  ],
  linkedin: [
    { tag: 'B2BMarketing', weight: 1.2, keywords: ['b2b', 'brand', 'marketing', 'pipeline'] },
    { tag: 'ThoughtLeadership', weight: 1.25, keywords: ['insight', 'leadership', 'strategy', 'industry'] },
    { tag: 'GrowthStrategy', weight: 1.1, keywords: ['growth', 'strategy', 'revenue', 'scale'] },
    { tag: 'PersonalBrand', weight: 1.05, keywords: ['brand', 'founder', 'career', 'leadership'] },
  ],
  x: [
    { tag: 'MarketingTwitter', weight: 1.2, keywords: ['marketing', 'thread', 'growth', 'social'] },
    { tag: 'BuildInPublic', weight: 1.15, keywords: ['launch', 'build', 'product', 'community'] },
    { tag: 'CreatorStrategy', weight: 1.1, keywords: ['creator', 'audience', 'engagement', 'content'] },
    { tag: 'TrendWatch', weight: 1.05, keywords: ['trend', 'news', 'timely', 'conversation'] },
  ],
  youtube: [
    { tag: 'YouTubeGrowth', weight: 1.2, keywords: ['channel', 'video', 'audience', 'growth'] },
    { tag: 'VideoMarketing', weight: 1.15, keywords: ['video', 'marketing', 'reach', 'content'] },
    { tag: 'CreatorTools', weight: 1.05, keywords: ['creator', 'editing', 'workflow', 'production'] },
    { tag: 'AudienceRetention', weight: 1.1, keywords: ['hook', 'watch', 'audience', 'retention'] },
  ],
  facebook: [
    { tag: 'CommunityGrowth', weight: 1.15, keywords: ['community', 'audience', 'group', 'engagement'] },
    { tag: 'SocialCampaign', weight: 1.1, keywords: ['campaign', 'social', 'reach', 'brand'] },
    { tag: 'DigitalMarketing', weight: 1.05, keywords: ['digital', 'marketing', 'strategy', 'content'] },
    { tag: 'AudienceEngagement', weight: 1.1, keywords: ['engagement', 'comments', 'reach', 'social'] },
  ],
  generic: [
    { tag: 'SocialMedia', weight: 1.1, keywords: ['social', 'content', 'marketing', 'brand'] },
    { tag: 'ContentStrategy', weight: 1.1, keywords: ['content', 'strategy', 'audience', 'growth'] },
    { tag: 'AudienceGrowth', weight: 1.05, keywords: ['audience', 'reach', 'growth', 'engagement'] },
    { tag: 'DigitalMarketing', weight: 1.05, keywords: ['digital', 'marketing', 'campaign', 'brand'] },
  ],
};

export const normalizeHashtagPlatform = (platform?: string): SupportedHashtagPlatform => {
  const normalized = (platform ?? 'generic').trim().toLowerCase();

  if (normalized === 'twitter') {
    return 'x';
  }

  if (normalized in DEFAULT_PLATFORM_TRENDS) {
    return normalized as SupportedHashtagPlatform;
  }

  return 'generic';
};

export const extractHashtagKeywords = (text: string): string[] => {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .map((word) => word.trim())
    .filter((word) => word.length >= 3 && !STOP_WORDS.has(word));
};

const toHashtag = (value: string): string => {
  const compact = value
    .split(/[^a-zA-Z0-9]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join('');

  return compact ? `#${compact}` : '';
};

const getKeywordScores = (keywords: string[]): Map<string, number> => {
  const scores = new Map<string, number>();

  keywords.forEach((keyword, index) => {
    scores.set(keyword, (scores.get(keyword) ?? 0) + 1 + (index < 8 ? 0.35 : 0));
  });

  for (let index = 0; index < keywords.length - 1; index += 1) {
    const phrase = `${keywords[index]} ${keywords[index + 1]}`;
    scores.set(phrase, (scores.get(phrase) ?? 0) + 1.4);
  }

  return scores;
};

export const generateHashtags = (options: HashtagGeneratorOptions): HashtagGeneratorResult => {
  const platform = normalizeHashtagPlatform(options.platform);
  const maxTags = Math.min(Math.max(options.maxTags ?? 10, 1), 20);
  const keywords = extractHashtagKeywords(options.text);
  const trendSignals = options.trendSignals ?? DEFAULT_PLATFORM_TRENDS[platform];
  const keywordScores = getKeywordScores(keywords);

  const rankedTerms = Array.from(keywordScores.entries()).map(([term, score]) => {
    const trendBoost = trendSignals.reduce((total, signal) => {
      const matches = signal.keywords.some((keyword) => term.includes(keyword) || keyword.includes(term));
      return matches ? total + signal.weight : total;
    }, 0);

    return {
      term,
      score: score + trendBoost,
    };
  });

  const matchedTrends = trendSignals.filter((signal) =>
    signal.keywords.some((keyword) => keywords.includes(keyword)),
  );

  const hashtags = Array.from(
    new Set([
      ...matchedTrends.map((signal) => `#${signal.tag}`),
      ...rankedTerms.sort((left, right) => right.score - left.score).map((entry) => toHashtag(entry.term)),
      ...(platform === 'generic' ? [] : [toHashtag(platform)]),
    ]),
  )
    .filter(Boolean)
    .slice(0, maxTags);

  return {
    platform,
    hashtags,
    keywords: Array.from(new Set(keywords)).slice(0, 12),
    trendMatches: matchedTrends.map((signal) => signal.tag),
  };
};