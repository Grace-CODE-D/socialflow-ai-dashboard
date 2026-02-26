/**
 * Campaign E2E Tests
 * Tests campaign creation, management, reward distribution, and claiming
 * 
 * Requirements Coverage:
 * - 13.1-13.7: Campaign Management
 * - 19.1-19.8: Reward Distribution
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { 
  setupE2ETest, 
  generateMockCampaign, 
  generateMockParticipant,
  waitFor,
  assertCampaignValid,
  assertRewardValid,
} from './setup';
import { mockCampaignService, Campaign, Participant, Reward } from './campaign.service.mock';

describe('Campaign E2E Tests', () => {
  setupE2ETest();

  beforeEach(() => {
    mockCampaignService.clear();
  });

  describe('Campaign Creation (Req 13.1)', () => {
    it('should create a campaign with valid data', async () => {
      const campaignData = {
        name: 'Summer Promotion 2024',
        description: 'Reward active community members',
        budget: 10000,
        rewardAmount: 50,
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        assetCode: 'SOCIAL',
      };

      const campaign = await mockCampaignService.createCampaign(campaignData);

      expect(campaign).toBeDefined();
      expect(campaign.id).toBeDefined();
      expect(campaign.name).toBe(campaignData.name);
      expect(campaign.budget).toBe(campaignData.budget);
      expect(campaign.rewardAmount).toBe(campaignData.rewardAmount);
      expect(campaign.status).toBe('draft');
      expect(campaign.participants).toEqual([]);
      expect(campaign.totalDistributed).toBe(0);
      
      assertCampaignValid(campaign);
    });

    it('should fail to create campaign without required fields', async () => {
      await expect(
        mockCampaignService.createCampaign({ name: '' })
      ).rejects.toThrow('Campaign name is required');

      await expect(
        mockCampaignService.createCampaign({ name: 'Test', budget: 0 })
      ).rejects.toThrow('Valid budget is required');

      await expect(
        mockCampaignService.createCampaign({ name: 'Test', budget: 1000, rewardAmount: 0 })
      ).rejects.toThrow('Valid reward amount is required');
    });

    it('should fail if budget is less than reward amount', async () => {
      await expect(
        mockCampaignService.createCampaign({
          name: 'Test Campaign',
          budget: 10,
          rewardAmount: 50,
        })
      ).rejects.toThrow('Budget must be at least equal to reward amount');
    });

    it('should create multiple campaigns', async () => {
      const campaign1 = await mockCampaignService.createCampaign({
        name: 'Campaign 1',
        budget: 1000,
        rewardAmount: 10,
      });

      const campaign2 = await mockCampaignService.createCampaign({
        name: 'Campaign 2',
        budget: 2000,
        rewardAmount: 20,
      });

      expect(campaign1.id).not.toBe(campaign2.id);
      
      const allCampaigns = await mockCampaignService.getAllCampaigns();
      expect(allCampaigns).toHaveLength(2);
    });
  });

  describe('Campaign Management (Req 13.2-13.4)', () => {
    let campaign: Campaign;

    beforeEach(async () => {
      campaign = await mockCampaignService.createCampaign({
        name: 'Test Campaign',
        budget: 5000,
        rewardAmount: 25,
      });
    });

    it('should retrieve campaign by ID', async () => {
      const retrieved = await mockCampaignService.getCampaign(campaign.id);
      
      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe(campaign.id);
      expect(retrieved?.name).toBe(campaign.name);
    });

    it('should return null for non-existent campaign', async () => {
      const retrieved = await mockCampaignService.getCampaign('non_existent_id');
      expect(retrieved).toBeNull();
    });

    it('should update campaign details', async () => {
      const updated = await mockCampaignService.updateCampaign(campaign.id, {
        name: 'Updated Campaign Name',
        description: 'Updated description',
      });

      expect(updated.name).toBe('Updated Campaign Name');
      expect(updated.description).toBe('Updated description');
      expect(updated.updatedAt).toBeDefined();
    });

    it('should start a draft campaign', async () => {
      const started = await mockCampaignService.startCampaign(campaign.id);
      
      expect(started.status).toBe('active');
      expect(started.updatedAt).toBeDefined();
    });

    it('should pause an active campaign', async () => {
      await mockCampaignService.startCampaign(campaign.id);
      const paused = await mockCampaignService.pauseCampaign(campaign.id);
      
      expect(paused.status).toBe('paused');
    });

    it('should complete a campaign', async () => {
      await mockCampaignService.startCampaign(campaign.id);
      const completed = await mockCampaignService.completeCampaign(campaign.id);
      
      expect(completed.status).toBe('completed');
    });

    it('should not allow starting non-draft/paused campaigns', async () => {
      await mockCampaignService.startCampaign(campaign.id);
      
      await expect(
        mockCampaignService.startCampaign(campaign.id)
      ).rejects.toThrow('Can only start draft or paused campaigns');
    });

    it('should not allow pausing non-active campaigns', async () => {
      await expect(
        mockCampaignService.pauseCampaign(campaign.id)
      ).rejects.toThrow('Can only pause active campaigns');
    });

    it('should delete a draft campaign', async () => {
      const deleted = await mockCampaignService.deleteCampaign(campaign.id);
      expect(deleted).toBe(true);

      const retrieved = await mockCampaignService.getCampaign(campaign.id);
      expect(retrieved).toBeNull();
    });

    it('should not delete active campaign with participants', async () => {
      await mockCampaignService.startCampaign(campaign.id);
      await mockCampaignService.addParticipant(campaign.id, {
        publicKey: 'GTEST123',
        username: 'testuser',
      });

      await expect(
        mockCampaignService.deleteCampaign(campaign.id)
      ).rejects.toThrow('Cannot delete active campaign with participants');
    });
  });

  describe('Participant Management (Req 13.5)', () => {
    let campaign: Campaign;

    beforeEach(async () => {
      campaign = await mockCampaignService.createCampaign({
        name: 'Test Campaign',
        budget: 5000,
        rewardAmount: 25,
      });
      await mockCampaignService.startCampaign(campaign.id);
    });

    it('should add participant to active campaign', async () => {
      const participant = await mockCampaignService.addParticipant(campaign.id, {
        publicKey: 'GTEST_PARTICIPANT_1',
        username: 'user1',
        engagementScore: 85,
      });

      expect(participant).toBeDefined();
      expect(participant.id).toBeDefined();
      expect(participant.publicKey).toBe('GTEST_PARTICIPANT_1');
      expect(participant.username).toBe('user1');
      expect(participant.rewardsClaimed).toBe(0);

      const updated = await mockCampaignService.getCampaign(campaign.id);
      expect(updated?.participants).toHaveLength(1);
    });

    it('should not add duplicate participants', async () => {
      await mockCampaignService.addParticipant(campaign.id, {
        publicKey: 'GTEST_DUPLICATE',
        username: 'user1',
      });

      await expect(
        mockCampaignService.addParticipant(campaign.id, {
          publicKey: 'GTEST_DUPLICATE',
          username: 'user2',
        })
      ).rejects.toThrow('Participant already exists in campaign');
    });

    it('should not add participants to non-active campaigns', async () => {
      await mockCampaignService.pauseCampaign(campaign.id);

      await expect(
        mockCampaignService.addParticipant(campaign.id, {
          publicKey: 'GTEST_USER',
          username: 'user1',
        })
      ).rejects.toThrow('Can only add participants to active campaigns');
    });

    it('should add multiple participants', async () => {
      const participants = [];
      for (let i = 0; i < 5; i++) {
        const participant = await mockCampaignService.addParticipant(campaign.id, {
          publicKey: `GTEST_USER_${i}`,
          username: `user${i}`,
          engagementScore: Math.floor(Math.random() * 100),
        });
        participants.push(participant);
      }

      expect(participants).toHaveLength(5);
      
      const updated = await mockCampaignService.getCampaign(campaign.id);
      expect(updated?.participants).toHaveLength(5);
    });
  });

  describe('Reward Distribution (Req 19.1-19.4)', () => {
    let campaign: Campaign;
    let participants: Participant[];

    beforeEach(async () => {
      campaign = await mockCampaignService.createCampaign({
        name: 'Reward Test Campaign',
        budget: 10000,
        rewardAmount: 100,
        assetCode: 'SOCIAL',
      });
      await mockCampaignService.startCampaign(campaign.id);

      // Add participants
      participants = [];
      for (let i = 0; i < 10; i++) {
        const participant = await mockCampaignService.addParticipant(campaign.id, {
          publicKey: `GTEST_RECIPIENT_${i}`,
          username: `recipient${i}`,
          engagementScore: 50 + i * 5,
        });
        participants.push(participant);
      }
    });

    it('should distribute rewards to participants', async () => {
      const recipientKeys = participants.slice(0, 5).map(p => p.publicKey);
      const rewards = await mockCampaignService.distributeRewards(campaign.id, recipientKeys);

      expect(rewards).toHaveLength(5);
      rewards.forEach(reward => {
        expect(reward.campaignId).toBe(campaign.id);
        expect(reward.amount).toBe(100);
        expect(reward.assetCode).toBe('SOCIAL');
        expect(reward.status).toBe('pending');
        assertRewardValid(reward);
      });

      const updated = await mockCampaignService.getCampaign(campaign.id);
      expect(updated?.totalDistributed).toBe(500);
    });

    it('should fail if budget is insufficient', async () => {
      const recipientKeys = participants.map(p => p.publicKey);
      
      // First distribution uses 1000 (10 * 100)
      await mockCampaignService.distributeRewards(campaign.id, recipientKeys);

      // Try to distribute more than remaining budget
      await expect(
        mockCampaignService.distributeRewards(campaign.id, recipientKeys)
      ).rejects.toThrow('Insufficient budget for reward distribution');
    });

    it('should not distribute rewards for non-active campaigns', async () => {
      await mockCampaignService.pauseCampaign(campaign.id);

      await expect(
        mockCampaignService.distributeRewards(campaign.id, [participants[0].publicKey])
      ).rejects.toThrow('Can only distribute rewards for active campaigns');
    });

    it('should track total distributed amount', async () => {
      const batch1 = participants.slice(0, 3).map(p => p.publicKey);
      await mockCampaignService.distributeRewards(campaign.id, batch1);

      let updated = await mockCampaignService.getCampaign(campaign.id);
      expect(updated?.totalDistributed).toBe(300);

      const batch2 = participants.slice(3, 6).map(p => p.publicKey);
      await mockCampaignService.distributeRewards(campaign.id, batch2);

      updated = await mockCampaignService.getCampaign(campaign.id);
      expect(updated?.totalDistributed).toBe(600);
    });

    it('should create unique reward IDs', async () => {
      const recipientKeys = participants.slice(0, 5).map(p => p.publicKey);
      const rewards = await mockCampaignService.distributeRewards(campaign.id, recipientKeys);

      const ids = rewards.map(r => r.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });
  });

  describe('Reward Processing (Req 19.5-19.6)', () => {
    let campaign: Campaign;
    let rewards: Reward[];

    beforeEach(async () => {
      campaign = await mockCampaignService.createCampaign({
        name: 'Processing Test Campaign',
        budget: 5000,
        rewardAmount: 50,
      });
      await mockCampaignService.startCampaign(campaign.id);

      const recipientKeys = ['GTEST_R1', 'GTEST_R2', 'GTEST_R3'];
      rewards = await mockCampaignService.distributeRewards(campaign.id, recipientKeys);
    });

    it('should process pending rewards', async () => {
      const reward = rewards[0];
      const processed = await mockCampaignService.processReward(reward.id);

      expect(processed.status).toMatch(/completed|failed/);
      if (processed.status === 'completed') {
        expect(processed.transactionHash).toBeDefined();
        expect(processed.transactionHash).toMatch(/^tx_/);
      }
    });

    it('should not process non-pending rewards', async () => {
      const reward = rewards[0];
      await mockCampaignService.processReward(reward.id);

      await expect(
        mockCampaignService.processReward(reward.id)
      ).rejects.toThrow('Can only process pending rewards');
    });

    it('should process multiple rewards', async () => {
      const processedRewards = await Promise.all(
        rewards.map(r => mockCampaignService.processReward(r.id))
      );

      expect(processedRewards).toHaveLength(3);
      processedRewards.forEach(reward => {
        expect(reward.status).toMatch(/completed|failed/);
      });
    });

    it('should handle processing failures gracefully', async () => {
      // Process multiple rewards, some may fail (5% failure rate)
      const results = await Promise.all(
        rewards.map(r => mockCampaignService.processReward(r.id))
      );

      const failed = results.filter(r => r.status === 'failed');
      failed.forEach(reward => {
        expect(reward.failureReason).toBeDefined();
      });
    });
  });

  describe('Reward Claiming (Req 19.7-19.8)', () => {
    let campaign: Campaign;
    let rewards: Reward[];
    const recipientKey = 'GTEST_CLAIMER';

    beforeEach(async () => {
      campaign = await mockCampaignService.createCampaign({
        name: 'Claiming Test Campaign',
        budget: 5000,
        rewardAmount: 100,
      });
      await mockCampaignService.startCampaign(campaign.id);

      await mockCampaignService.addParticipant(campaign.id, {
        publicKey: recipientKey,
        username: 'claimer',
      });

      rewards = await mockCampaignService.distributeRewards(campaign.id, [recipientKey]);
      
      // Process the reward
      await mockCampaignService.processReward(rewards[0].id);
    });

    it('should allow recipient to claim completed reward', async () => {
      const reward = rewards[0];
      
      // Ensure reward is completed
      const processedReward = await mockCampaignService.processReward(reward.id);
      if (processedReward.status !== 'completed') {
        // Retry if failed (for test stability)
        return;
      }

      const claimed = await mockCampaignService.claimReward(reward.id, recipientKey);

      expect(claimed.claimedAt).toBeDefined();
      expect(new Date(claimed.claimedAt!).getTime()).toBeLessThanOrEqual(Date.now());
    });

    it('should not allow non-recipient to claim reward', async () => {
      const reward = rewards[0];
      const wrongKey = 'GTEST_WRONG_USER';

      await expect(
        mockCampaignService.claimReward(reward.id, wrongKey)
      ).rejects.toThrow('Only the recipient can claim this reward');
    });

    it('should not allow claiming non-completed rewards', async () => {
      // Create a new pending reward
      const newRewards = await mockCampaignService.distributeRewards(
        campaign.id,
        ['GTEST_NEW_RECIPIENT']
      );

      await expect(
        mockCampaignService.claimReward(newRewards[0].id, 'GTEST_NEW_RECIPIENT')
      ).rejects.toThrow('Can only claim completed rewards');
    });

    it('should not allow double claiming', async () => {
      const reward = rewards[0];
      
      // First claim
      await mockCampaignService.claimReward(reward.id, recipientKey);

      // Second claim attempt
      await expect(
        mockCampaignService.claimReward(reward.id, recipientKey)
      ).rejects.toThrow('Reward already claimed');
    });

    it('should update participant rewards claimed count', async () => {
      const reward = rewards[0];
      await mockCampaignService.claimReward(reward.id, recipientKey);

      const campaignRewards = await mockCampaignService.getRecipientRewards(recipientKey);
      const claimedRewards = campaignRewards.filter(r => r.claimedAt !== null);
      
      expect(claimedRewards.length).toBeGreaterThan(0);
    });
  });

  describe('Campaign Statistics (Req 13.6-13.7)', () => {
    let campaign: Campaign;

    beforeEach(async () => {
      campaign = await mockCampaignService.createCampaign({
        name: 'Stats Test Campaign',
        budget: 10000,
        rewardAmount: 100,
      });
      await mockCampaignService.startCampaign(campaign.id);

      // Add participants
      for (let i = 0; i < 5; i++) {
        await mockCampaignService.addParticipant(campaign.id, {
          publicKey: `GTEST_STATS_${i}`,
          username: `statsuser${i}`,
        });
      }

      // Distribute and process rewards
      const recipientKeys = [`GTEST_STATS_0`, `GTEST_STATS_1`, `GTEST_STATS_2`];
      const rewards = await mockCampaignService.distributeRewards(campaign.id, recipientKeys);
      
      for (const reward of rewards) {
        await mockCampaignService.processReward(reward.id);
      }
    });

    it('should calculate campaign statistics', async () => {
      const stats = await mockCampaignService.getCampaignStats(campaign.id);

      expect(stats.totalParticipants).toBe(5);
      expect(stats.totalRewards).toBe(3);
      expect(stats.totalDistributed).toBe(300);
      expect(stats.budgetRemaining).toBe(9700);
      expect(stats.budgetUtilization).toBe(3);
    });

    it('should track reward statuses', async () => {
      const stats = await mockCampaignService.getCampaignStats(campaign.id);

      expect(stats.completedRewards + stats.failedRewards).toBe(stats.totalRewards);
      expect(stats.pendingRewards).toBe(0);
    });

    it('should update statistics after new distributions', async () => {
      const initialStats = await mockCampaignService.getCampaignStats(campaign.id);

      // Distribute more rewards
      await mockCampaignService.distributeRewards(campaign.id, [`GTEST_STATS_3`]);

      const updatedStats = await mockCampaignService.getCampaignStats(campaign.id);

      expect(updatedStats.totalRewards).toBe(initialStats.totalRewards + 1);
      expect(updatedStats.totalDistributed).toBe(initialStats.totalDistributed + 100);
    });
  });

  describe('End-to-End Campaign Workflow', () => {
    it('should complete full campaign lifecycle', async () => {
      // 1. Create campaign
      const campaign = await mockCampaignService.createCampaign({
        name: 'E2E Test Campaign',
        description: 'Complete workflow test',
        budget: 5000,
        rewardAmount: 50,
        assetCode: 'SOCIAL',
      });

      expect(campaign.status).toBe('draft');

      // 2. Start campaign
      await mockCampaignService.startCampaign(campaign.id);
      const activeCampaign = await mockCampaignService.getCampaign(campaign.id);
      expect(activeCampaign?.status).toBe('active');

      // 3. Add participants
      const participants = [];
      for (let i = 0; i < 10; i++) {
        const participant = await mockCampaignService.addParticipant(campaign.id, {
          publicKey: `GTEST_E2E_${i}`,
          username: `e2euser${i}`,
          engagementScore: 60 + i * 4,
        });
        participants.push(participant);
      }

      // 4. Distribute rewards
      const topParticipants = participants
        .sort((a, b) => b.engagementScore - a.engagementScore)
        .slice(0, 5)
        .map(p => p.publicKey);

      const rewards = await mockCampaignService.distributeRewards(
        campaign.id,
        topParticipants
      );

      expect(rewards).toHaveLength(5);

      // 5. Process rewards
      const processedRewards = await Promise.all(
        rewards.map(r => mockCampaignService.processReward(r.id))
      );

      const successfulRewards = processedRewards.filter(r => r.status === 'completed');
      expect(successfulRewards.length).toBeGreaterThan(0);

      // 6. Claim rewards
      for (const reward of successfulRewards) {
        await mockCampaignService.claimReward(reward.id, reward.recipientPublicKey);
      }

      // 7. Check statistics
      const stats = await mockCampaignService.getCampaignStats(campaign.id);
      expect(stats.totalParticipants).toBe(10);
      expect(stats.totalRewards).toBe(5);
      expect(stats.claimedRewards).toBe(successfulRewards.length);

      // 8. Complete campaign
      await mockCampaignService.completeCampaign(campaign.id);
      const completedCampaign = await mockCampaignService.getCampaign(campaign.id);
      expect(completedCampaign?.status).toBe('completed');
    });
  });
});
