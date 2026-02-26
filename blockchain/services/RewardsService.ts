import { RewardConfig, UserReward, EligibilityCriteria } from '../types/rewards';
import { SmartContractService } from './SmartContractService';

export class RewardsService {
  private contractService: SmartContractService;

  constructor(rpcUrl: string) {
    this.contractService = new SmartContractService(rpcUrl);
  }

  async deployRewardCampaign(config: RewardConfig): Promise<string> {
    // Deploy smart contract for reward campaign
    const contractParams = {
      name: config.name,
      rules: config.rules,
      totalBudget: config.pool.totalBudget,
      asset: config.pool.asset,
      startDate: config.pool.startDate,
      endDate: config.pool.endDate,
      eligibility: config.eligibility,
    };

    const result = await this.contractService.invokeContract(
      {
        contractId: 'REWARD_FACTORY_CONTRACT_ID',
        method: 'create_campaign',
        params: [contractParams],
      },
      false
    );

    return result.contractId;
  }

  async getUserRewards(userAddress: string): Promise<UserReward[]> {
    const result = await this.contractService.invokeContract(
      {
        contractId: 'REWARD_REGISTRY_CONTRACT_ID',
        method: 'get_user_rewards',
        params: [userAddress],
      },
      true
    );

    return result.rewards || [];
  }

  async claimReward(rewardId: string, userAddress: string): Promise<string> {
    const result = await this.contractService.invokeContract(
      {
        contractId: 'REWARD_REGISTRY_CONTRACT_ID',
        method: 'claim_reward',
        params: [rewardId, userAddress],
      },
      false
    );

    return result.txHash;
  }

  async checkEligibility(
    userAddress: string,
    criteria: EligibilityCriteria
  ): Promise<{ eligible: boolean; reason?: string }> {
    const result = await this.contractService.invokeContract(
      {
        contractId: 'REWARD_REGISTRY_CONTRACT_ID',
        method: 'check_eligibility',
        params: [userAddress, criteria],
      },
      true
    );

    return result;
  }

  async getCampaignState(contractId: string): Promise<any> {
    return this.contractService.getContractState(contractId);
  }

  async estimateRewardClaim(rewardId: string): Promise<string> {
    const simulation = await this.contractService.simulateTransaction({
      contractId: 'REWARD_REGISTRY_CONTRACT_ID',
      method: 'claim_reward',
      params: [rewardId, 'USER_ADDRESS'],
    });

    return simulation.estimatedFee;
  }

  async pauseCampaign(contractId: string): Promise<void> {
    await this.contractService.invokeContract(
      {
        contractId,
        method: 'pause',
        params: [],
      },
      false
    );
  }

  async resumeCampaign(contractId: string): Promise<void> {
    await this.contractService.invokeContract(
      {
        contractId,
        method: 'resume',
        params: [],
      },
      false
    );
  }

  async addBudget(contractId: string, amount: string): Promise<void> {
    await this.contractService.invokeContract(
      {
        contractId,
        method: 'add_budget',
        params: [amount],
      },
      false
    );
  }

  onCampaignStateChange(contractId: string, callback: (state: any) => void): () => void {
    return this.contractService.onStateChange(contractId, callback);
  }
}
