/**
 * Covers initDirectories' already-exists and needs-creation cases, plus
 * error propagation when directory creation fails.
 */

jest.mock('fs/promises', () => ({
  mkdir: jest.fn(),
}));

jest.mock('../../config/video.config', () => ({
  videoConfig: {
    upload: {
      uploadDir: 'uploads/videos',
      transcodedDir: 'uploads/transcoded',
    },
  },
}));

import fs from 'fs/promises';
import { initDirectories } from '../initDirectories';

describe('initDirectories', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('creates all required directories with recursive:true (needs-creation case)', async () => {
    (fs.mkdir as jest.Mock).mockResolvedValue(undefined);

    await initDirectories();

    expect(fs.mkdir).toHaveBeenCalledTimes(3);
    for (const call of (fs.mkdir as jest.Mock).mock.calls) {
      expect(call[1]).toEqual({ recursive: true });
    }
  });

  it('succeeds without error when directories already exist (mkdir recursive is idempotent)', async () => {
    (fs.mkdir as jest.Mock).mockResolvedValue(undefined);

    await expect(initDirectories()).resolves.toBeUndefined();
  });

  it('propagates an error when a directory fails to be created', async () => {
    const failure = new Error('EACCES: permission denied');
    (fs.mkdir as jest.Mock).mockRejectedValueOnce(failure);

    await expect(initDirectories()).rejects.toThrow('EACCES: permission denied');
  });
});
