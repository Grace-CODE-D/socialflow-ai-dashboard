import {
  TranslationRequest,
  TranslationResult,
  SupportedLanguage,
  TranslationProvider,
  BatchTranslationRequest,
  BatchTranslationResult,
} from '@socialflow/shared';
import { OpenAPI } from '../api/core/OpenAPI';
import { request as apiRequest } from '../api/core/request';

/**
 * TranslationService - Multi-language content translation
 *
 * All actual translation work (Gemini, DeepL, Google Translate) happens
 * server-side via /api/v1/translation/*. Provider API keys must never be
 * read from import.meta.env here — Vite inlines VITE_-prefixed vars into
 * the shipped client bundle, which would leak paid keys to anyone who
 * inspects it.
 */
class TranslationService {
  private readonly STORAGE_KEY = 'socialflow_translation_history';
  private readonly MAX_HISTORY = 50;

  // Supported languages (kept locally for instant UI rendering; the
  // backend's /translation/languages endpoint is the source of truth)
  private readonly LANGUAGES: SupportedLanguage[] = [
    { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸' },
    { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
    { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷' },
    { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪' },
    { code: 'it', name: 'Italian', nativeName: 'Italiano', flag: '🇮🇹' },
    { code: 'pt', name: 'Portuguese', nativeName: 'Português', flag: '🇵🇹' },
    { code: 'ru', name: 'Russian', nativeName: 'Русский', flag: '🇷🇺' },
    { code: 'ja', name: 'Japanese', nativeName: '日本語', flag: '🇯🇵' },
    { code: 'ko', name: 'Korean', nativeName: '한국어', flag: '🇰🇷' },
    { code: 'zh', name: 'Chinese', nativeName: '中文', flag: '🇨🇳' },
    { code: 'ar', name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦' },
    { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳' },
    { code: 'nl', name: 'Dutch', nativeName: 'Nederlands', flag: '🇳🇱' },
    { code: 'pl', name: 'Polish', nativeName: 'Polski', flag: '🇵🇱' },
    { code: 'tr', name: 'Turkish', nativeName: 'Türkçe', flag: '🇹🇷' },
    { code: 'sv', name: 'Swedish', nativeName: 'Svenska', flag: '🇸🇪' },
    { code: 'da', name: 'Danish', nativeName: 'Dansk', flag: '🇩🇰' },
    { code: 'fi', name: 'Finnish', nativeName: 'Suomi', flag: '🇫🇮' },
    { code: 'no', name: 'Norwegian', nativeName: 'Norsk', flag: '🇳🇴' },
    { code: 'cs', name: 'Czech', nativeName: 'Čeština', flag: '🇨🇿' },
  ];

  /**
   * Translate content to multiple languages via the backend API
   */
  public async translate(request: TranslationRequest): Promise<TranslationResult> {
    const result = await apiRequest<TranslationResult>(OpenAPI, {
      method: 'POST',
      url: '/translation/translate',
      body: request,
      mediaType: 'application/json',
    });

    const normalized: TranslationResult = {
      ...result,
      timestamp: new Date(result.timestamp),
    };

    this.saveToHistory(request, normalized);

    return normalized;
  }

  /**
   * Detect the source language of a text via the backend API
   */
  private async detectLanguage(text: string): Promise<string> {
    try {
      const result = await apiRequest<{ detectedLanguage: string }>(OpenAPI, {
        method: 'POST',
        url: '/translation/detect',
        body: { text },
        mediaType: 'application/json',
      });
      return result.detectedLanguage;
    } catch (error) {
      console.warn('Language detection failed, defaulting to English:', error);
      return 'en';
    }
  }

  /**
   * Get language name from code
   */
  private getLanguageName(code: string): string {
    const language = this.LANGUAGES.find((lang) => lang.code === code);
    return language?.name || code.toUpperCase();
  }

  /**
   * Get all supported languages
   */
  public getSupportedLanguages(): SupportedLanguage[] {
    return this.LANGUAGES;
  }

  /**
   * Get available translation providers from the backend.
   * The backend checks its own (server-side) env vars — no client-side
   * key is ever read or exposed here.
   */
  public async getAvailableProviders(): Promise<TranslationProvider[]> {
    try {
      const result = await apiRequest<{ providers: TranslationProvider[] }>(OpenAPI, {
        method: 'GET',
        url: '/translation/providers',
      });
      return result.providers;
    } catch (error) {
      console.warn('Failed to fetch translation providers:', error);
      return [];
    }
  }

  /**
   * Batch translate multiple texts via the backend API
   */
  public async batchTranslate(request: BatchTranslationRequest): Promise<BatchTranslationResult> {
    const startTime = Date.now();

    const result = await apiRequest<{ translations: TranslationResult[]; totalTexts: number; duration: number }>(
      OpenAPI,
      {
        method: 'POST',
        url: '/translation/batch',
        body: {
          texts: request.texts,
          sourceLanguage: request.sourceLanguage,
          targetLanguages: request.targetLanguages,
        },
        mediaType: 'application/json',
      },
    );

    const totalCharacters = request.texts.reduce((sum, text) => sum + text.length, 0);
    const duration = Date.now() - startTime;

    return {
      translations: result.translations.map((t) => ({ ...t, timestamp: new Date(t.timestamp) })),
      totalCharacters,
      provider: 'backend',
      duration,
    };
  }

  /**
   * Get translation history
   */
  public getHistory(): TranslationResult[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) return [];

      const history = JSON.parse(stored);
      return history.map((item: any) => ({
        ...item,
        timestamp: new Date(item.timestamp),
      }));
    } catch (error) {
      console.error('Failed to load translation history:', error);
      return [];
    }
  }

  /**
   * Save translation to history
   */
  private saveToHistory(request: TranslationRequest, result: TranslationResult): void {
    try {
      const history = this.getHistory();
      history.unshift(result);

      // Keep only last MAX_HISTORY items
      const trimmedHistory = history.slice(0, this.MAX_HISTORY);

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(trimmedHistory));
    } catch (error) {
      console.error('Failed to save translation history:', error);
    }
  }

  /**
   * Clear translation history
   */
  public clearHistory(): void {
    localStorage.removeItem(this.STORAGE_KEY);
  }

  /**
   * Get popular language pairs
   */
  public getPopularLanguagePairs(): Array<{ from: string; to: string[]; label: string }> {
    return [
      { from: 'en', to: ['es', 'fr', 'de', 'pt'], label: 'English to European' },
      { from: 'en', to: ['ja', 'ko', 'zh'], label: 'English to Asian' },
      { from: 'en', to: ['ar', 'hi'], label: 'English to Middle East/India' },
      { from: 'es', to: ['en', 'pt', 'fr'], label: 'Spanish to Major Languages' },
      { from: 'zh', to: ['en', 'ja', 'ko'], label: 'Chinese to English/Asian' },
    ];
  }

  /**
   * Estimate translation cost (for paid APIs)
   */
  public estimateCost(
    text: string,
    targetLanguages: string[],
    provider: 'deepl' | 'google',
  ): { characters: number; estimatedCost: number; currency: string } {
    const characters = text.length * targetLanguages.length;

    // Pricing estimates (as of 2024)
    const pricing = {
      deepl: 20 / 1000000, // $20 per 1M characters
      google: 20 / 1000000, // $20 per 1M characters
    };

    const costPerChar = pricing[provider];
    const estimatedCost = characters * costPerChar;

    return {
      characters,
      estimatedCost: Math.max(0.01, estimatedCost), // Minimum $0.01
      currency: 'USD',
    };
  }

  /**
   * Validate translation quality
   */
  public async validateTranslation(
    original: string,
    translated: string,
    targetLang: string,
  ): Promise<{ valid: boolean; issues: string[] }> {
    const issues: string[] = [];

    // Check length difference (shouldn't be too drastic)
    const lengthRatio = translated.length / original.length;
    if (lengthRatio < 0.5 || lengthRatio > 2.0) {
      issues.push('Translation length significantly different from original');
    }

    // Check if preserved elements are intact
    const originalUrls = original.match(/https?:\/\/[^\s]+/g) || [];
    const translatedUrls = translated.match(/https?:\/\/[^\s]+/g) || [];
    if (originalUrls.length !== translatedUrls.length) {
      issues.push('URLs may not be preserved correctly');
    }

    const originalHashtags = original.match(/#\w+/g) || [];
    const translatedHashtags = translated.match(/#\w+/g) || [];
    if (originalHashtags.length !== translatedHashtags.length) {
      issues.push('Hashtags may not be preserved correctly');
    }

    return {
      valid: issues.length === 0,
      issues,
    };
  }

  /**
   * Get language by code
   */
  public getLanguage(code: string): SupportedLanguage | undefined {
    return this.LANGUAGES.find((lang) => lang.code === code);
  }

  /**
   * Search languages
   */
  public searchLanguages(query: string): SupportedLanguage[] {
    const lowerQuery = query.toLowerCase();
    return this.LANGUAGES.filter(
      (lang) =>
        lang.name.toLowerCase().includes(lowerQuery) ||
        lang.nativeName.toLowerCase().includes(lowerQuery) ||
        lang.code.toLowerCase().includes(lowerQuery),
    );
  }
}

export const translationService = new TranslationService();
