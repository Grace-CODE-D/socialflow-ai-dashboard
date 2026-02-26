/**
 * Mock Campaign Service for E2E Testing
 * Simulates campaign creation, management, and reward distribution
 */

import { generateMockCampaign, generateMockParticipant, generateMockReward } from './setup';

export interface Campaign {
  id: string;
  name: string;
  description: string;
  budget: number;
  rewardAmount: number;
  startDate: string;
  endDate: string;
  status: 'draft' | 'active' | 'paused' | 'completed' | 'cancelled';
  participants: Participant[];
  totalDistributed: number;
  createdAt: string;
  updatedAt?: string;
  assetCode?: string;
  issuerPublicKey?: string;
  rules?: CampaignRules;
}

export interface Participant {
  id: string;
  publicKey: string;
  username: string;
  engagementScore: number;
  rewardsClaimed: number;
  joinedAt: string;
}

export interface Reward {
  id: string;
  campaignId: string;
  recipientPublicKey: string;
  amount: number;
  assetCode: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  transactionHash: string | null;
  createdAt: string;
  claimedAt: string | null;
  failureReason?: string;
}

export interface CampaignRules {
  minEngagement: number;
  maxRewardsPerUser: number;
  requireVerification: boolean;
  eligibilityCriteria: string[];
}

export class MockCampaignService {
  private campaigns: Map<string, Campaign> = new Map();
  private rewards: Map<string, Reward> = new Map();
  private participants: Map<string, Participant> = new Map();

  /**
   * Create a new campaign
   */
  async createCampaign(data: Partial<Campaign>): Promise<Campaign> {
    // Validate required fields
    if (!data.name) throw new Error('Campaign name is required');
    if (!data.budget || data.budget <= 0) throw new Error('Valid budget is required');
    if (!data.rewardAmount || data.rewardAmount <= 0) throw new Error('Valid reward amount is required');

    const campaign: Campaign = {
      ...generateMockCampaign(),
      ...data,
      id: data.id || 'campaign_' + Date.now(),
      status: data.status || 'draft',
      participants: [],
      totalDistributed: 0,
      createdAt: new Date().toISOString(),
    } as Campaign;

    // Validate budget can cover at least one reward
    if (campaign.budget < campaign.rewardAmount) {
      throw new Error('Budget must be at least equal to reward amount');
    }

    this.campaigns.set(campaign.id, campaign);
    return campaign;
  }

  /**
   * Get campaign by ID
   */
  async getCampaign(campaignId: string): Promise<Campaign | null> {
    return this.campaigns.get(campaignId) || null;
  }

  /**
   * Get all campaigns
   */
  async getAllCampaigns(): Promise<Campaign[]> {
    return Array.from(this.campaigns.values());
  }

  /**
   * Update campaign
   */
  async updateCampaign(campaignId: string, updates: Partial<Campaign>): Promise<Campaign> {
    const campaign = this.campaigns.get(campaignId);
    if (!campaign) throw new Error('Campaign not found');

    // Prevent updating certain fields if campaign is active
    if (campaign.status === 'active') {
      if (updates.budget && updates.budget < campaign.totalDistributed) {
        throw new Error('Cannot reduce budget below total distributed amount');
      }
    }

    const updatedCampaign = {
      ...campaign,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    this.campaigns.set(campaignId, updatedCampaign);
    return updatedCampaign;
  }

  /**
   * Delete campaign
   */
  async deleteCampaign(campaignId: string): Promise<boolean> {
    const campaign = this.campaigns.get(campaignId);
    if (!campaign) throw new Error('Campaign not found');

    // Prevent deletion of active campaigns with participants
    if (campaign.status === 'active' && campaign.participants.length > 0) {
      throw new Error('Cannot delete active campaign with participants');
    }

    this.campaigns.delete(campaignId);
    return true;
  }

  /**
   * Start campaign
   */
  async startCampaign(campaignId: string): Promise<Campaign> {
    const campaign = this.campaigns.get(campaignId);
    if (!campaign) throw new Error('Campaign not found');

    if (campaign.status !== 'draft' && campaign.status !== 'paused') {
      throw new Error('Can only start draft or paused campaigns');
    }

    campaign.status = 'active';
    campaign.updatedAt = new Date().toISOString();
    
    this.campaigns.set(campaignId, campaign);
    return campaign;
  }

  /**
   * Pause campaign
   */
  async pauseCampaign(campaignId: string): Promise<Campaign> {
    const campaign = this.campaigns.get(campaignId);
    if (!campaign) throw new Error('Campaign not found');

    if (campaign.status !== 'active') {
      throw new Error('Can only pause active campaigns');
    }

    campaign.status = 'paused';
    campaign.updatedAt = new Date().toISOString();
    
    this.campaigns.set(campaignId, campaign);
    return campaign;
  }

  /**
   * Complete campaign
   */
  async completeCampaign(campaignId: string): Promise<Campaign> {
    const campaign = this.campaigns.get(campaignId);
    if (!campaign) throw new Error('Campaign not found');

    campaign.status = 'completed';
    campaign.updatedAt = new Date().toISOString();
    
    this.campaigns.set(campaignId, campaign);
    return campaign;
  }

  /**
   * Add participant to campaign
   */
  async addParticipant(campaignId: string, participantData: Partial<Participant>): Promise<Participant> {
    const campaign = this.campaigns.get(campaignId);
    if (!campaign) throw new Error('Campaign not found');

    if (campaign.status !== 'active') {
      throw new Error('Can only add participants to active campaigns');
    }

    const participant: Participant = {
      ...generateMockParticipant(),
      ...participantData,
      id: participantData.id || 'participant_' + Date.now(),
      joinedAt: new Date().toISOString(),
    } as Participant;

    // Check if participant already exists
    const existingParticipant = campaign.participants.find(
      p => p.publicKey === participant.publicKey
    );
    if (existingParticipant) {
      throw new Error('Participant already exists in campaign');
    }

    campaign.participants.push(participant);
    this.participants.set(participant.id, participant);
    this.campaigns.set(campaignId, campaign);

    return participant;
  }

  /**
   * Distribute rewards to participants
   */
  async distributeRewards(campaignId: string, recipientPublicKeys: string[]): Promise<Reward[]> {
    const campaign = this.campaigns.get(campaignId);
    if (!campaign) throw new Error('Campaign not found');

    if (campaign.status !== 'active') {
      throw new Error('Can only distribute rewards for active campaigns');
    }

    const rewards: Reward[] = [];
    const totalAmount = recipientPublicKeys.length * campaign.rewardAmount;

    // Check if budget is sufficient
    if (campaign.totalDistributed + totalAmount > campaign.budget) {
      throw new Error('Insufficient budget for reward distribution');
    }

    for (const publicKey of recipientPublicKeys) {
      const reward: Reward = {
        ...generateMockReward(),
        campaignId,
        recipientPublicKey: publicKey,
        amount: campaign.rewardAmount,
        assetCode: campaign.assetCode || 'SOCIAL',
        status: 'pending',
        createdAt: new Date().toISOString(),
      };

      this.rewards.set(reward.id, reward);
      rewards.push(reward);
    }

    // Update campaign total distributed
    campaign.totalDistributed += totalAmount;
    this.campaigns.set(campaignId, campaign);

    return rewards;
  }

  /**
   * Process reward (simulate blockchain transaction)
   */
  async processReward(rewardId: string): Promise<Reward> {
    const reward = this.rewards.get(rewardId);
    if (!reward) throw new Error('Reward not found');

    if (reward.status !== 'pending') {
      throw new Error('Can only process pending rewards');
    }

    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 100));

