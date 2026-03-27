import { createLogger } from '../lib/logger';

const logger = createLogger('moderation-service');

export type SensitivityLevel = 'low' | 'medium' | 'high';

export interface ModerationResult {
  flagged: boolean;
  blocked: boolean;
  categories: Record<string, boolean>;
  scores: Record<string, number>;
  reason?: string;
}

/**
 * Thresholds per sensitivity level.
 * A category score above the threshold triggers a flag/block.
 *
 * low    — only block clearly harmful content (high threshold)
 * medium — balanced (default)
 * high   — strict; flag borderline content
 */
const THRESHOLDS: Record<SensitivityLevel, number> = {
  low: 0.85,
  medium: 0.6,
  high: 0.3,
};

/**
 * Categories that always result in a hard block regardless of sensitivity.
 */
const ALWAYS_BLOCK = new Set([
  'sexual/minors',
  'hate/threatening',
  'violence/graphic',
  'self-harm/instructions',
]);

function getSensitivity(): SensitivityLevel {
  const val = (process.env.MODERATION_SENSITIVITY ?? 'medium').toLowerCase();
  if (val === 'low' || val === 'high') return val;
  return 'medium';
}

export const ModerationService = {
  isConfigured(): boolean {
    return !!process.env.OPENAI_API_KEY;
  },

  /**
   * Moderate content using the OpenAI Moderation API.
   * Returns a safe pass-through result if the API is not configured.
   */
  async moderate(text: string): Promise<ModerationResult> {
    if (!this.isConfigured()) {
      logger.warn('ModerationService: OPENAI_API_KEY not set — skipping moderation');
      return { flagged: false, blocked: false, categories: {}, scores: {} };
    }

    const response = await fetch('https://api.openai.com/v1/moderations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({ input: text }),
    });

    if (!response.ok) {
      const body = await response.text();
      logger.error('OpenAI Moderation API error', { status: response.status, body });
      throw new Error(`Moderation API returned ${response.status}`);
    }

    const data = (await response.json()) as {
      results: Array<{
        flagged: boolean;
        categories: Record<string, boolean>;
        category_scores: Record<string, number>;
      }>;
    };

    const result = data.results[0];
    const sensitivity = getSensitivity();
    const threshold = THRESHOLDS[sensitivity];

    // Hard block on always-blocked categories
    const hardBlock = Object.entries(result.categories).some(
      ([cat, active]) => active && ALWAYS_BLOCK.has(cat),
    );

    // Threshold-based flag for remaining categories
    const thresholdFlag = Object.entries(result.category_scores).some(
      ([, score]) => score >= threshold,
    );

    const flagged = result.flagged || thresholdFlag || hardBlock;
    const blocked = hardBlock || (flagged && sensitivity !== 'low');

    const reason = flagged
      ? Object.entries(result.categories)
          .filter(([, v]) => v)
          .map(([k]) => k)
          .join(', ')
      : undefined;

    logger.info('Moderation result', { flagged, blocked, sensitivity, reason });

    return {
      flagged,
      blocked,
      categories: result.categories,
      scores: result.category_scores,
      reason,
    };
  },
};
