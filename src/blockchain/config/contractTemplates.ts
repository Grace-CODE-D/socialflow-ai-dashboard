import { ContractTemplate } from '../types/contract';

export const CONTRACT_TEMPLATES: ContractTemplate[] = [
  {
    id: 'engagement-rewards-v1',
    name: 'Engagement Rewards',
    description: 'Automatically reward users for likes, comments, and shares',
    type: 'engagement_rewards',
    wasmHash: '0x1a2b3c4d5e6f7890abcdef1234567890abcdef1234567890abcdef1234567890',
    version: '1.0.0',
    parameters: [
      {
        name: 'reward_token',
        type: 'address',
        description: 'Token address for rewards',
        required: true,
      },
      {
        name: 'like_reward',
        type: 'u64',
        description: 'Reward amount per like',
        required: true,
        defaultValue: 10,
      },
      {
        name: 'comment_reward',
        type: 'u64',
        description: 'Reward amount per comment',
        required: true,
        defaultValue: 25,
      },
      {
        name: 'share_reward',
        type: 'u64',
        description: 'Reward amount per share',
        required: true,
        defaultValue: 50,
      },
      {
        name: 'max_rewards_per_user',
        type: 'u64',
        description: 'Maximum rewards per user per campaign',
        required: true,
        defaultValue: 1000,
      },
    ],
  },
  {
    id: 'referral-program-v1',
    name: 'Referral Program',
    description: 'Reward users for referring new followers',
    type: 'referral_program',
    wasmHash: '0x2b3c4d5e6f7890abcdef1234567890abcdef1234567890abcdef1234567890ab',
    version: '1.0.0',
    parameters: [
      {
        name: 'reward_token',
        type: 'address',
        description: 'Token address for rewards',
        required: true,
      },
      {
        name: 'referrer_reward',
        type: 'u64',
        description: 'Reward for the referrer',
        required: true,
        defaultValue: 100,
      },
      {
        name: 'referee_reward',
        type: 'u64',
        description: 'Reward for the new user',
        required: true,
        defaultValue: 50,
      },
      {
        name: 'min_engagement_threshold',
        type: 'u64',
        description: 'Minimum engagement required to qualify',
        required: true,
        defaultValue: 5,
      },
      {
        name: 'max_referrals_per_user',
        type: 'u64',
        description: 'Maximum referrals per user',
        required: true,
        defaultValue: 50,
      },
    ],
  },
  {
    id: 'milestone-bonus-v1',
    name: 'Milestone Bonus',
    description: 'Reward users when reaching follower or engagement milestones',
    type: 'milestone_bonus',
    wasmHash: '0x3c4d5e6f7890abcdef1234567890abcdef1234567890abcdef1234567890abcd',
    version: '1.0.0',
    parameters: [
      {
        name: 'reward_token',
        type: 'address',
        description: 'Token address for rewards',
        required: true,
      },
      {
        name: 'milestone_1k',
        type: 'u128',
        description: 'Reward for 1,000 followers',
        required: true,
        defaultValue: 1000,
      },
      {
        name: 'milestone_10k',
        type: 'u128',
        description: 'Reward for 10,000 followers',
        required: true,
        defaultValue: 10000,
      },
      {
        name: 'milestone_100k',
        type: 'u128',
        description: 'Reward for 100,000 followers',
        required: true,
        defaultValue: 100000,
      },
      {
        name: 'milestone_1m',
        type: 'u128',
        description: 'Reward for 1,000,000 followers',
        required: true,
        defaultValue: 1000000,
      },
      {
        name: 'auto_distribute',
        type: 'bool',
        description: 'Automatically distribute rewards on milestone',
        required: true,
        defaultValue: true,
      },
    ],
  },
];

export const getTemplateById = (id: string): ContractTemplate | undefined => {
  return CONTRACT_TEMPLATES.find(template => template.id === id);
};

export const getTemplatesByType = (type: ContractTemplate['type']): ContractTemplate[] => {
  return CONTRACT_TEMPLATES.filter(template => template.type === type);
};
