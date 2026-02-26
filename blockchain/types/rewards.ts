export interface RewardRule {
  actionType: 'like' | 'share' | 'comment' | 'view';
  rewardAmount: string;
  enabled: boolean;
}

export interface EligibilityCriteria {
  minFollowers?: number;
  minEngagementRate?: number;
  accountAge?: number;
  verifiedOnly?: boolean;
}

export interface RewardPool {
  totalBudget: string;
  remainingBudget: string;
  asset: {
    code: string;
    issuer: string;
  };
  startDate: number;
  endDate: number;
}

export interface RewardConfig {
  id: string;
  name: string;
  rules: RewardRule[];
  pool: RewardPool;
  eligibility: EligibilityCriteria;
  contractId?: string;
  status: 'active' | 'paused' | 'completed';
}

export interface UserReward {
  id: string;
  campaignName: string;
  amount: string;
  asset: {
    code: string;
    issuer: string;
  };
  earnedDate: number;
  claimed: boolean;
  claimTxHash?: string;
  eligibilityMet: boolean;
  reason?: string;
}

export interface ClaimStatus {
  status: 'idle' | 'pending' | 'success' | 'error';
  txHash?: string;
  error?: string;
}