    // Simulate 95% success rate
    const isSuccessful = Math.random() > 0.05;

    if (isSuccessful) {
      reward.status = 'processing';
      reward.transactionHash = 'tx_' + Date.now() + '_' + Math.random().toString(36).substring(2, 15);
      
      // Simulate blockchain confirmation
      await new Promise(resolve => setTimeout(resolve, 50));
      
      reward.status = 'completed';
    } else {
      reward.status = 'failed';
      reward.failureReason = 'Simulated transaction failure';
    }

    this.rewards.set(rewardId, reward);
    return reward;
  }

  /**
   * Claim reward
   */
  async claimReward(rewardId: string, claimerPublicKey: string): Promise<Reward> {
    const reward = this.rewards.get(rewardId);
    if (!reward) throw new Error('Reward not found');

    if (reward.recipientPublicKey !== claimerPublicKey) {
      throw new Error('Only the recipient can claim this reward');
    }

    if (reward.status !== 'completed') {
      throw new Error('Can only claim completed rewards');
    }

    if (reward.claimedAt) {
      throw new Error('Reward already claimed');
    }

    reward.claimedAt = new Date().toISOString();
    this.rewards.set(rewardId, reward);

    // Update participant rewards claimed
    const participant = Array.from(this.participants.values()).find(
      p => p.publicKey === claimerPublicKey
    );
    if (participant) {
      participant.rewardsClaimed += reward.amount;
      this.participants.set(participant.id, participant);
    }

    return reward;
  }

  /**
   * Get rewards for campaign
   */
  async getCampaignRewards(campaignId: string): Promise<Reward[]> {
    return Array.from(this.rewards.values()).filter(
      reward => reward.campaignId === campaignId
    );
  }

  /**
   * Get rewards for recipient
   */
  async getRecipientRewards(publicKey: string): Promise<Reward[]> {
    return Array.from(this.rewards.values()).filter(
      reward => reward.recipientPublicKey === publicKey
    );
  }

  /**
   * Get campaign statistics
   */
  async getCampaignStats(campaignId: string) {
    const campaign = this.campaigns.get(campaignId);
    if (!campaign) throw new Error('Campaign not found');

    const rewards = await this.getCampaignRewards(campaignId);
    
    return {
      totalParticipants: campaign.participants.length,
      totalRewards: rewards.length,
      totalDistributed: campaign.totalDistributed,
      pendingRewards: rewards.filter(r => r.status === 'pending').length,
      completedRewards: rewards.filter(r => r.status === 'completed').length,
      failedRewards: rewards.filter(r => r.status === 'failed').length,
      claimedRewards: rewards.filter(r => r.claimedAt !== null).length,
      budgetRemaining: campaign.budget - campaign.totalDistributed,
      budgetUtilization: (campaign.totalDistributed / campaign.budget) * 100,
    };
  }

  /**
   * Clear all data (for testing)
   */
  clear(): void {
    this.campaigns.clear();
    this.rewards.clear();
    this.participants.clear();
  }
}

// Export singleton instance for tests
export const mockCampaignService = new MockCampaignService();
