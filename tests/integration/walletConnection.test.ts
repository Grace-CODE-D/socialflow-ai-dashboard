import { walletService } from '../../services/walletService';
import { stellarService } from '../../services/stellarService';

jest.mock('../../services/stellarService');

describe('Wallet Connection Flow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('connects to Freighter wallet', async () => {
    const mockPublicKey = 'GTEST123456789';
    (stellarService.connectWallet as jest.Mock).mockResolvedValue(mockPublicKey);

    const result = await walletService.connect('freighter');
    expect(result).toBe(mockPublicKey);
    expect(stellarService.connectWallet).toHaveBeenCalledWith('freighter');
  });

  it('handles connection failure', async () => {
    (stellarService.connectWallet as jest.Mock).mockRejectedValue(new Error('Connection failed'));

    await expect(walletService.connect('freighter')).rejects.toThrow('Connection failed');
  });

  it('disconnects wallet', async () => {
    (stellarService.disconnectWallet as jest.Mock).mockResolvedValue(true);

    const result = await walletService.disconnect();
    expect(result).toBe(true);
  });

  it('retrieves wallet balance', async () => {
    const mockBalance = { XLM: '100.00', USDC: '50.00' };
    (stellarService.getBalance as jest.Mock).mockResolvedValue(mockBalance);

    const balance = await walletService.getBalance('GTEST123');
    expect(balance).toEqual(mockBalance);
  });
});
