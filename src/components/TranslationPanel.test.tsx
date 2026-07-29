import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { TranslationPanel } from './TranslationPanel';
import { translationService } from '../services/TranslationService';

describe('TranslationPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('covers language selection and translate submission flow', async () => {
    vi.spyOn(translationService, 'getAvailableProviders').mockResolvedValue([
      { name: 'Google Translate', available: true, providerId: 'google' },
    ]);
    vi.spyOn(translationService, 'translate').mockResolvedValue({
      originalText: 'Hello world #test @user',
      sourceLanguage: 'en',
      translations: [
        {
          language: 'es',
          languageName: 'Spanish',
          text: 'Hola mundo',
          confidence: 0.98,
        },
      ],
      preservedElements: [],
      timestamp: new Date(),
    });

    render(<TranslationPanel />);

    await waitFor(() => {
      expect(screen.getByText('Google Translate')).toBeInTheDocument();
    });

    // Default target languages selected are 'es' and 'fr' (2 languages)
    expect(screen.getByText(/Target Languages \(2\)/i)).toBeInTheDocument();

    // Toggle German ('de') language button to add it
    const germanBtn = screen.getByRole('button', { name: /German/i });
    fireEvent.click(germanBtn);

    expect(screen.getByText(/Target Languages \(3\)/i)).toBeInTheDocument();

    // Toggle Spanish ('es') language button to remove it
    const spanishBtn = screen.getByRole('button', { name: /Spanish/i });
    fireEvent.click(spanishBtn);

    expect(screen.getByText(/Target Languages \(2\)/i)).toBeInTheDocument();

    // Input text and trigger translation
    const textarea = screen.getByPlaceholderText(/Enter your post content here/i);
    fireEvent.change(textarea, { target: { value: 'Hello world #test @user' } });

    await waitFor(() => {
      expect(translationService.translate).toHaveBeenCalled();
    });

    // Click translate button
    const translateBtn = screen.getByRole('button', { name: /Translate Now/i });
    fireEvent.click(translateBtn);

    await waitFor(() => {
      expect(translationService.translate).toHaveBeenCalledWith(
        expect.objectContaining({
          text: 'Hello world #test @user',
          targetLanguages: expect.arrayContaining(['fr', 'de']),
          preserveHashtags: true,
          preserveMentions: true,
        }),
      );
    });

    await waitFor(() => {
      expect(screen.getByText('Hola mundo')).toBeInTheDocument();
    });
  });
});
