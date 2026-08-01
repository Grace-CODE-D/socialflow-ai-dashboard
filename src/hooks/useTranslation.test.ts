// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useTranslation } from './useTranslation';
import { translationService } from '../services/TranslationService';
import { TranslationRequest, TranslationResult } from '@socialflow/shared';

const buildRequest = (overrides: Partial<TranslationRequest> = {}): TranslationRequest => ({
  text: 'hello',
  targetLanguages: ['es'],
  ...overrides,
});

vi.mock('../services/TranslationService', () => ({
  translationService: {
    translate: vi.fn(),
  },
}));

const mockTranslate = translationService.translate as ReturnType<typeof vi.fn>;

describe('useTranslation', () => {
  beforeEach(() => {
    mockTranslate.mockReset();
  });

  it('starts with idle state', () => {
    const { result } = renderHook(() => useTranslation());

    expect(result.current.loading).toBe(false);
    expect(result.current.result).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('sets loading while translating then resolves with the result', async () => {
    let resolveTranslate: (value: unknown) => void = () => {};
    mockTranslate.mockReturnValue(
      new Promise((resolve) => {
        resolveTranslate = resolve;
      }),
    );

    const { result } = renderHook(() => useTranslation());
    const request = buildRequest();
    const translationResult = {
      originalText: 'hello',
      sourceLanguage: 'en',
      translations: [],
      preservedElements: [],
      provider: 'deepl',
      timestamp: new Date(),
    } satisfies TranslationResult;

    let translatePromise: Promise<unknown>;
    act(() => {
      translatePromise = result.current.translate(request);
    });

    expect(result.current.loading).toBe(true);
    expect(result.current.error).toBeNull();

    await act(async () => {
      resolveTranslate(translationResult);
      await translatePromise;
    });

    expect(mockTranslate).toHaveBeenCalledWith(request);
    expect(result.current.loading).toBe(false);
    expect(result.current.result).toEqual(translationResult);
    expect(result.current.error).toBeNull();
  });

  it('sets an error message when translation fails', async () => {
    mockTranslate.mockRejectedValue(new Error('Translation failed'));
    vi.spyOn(console, 'error').mockImplementation(() => {});

    const { result } = renderHook(() => useTranslation());

    let returned: unknown;
    await act(async () => {
      returned = await result.current.translate(buildRequest());
    });

    expect(returned).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.result).toBeNull();
    expect(result.current.error).toBe('Translation failed');
  });

  it('resets result and error state', async () => {
    mockTranslate.mockRejectedValue(new Error('boom'));
    vi.spyOn(console, 'error').mockImplementation(() => {});

    const { result } = renderHook(() => useTranslation());

    await act(async () => {
      await result.current.translate(buildRequest({ targetLanguages: ['fr'] }));
    });

    expect(result.current.error).toBe('boom');

    act(() => {
      result.current.reset();
    });

    expect(result.current.result).toBeNull();
    expect(result.current.error).toBeNull();
  });
});
