import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { TranslationWidget } from './TranslationWidget';
import { translationService } from '../services/TranslationService';

vi.mock('../services/TranslationService', () => ({
  translationService: {
    getSupportedLanguages: vi.fn(() => [
      { code: 'es', name: 'Spanish', nativeName: 'Espanol', flag: 'ES' },
      { code: 'fr', name: 'French', nativeName: 'Francais', flag: 'FR' },
    ]),
    searchLanguages: vi.fn(() => []),
    translate: vi.fn(),
  },
}));

const translateMock = translationService.translate as vi.Mock;

beforeEach(() => {
  vi.useFakeTimers();
  translateMock.mockResolvedValue({
    provider: 'mock',
    sourceLanguage: 'en',
    translations: [],
    preservedElements: [],
  });
});

afterEach(() => {
  vi.clearAllMocks();
  vi.useRealTimers();
});

test('debounces translation API calls', async () => {
  render(<TranslationWidget text="Hello" debounceMs={500} />);

  fireEvent.click(screen.getByText('Spanish'));
  const button = screen.getByRole('button', { name: /translate to 1 language/i });

  fireEvent.click(button);
  fireEvent.click(button);

  expect(translateMock).not.toHaveBeenCalled();

  await act(async () => {
    vi.advanceTimersByTime(500);
  });

  expect(translateMock).toHaveBeenCalledTimes(1);
  expect(translateMock).toHaveBeenCalledWith(expect.objectContaining({
    text: 'Hello',
    targetLanguages: ['es'],
  }));
});

test('cancels pending debounce on unmount', async () => {
  const { unmount } = render(<TranslationWidget text="Hello" debounceMs={500} />);

  fireEvent.click(screen.getByText('Spanish'));
  fireEvent.click(screen.getByRole('button', { name: /translate to 1 language/i }));
  unmount();

  act(() => {
    vi.advanceTimersByTime(500);
  });

  expect(translateMock).not.toHaveBeenCalled();
});
