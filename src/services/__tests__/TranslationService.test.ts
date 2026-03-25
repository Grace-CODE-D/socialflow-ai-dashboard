import { translationService } from '../TranslationService';
import { TranslationRequest } from '../../types/translation';

describe('TranslationService', () => {
  describe('translate', () => {
    it('should translate text to target languages', async () => {
      const request: TranslationRequest = {
        text: 'Hello world',
        targetLanguages: ['es', 'fr'],
      };

      const result = await translationService.translate(request);

      expect(result).toBeDefined();
      expect(result.originalText).toBe('Hello world');
      expect(result.translations).toHaveLength(2);
      expect(result.translations[0].language).toBe('es');
      expect(result.translations[1].language).toBe('fr');
    });

    it('should preserve URLs in translation', async () => {
      const request: TranslationRequest = {
        text: 'Visit https://example.com for more info',
        targetLanguages: ['es'],
        preserveUrls: true,
      };

      const result = await translationService.translate(request);
      const translation = result.translations[0];

      expect(translation.text).toContain('https://example.com');
    });

    it('should preserve hashtags in translation', async () => {
      const request: TranslationRequest = {
        text: 'Check this out #trending #viral',
        targetLanguages: ['es'],
        preserveHashtags: true,
      };

      const result = await translationService.translate(request);
      const translation = result.translations[0];

      expect(translation.text).toContain('#trending');
      expect(translation.text).toContain('#viral');
    });

    it('should preserve mentions in translation', async () => {
      const request: TranslationRequest = {
        text: 'Thanks @company for the support',
        targetLanguages: ['fr'],
        preserveMentions: true,
      };

      const result = await translationService.translate(request);
      const translation = result.translations[0];

      expect(translation.text).toContain('@company');
    });

    it('should preserve emojis in translation', async () => {
      const request: TranslationRequest = {
        text: 'Amazing news! 🚀 🎉',
        targetLanguages: ['de'],
        preserveEmojis: true,
      };

      const result = await translationService.translate(request);
      const translation = result.translations[0];

      expect(translation.text).toContain('🚀');
      expect(translation.text).toContain('🎉');
    });

    it('should detect source language automatically', async () => {
      const request: TranslationRequest = {
        text: 'Hello world',
        targetLanguages: ['es'],
      };

      const result = await translationService.translate(request);

      expect(result.sourceLanguage).toBe('en');
    });

    it('should skip translation if target equals source', async () => {
      const request: TranslationRequest = {
        text: 'Hello world',
        sourceLanguage: 'en',
        targetLanguages: ['en', 'es'],
      };

      const result = await translationService.translate(request);

      const englishTranslation = result.translations.find(t => t.language === 'en');
      expect(englishTranslation?.text).toBe('Hello world');
      expect(englishTranslation?.confidence).toBe(1.0);
    });
  });

  describe('getSupportedLanguages', () => {
    it('should return list of supported languages', () => {
      const languages = translationService.getSupportedLanguages();

      expect(languages.length).toBeGreaterThan(0);
      expect(languages[0]).toHaveProperty('code');
      expect(languages[0]).toHaveProperty('name');
      expect(languages[0]).toHaveProperty('nativeName');
      expect(languages[0]).toHaveProperty('flag');
    });
  });

  describe('searchLanguages', () => {
    it('should search languages by name', () => {
      const results = translationService.searchLanguages('span');

      expect(results.length).toBeGreaterThan(0);
      expect(results[0].name.toLowerCase()).toContain('span');
    });

    it('should search languages by code', () => {
      const results = translationService.searchLanguages('es');

      expect(results.length).toBeGreaterThan(0);
      expect(results.some(l => l.code === 'es')).toBe(true);
    });
  });

  describe('getAvailableProviders', () => {
    it('should return list of providers', () => {
      const providers = translationService.getAvailableProviders();

      expect(providers.length).toBeGreaterThan(0);
      providers.forEach(provider => {
        expect(provider).toHaveProperty('name');
        expect(provider).toHaveProperty('available');
        expect(provider).toHaveProperty('languages');
        expect(provider).toHaveProperty('characterLimit');
      });
    });
  });

  describe('batchTranslate', () => {
    it('should translate multiple texts', async () => {
      const result = await translationService.batchTranslate({
        texts: ['Hello', 'Goodbye', 'Thank you'],
        targetLanguages: ['es', 'fr'],
      });

      expect(result.translations).toHaveLength(3);
      expect(result.totalCharacters).toBeGreaterThan(0);
      expect(result.duration).toBeGreaterThan(0);
    });
  });

  describe('estimateCost', () => {
    it('should estimate translation cost', () => {
      const cost = translationService.estimateCost(
        'Sample text for translation',
        ['es', 'fr', 'de'],
        'deepl'
      );

      expect(cost.characters).toBeGreaterThan(0);
      expect(cost.estimatedCost).toBeGreaterThan(0);
      expect(cost.currency).toBe('USD');
    });
  });

  describe('validateTranslation', () => {
    it('should validate translation quality', async () => {
      const validation = await translationService.validateTranslation(
        'Hello world #test @user https://example.com',
        'Hola mundo #test @user https://example.com',
        'es'
      );

      expect(validation).toHaveProperty('valid');
      expect(validation).toHaveProperty('issues');
      expect(Array.isArray(validation.issues)).toBe(true);
    });

    it('should detect missing URLs', async () => {
      const validation = await translationService.validateTranslation(
        'Visit https://example.com',
        'Visita el sitio', // URL missing
        'es'
      );

      expect(validation.valid).toBe(false);
      expect(validation.issues.length).toBeGreaterThan(0);
    });
  });

  describe('getPopularLanguagePairs', () => {
    it('should return popular language pairs', () => {
      const pairs = translationService.getPopularLanguagePairs();

      expect(pairs.length).toBeGreaterThan(0);
      pairs.forEach(pair => {
        expect(pair).toHaveProperty('from');
        expect(pair).toHaveProperty('to');
        expect(pair).toHaveProperty('label');
        expect(Array.isArray(pair.to)).toBe(true);
      });
    });
  });

  describe('history management', () => {
    beforeEach(() => {
      translationService.clearHistory();
    });

    it('should save translations to history', async () => {
      await translationService.translate({
        text: 'Test translation',
        targetLanguages: ['es'],
      });

      const history = translationService.getHistory();
      expect(history.length).toBe(1);
    });

    it('should clear history', async () => {
      await translationService.translate({
        text: 'Test',
        targetLanguages: ['es'],
      });

      translationService.clearHistory();
      const history = translationService.getHistory();
      
      expect(history.length).toBe(0);
    });
  });
});
