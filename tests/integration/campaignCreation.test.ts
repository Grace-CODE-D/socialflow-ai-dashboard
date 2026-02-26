import { sorobanService } from '../../services/sorobanService';
import { stellarService } from '../../services/stellarService';

jest.mock('../../services/stellarService');

describe('Campaign Creation Flow', () => {
  const mockCampaign = {
    name: 'Test Campaign',
    budget: '1000',
    duration: 30,
    creator: 'GCREATOR123'
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deploys campaign contract', async () => {
    const mockContractId = 'contract_123';
    (sorobanService.deployCampaign as jest.Mock).mockResolvedValue(mockContractId);

    const contractId = await sorobanService.deployCampaign(mockCampaign);
    expect(contractId).toBe(mockContractId);
  });

  it('funds campaign treasury', async () => {
    const mockTxHash = 'fund_tx_123';
    (stellarService.fundContract as jest.Mock).mockResolvedValue(mockTxHash);

    const txHash = await stellarService.fundContract('contract_123', '1000');
    expect(txHash).toBe(mockTxHash);
  });

  it('validates campaign parameters', async () => {
    await expect(
      sorobanService.deployCampaign({
        ...mockCampaign,
        budget: '-100'
      })
    ).rejects.toThrow();
  });

  it('retrieves campaign status', async () => {
    const mockStatus = { active: true, remaining: '500' };
    (sorobanService.getCampaignStatus as jest.Mock).mockResolvedValue(mockStatus);

    const status = await sorobanService.getCampaignStatus('contract_123');
    expect(status).toEqual(mockStatus);
  });

  it('distributes rewards', async () => {
    const mockTxHash = 'reward_tx_123';
    (sorobanService.distributeRewards as jest.Mock).mockResolvedValue(mockTxHash);

    const txHash = await sorobanService.distributeRewards('contract_123', [
      { recipient: 'GUSER1', amount: '10' },
      { recipient: 'GUSER2', amount: '20' }
    ]);

    expect(txHash).toBe(mockTxHash);
  });
});
