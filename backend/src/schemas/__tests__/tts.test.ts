import { createTTSJobSchema } from '../tts';

describe('createTTSJobSchema', () => {
  it('accepts a valid minimal payload', () => {
    const result = createTTSJobSchema.safeParse({
      segments: [{ text: 'Hello world' }],
    });

    expect(result.success).toBe(true);
  });

  it('accepts a valid full payload', () => {
    const result = createTTSJobSchema.safeParse({
      segments: [
        {
          text: 'Hello world',
          voiceId: 'voice-1',
          language: 'en',
          speed: 1.2,
          stability: 0.5,
          similarityBoost: 0.8,
        },
      ],
      provider: 'elevenlabs',
      outputFormat: 'mp3',
      videoPath: '/tmp/video.mp4',
    });

    expect(result.success).toBe(true);
  });

  it('rejects a payload with no segments', () => {
    const result = createTTSJobSchema.safeParse({ segments: [] });

    expect(result.success).toBe(false);
  });

  it('rejects a payload with more than 50 segments', () => {
    const segments = Array.from({ length: 51 }, () => ({ text: 'hi' }));

    const result = createTTSJobSchema.safeParse({ segments });

    expect(result.success).toBe(false);
  });

  it('rejects a segment with empty text', () => {
    const result = createTTSJobSchema.safeParse({
      segments: [{ text: '' }],
    });

    expect(result.success).toBe(false);
  });

  it('rejects a segment with text exceeding the max length', () => {
    const result = createTTSJobSchema.safeParse({
      segments: [{ text: 'a'.repeat(5001) }],
    });

    expect(result.success).toBe(false);
  });

  it('rejects an out-of-range speed value', () => {
    const result = createTTSJobSchema.safeParse({
      segments: [{ text: 'hi', speed: 3 }],
    });

    expect(result.success).toBe(false);
  });

  it('rejects an invalid provider value', () => {
    const result = createTTSJobSchema.safeParse({
      segments: [{ text: 'hi' }],
      provider: 'not-a-real-provider',
    });

    expect(result.success).toBe(false);
  });

  it('rejects an invalid outputFormat value', () => {
    const result = createTTSJobSchema.safeParse({
      segments: [{ text: 'hi' }],
      outputFormat: 'flac',
    });

    expect(result.success).toBe(false);
  });
});
