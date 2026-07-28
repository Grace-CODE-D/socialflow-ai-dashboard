import { ttsConfig } from '../tts.config';

describe('ttsConfig', () => {
  it('defines elevenlabs and google provider settings', () => {
    expect(ttsConfig.elevenlabs.apiUrl).toMatch(/^https:\/\//);
    expect(ttsConfig.google.apiUrl).toMatch(/^https:\/\//);
  });

  it('defines sane default speech parameters', () => {
    expect(ttsConfig.defaults.speed).toBeGreaterThan(0);
    expect(ttsConfig.defaults.stability).toBeGreaterThanOrEqual(0);
    expect(ttsConfig.defaults.stability).toBeLessThanOrEqual(1);
    expect(ttsConfig.defaults.maxSegmentLength).toBeGreaterThan(0);
  });

  it('every built-in voice has a unique id and required fields', () => {
    const ids = ttsConfig.voices.map((v) => v.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const voice of ttsConfig.voices) {
      expect(['elevenlabs', 'google']).toContain(voice.provider);
      expect(voice.name.length).toBeGreaterThan(0);
      expect(voice.language.length).toBeGreaterThan(0);
    }
  });
});
