import { videoConfig } from '../video.config';

describe('videoConfig', () => {
  it('defines upload limits and allowed mime types', () => {
    expect(videoConfig.upload.maxFileSize).toBe(500 * 1024 * 1024);
    expect(videoConfig.upload.allowedMimeTypes).toContain('video/mp4');
    expect(videoConfig.upload.allowedMimeTypes.length).toBeGreaterThan(0);
  });

  it('defines quality presets with valid dimensions', () => {
    for (const [key, quality] of Object.entries(videoConfig.qualities)) {
      expect(quality.name).toBe(key);
      expect(quality.width).toBeGreaterThan(0);
      expect(quality.height).toBeGreaterThan(0);
      expect(quality.bitrate).toMatch(/^\d+k$/);
    }
  });

  it('defines mp4 and webm format presets', () => {
    expect(videoConfig.formats.mp4.extension).toBe('mp4');
    expect(videoConfig.formats.webm.extension).toBe('webm');
  });

  it('defines a single-concurrency queue', () => {
    expect(videoConfig.queue.maxConcurrent).toBe(1);
    expect(videoConfig.queue.jobCleanupAge).toBeGreaterThan(0);
  });
});
