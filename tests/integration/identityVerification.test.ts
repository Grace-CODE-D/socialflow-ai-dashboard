import { identityService } from '../../services/identityService';
import { stellarService } from '../../services/stellarService';

jest.mock('../../services/stellarService');

describe('Identity Verification Flow', () => {
  const mockUserId = 'user_123';
  const mockPlatform = 'twitter';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('initiates verification', async () => {
    const mockChallenge = 'challenge_token_123';
    (identityService.initiateVerification as jest.Mock).mockResolvedValue(mockChallenge);

    const challenge = await identityService.initiateVerification(mockUserId, mockPlatform);
    expect(challenge).toBe(mockChallenge);
  });

  it('verifies social proof', async () => {
    const mockProof = { platform: mockPlatform, handle: '@testuser', postUrl: 'https://twitter.com/test' };
    (identityService.verifyProof as jest.Mock).mockResolvedValue(true);

    const result = await identityService.verifyProof(mockUserId, mockProof);
    expect(result).toBe(true);
  });

  it('stores verification on-chain', async () => {
    const mockTxHash = 'verify_tx_123';
    (stellarService.storeVerification as jest.Mock).mockResolvedValue(mockTxHash);

    const txHash = await stellarService.storeVerification(mockUserId, mockPlatform);
    expect(txHash).toBe(mockTxHash);
  });

  it('retrieves verification status', async () => {
    const mockStatus = { isVerified: true, platform: mockPlatform, timestamp: Date.now() };
    (identityService.getVerificationStatus as jest.Mock).mockResolvedValue(mockStatus);

    const status = await identityService.getVerificationStatus(mockUserId);
    expect(status.isVerified).toBe(true);
  });

  it('handles verification failure', async () => {
    (identityService.verifyProof as jest.Mock).mockResolvedValue(false);

    const result = await identityService.verifyProof(mockUserId, {
      platform: mockPlatform,
      handle: '@invalid',
      postUrl: 'invalid'
    });

    expect(result).toBe(false);
  });

  it('revokes verification', async () => {
    (identityService.revokeVerification as jest.Mock).mockResolvedValue(true);

    const result = await identityService.revokeVerification(mockUserId, mockPlatform);
    expect(result).toBe(true);
  });
});
