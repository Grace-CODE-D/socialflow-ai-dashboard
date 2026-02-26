import { RewardsService } from '../services/RewardsService';
import { RewardConfig, EligibilityCriteria } from '../types/rewards';

jest.mock('../services/SmartContractService');

describe('RewardsService', () => {
  let service: RewardsService;
  const mockRpcUrl = 'https://soroban-testnet.stellar.org';

  beforeEach(() => {
    service = new RewardsService(mockRpcUrl);
    jest.clearAllMocks();
  });

  describe('deployRewardCampaign', () => {
    it('should deploy a reward campaign contract', async () => {
      const mockConfig: RewardConfig = {
        id: 'campaign_1',
        name: 'Test Campaign',
        rules: [
          { actionType: 'like', rewardAmount: '10', enabled: true },
        ],
        pool: {
          totalBudget: '10000',
          remainingBudget: '10000',
          asset: { code: 'XLM', issuer: '' },
          startDate: Date.now(),
          endDate: Date.now() + 30 * 24 * 60 * 60 * 1000,
        },
        eligibility: {
          minFollowers: 100,
        },
        status: 'active',
      };

      const contractId = await service.deployRewardCampaign(mockConfig);
      expect(contractId).toBeDefined();
    });
  });

  describe('getUserRewards', () => {
    it('should fetch user rewards', async () => {
      const userAddress = 'GABC123...';
      const rewards = await service.getUserRewards(userAddress);
      expect(Array.isArray(rewards)).toBe(true);
    });
  });

  describe('claimReward', () => {
    it('should claim a reward and return transaction hash', async () => {
      const rewardId = 'reward_1';
      const userAddress = 'GABC123...';
      
      const txHash = await service.claimReward(rewardId, userAddress);
      expect(txHash).toBeDefined();
    });
  });

  describe('checkEligibility', () => {
    it('should check if user meets eligibility criteria', async () => {
      const userAddress = 'GABC123...';
      const criteria: EligibilityCriteria = {
        minFollowers: 100,
        minEngagementRate: 2,
      };

      const result = await service.checkEligibility(userAddress, criteria);
      expect(result).toHaveProperty('eligible');
    });
  });

  describe('getCampaignState', () => {
    it('should retrieve campaign state', async () => {
      const contractId = 'C123...';
      const state = await service.getCampaignState(contractId);
      expect(state).toBeDefined();
    });
  });

  describe('estimateRewardClaim', () => {
    it('should estimate fee for claiming reward', async () => {
      const rewardId = 'reward_1';
      const fee = await service.estimateRewardClaim(rewardId);
      expect(fee).toBeDefined();
    });
  });

  describe('Campaign Management', () => {
    const contractId = 'C123...';

    it('should pause a campaign', async () => {
      await expect(service.pauseCampaign(contractId)).resolves.not.toThrow();
    });

    it('should resume a campaign', async () => {
      await expect(service.resumeCampaign(contractId)).resolves.not.toThrow();
    });

    it('should add budget to campaign', async () => {
      await expect(service.addBudget(contractId, '5000')).resolves.not.toThrow();
    });
  });

  describe('State Change Monitoring', () => {
    it('should subscribe to campaign state changes', () => {
      const contractId = 'C123...';
      const callback = jest.fn();

      const unsubscribe = service.onCampaignStateChange(contractId, callback);
      expect(typeof unsubscribe).toBe('function');
      
      unsubscribe();
    });
  });
});
