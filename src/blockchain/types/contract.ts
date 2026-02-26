export interface ContractEvent {
  id: string;
  contractId: string;
  type: string;
  topics: string[];
  data: Record<string, any>;
  timestamp: number;
  transactionHash: string;
  ledger: number;
}

export enum ContractEventType {
  REWARD_DISTRIBUTED = 'reward_distributed',
  CAMPAIGN_CREATED = 'campaign_created',
  CAMPAIGN_COMPLETED = 'campaign_completed',
  MILESTONE_REACHED = 'milestone_reached',
  REFERRAL_REGISTERED = 'referral_registered',
  ENGAGEMENT_RECORDED = 'engagement_recorded',
}

export interface ContractTemplate {
  id: string;
  name: string;
  description: string;
  type: 'engagement_rewards' | 'referral_program' | 'milestone_bonus';
  wasmHash: string;
  parameters: ContractParameter[];
  version: string;
}

export interface ContractParameter {
  name: string;
  type: 'address' | 'u64' | 'u128' | 'string' | 'bool';
  description: string;
  required: boolean;
  defaultValue?: any;
}

export interface ParsedEventData {
  eventType: ContractEventType;
  payload: Record<string, any>;
  metadata: {
    contractId: string;
    transactionHash: string;
    ledger: number;
    timestamp: number;
  };
}
