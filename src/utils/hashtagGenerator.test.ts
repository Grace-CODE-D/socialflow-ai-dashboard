import {
  generateHashtags,
  extractHashtagKeywords,
  normalizeHashtagPlatform,
  DEFAULT_PLATFORM_TRENDS,
} from './hashtagGenerator';

describe('normalizeHashtagPlatform', () => {
  it('defaults to generic when no platform is given', () => {
    expect(normalizeHashtagPlatform(undefined)).toBe('generic');
  });

  it('maps twitter to x', () => {
    expect(normalizeHashtagPlatform('twitter')).toBe('x');
  });

  it('is case-insensitive and trims whitespace', () => {
    expect(normalizeHashtagPlatform('  Instagram ')).toBe('instagram');
  });

  it('falls back to generic for unsupported platforms', () => {
    expect(normalizeHashtagPlatform('myspace')).toBe('generic');
  });
});

describe('extractHashtagKeywords', () => {
  it('lowercases, strips punctuation, and removes stop words', () => {
    const keywords = extractHashtagKeywords('The Creator Economy is Booming, and it is Fun!');
    expect(keywords).toEqual(['creator', 'economy', 'booming', 'and', 'fun']);
  });

  it('filters out words shorter than 3 characters', () => {
    const keywords = extractHashtagKeywords('go to a big ai fair');
    expect(keywords).not.toContain('go');
    expect(keywords).not.toContain('ai');
  });
});

describe('generateHashtags', () => {
  it('generates hashtags for the default generic platform', () => {
    const result = generateHashtags({ text: 'Growing our audience with a new content strategy' });

    expect(result.platform).toBe('generic');
    expect(result.hashtags.length).toBeGreaterThan(0);
    result.hashtags.forEach((tag) => expect(tag.startsWith('#')).toBe(true));
  });

  it('respects the maxTags option and clamps to the 1-20 range', () => {
    const result = generateHashtags({ text: 'social media marketing content creator growth strategy', maxTags: 3 });
    expect(result.hashtags.length).toBeLessThanOrEqual(3);

    const clampedHigh = generateHashtags({ text: 'content', maxTags: 50 });
    expect(clampedHigh.hashtags.length).toBeLessThanOrEqual(20);

    const clampedLow = generateHashtags({ text: 'content', maxTags: 0 });
    expect(clampedLow.hashtags.length).toBeLessThanOrEqual(1);
  });

  it('appends the platform hashtag for non-generic platforms', () => {
    const result = generateHashtags({ text: 'launching a new product today', platform: 'tiktok' });
    expect(result.platform).toBe('tiktok');
    expect(result.hashtags.some((tag) => tag.toLowerCase() === '#tiktok')).toBe(true);
  });

  it('does not append a platform hashtag for the generic platform', () => {
    const result = generateHashtags({ text: 'launching a new product today', platform: 'generic' });
    expect(result.hashtags.some((tag) => tag.toLowerCase() === '#generic')).toBe(false);
  });

  it('surfaces matched trend tags when keywords align with trend signals', () => {
    const result = generateHashtags({
      text: 'our brand campaign for content creators is live',
      platform: 'instagram',
    });

    expect(result.trendMatches.length).toBeGreaterThan(0);
    expect(result.trendMatches).toContain('ContentCreator');
  });

  it('uses custom trend signals when provided instead of the platform defaults', () => {
    const customSignal = { tag: 'CustomTrend', weight: 5, keywords: ['widget'] };
    const result = generateHashtags({
      text: 'our new widget launch',
      platform: 'generic',
      trendSignals: [customSignal],
    });

    expect(result.trendMatches).toContain('CustomTrend');
    expect(result.hashtags).toContain('#CustomTrend');
  });

  it('returns unique, deduplicated keywords capped at 12', () => {
    const longText = Array.from({ length: 20 }, (_, i) => `keyword${i}`).join(' ');
    const result = generateHashtags({ text: longText });
    expect(result.keywords.length).toBeLessThanOrEqual(12);
    expect(new Set(result.keywords).size).toBe(result.keywords.length);
  });

  it('covers every default platform trend table', () => {
    Object.keys(DEFAULT_PLATFORM_TRENDS).forEach((platform) => {
      const result = generateHashtags({ text: 'general update about our work', platform });
      expect(result.platform).toBe(platform);
    });
  });
});
