/**
 * Campaign Integration E2E Tests
 * Tests integration scenarios, edge cases, and error handling
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { setupE2ETest, waitFor } from './setup';
import { mockCampaignService, Campaign } from './campaign.service.mock';

describe('Campaign Integration Tests', () => {
  setupE2ETest();

  beforeEach(() => {
    mockCampaignService.clear();
  });

  describe('Concurrent Operations', () => {
    it('should handle concurrent campaign creation', async () => {
      const promises = Array.from({ length: 5 }, (_, i) =>
        mockCampaignService.createCampaign({
          name: `Concurrent Campaign ${i}`,
          budget: 1000,
          rewardAmount: 10,
        })
      );

      const campaigns = await Promise.all(promises);
      expect(campaigns).toHaveLength(5);

      const uniqueIds = new Set(campaigns.map(c => c.id));
      expect(uniqueIds.size).toBe(5);
    });

    it('should handle concurrent participant additions', async () => {
      const campaign = await mockCampaignService.createCampaign({
        name: 'Concurrent Test',
        budget: 10000,
        rewardAmount: 10,
      });
      await mockCampaignService.startCampaign(campaign.id);

      const promises = Array.from({ length: 10 }, (_, i) =>
        mockCampaignService.addParticipant(campaign.id, {
          publicKey: `GTEST_CONCURRENT_${i}`,
          username: `user${i}`,
        })
      );

      const participants = await Promise.all(promises);
      expect(participants).toHaveLength(10);

      const updated = await mockCampaignService.getCampaign(campaign.id);
      expect(updated?.participants).toHaveLength(10);
    });

    it('should handle concurrent reward distributions', async () => {
      const campaign = await mockCampaignService.createCampaign({
        name: 'Concurrent Rewards',
        budget: 10000,
        rewardAmount: 10,
      });
      await mockCampaignService.startCampaign(campaign.id);

      const batch1 = ['GTEST_A1', 'GTEST_A2', 'GTEST_A3'];
      const batch2 = ['GTEST_B1', 'GTEST_B2', 'GTEST_B3'];

      const [rewards1, rewards2] = await Promise.all([
        mockCampaignService.distributeRewards(campaign.id, batch1),
        mockCampaignService.distributeRewards(campaign.id, batch2),
      ]);

      expect(rewards1).toHaveLength(3);
      expect(rewards2).toHaveLength(3);

      const updated = await mockCampaignService.getCampaign(campaign.id);
      expect(updated?.totalDistributed).toBe(60);
    });
  });

  describe('Budget Management', () => {
    it('should prevent budget reduction below distributed amount', async () => {
      const campaign = await mockCampaignService.createCampaign({
        name: 'Budget Test',
        budget: 1000,
        rewardAmount: 100,
      });
      await mockCampaignService.startCampaign(campaign.id);

      await mockCampaignService.distributeRewards(campaign.id, ['GTEST_USER1']);

      await expect(
        mockCampaignService.updateCampaign(campaign.id, { budget: 50 })
      ).rejects.toThrow('Cannot reduce budget below total distributed amount');
    });

    it('should allow budget increase', async () => {
      const campaign = await mockCampaignService.createCampaign({
        name: 'Budget Increase',
        budget: 1000,
        rewardAmount: 100,
      });
      await mockCampaignService.startCampaign(campaign.id);

      const updated = await mockCampaignService.updateCampaign(campaign.id, {
        budget: 2000,
      });

      expect(updated.budget).toBe(2000);
    });

    it('should track budget utilization accurately', async () => {
      const campaign = await mockCampaignService.createCampaign({
        name: 'Budget Tracking',
        budget: 1000,
        rewardAmount: 100,
      });
      await mockCampaignService.startCampaign(campaign.id);

      // Distribute 30% of budget
      await mockCampaignService.distributeRewards(campaign.id, [
        'GTEST_1',
        'GTEST_2',
        'GTEST_3',
      ]);

      const stats = await mockCampaignService.getCampaignStats(campaign.id);
      expect(stats.budgetUtilization).toBe(30);
      expect(stats.budgetRemaining).toBe(700);
    });

    it('should prevent over-distribution', async () => {
      const campaign = await mockCampaignService.createCampaign({
        name: 'Over Distribution Test',
        budget: 250,
        rewardAmount: 100,
      });
      await mockCampaignService.startCampaign(campaign.id);

      // First distribution: 200
      await mockCampaignService.distributeRewards(campaign.id, ['GTEST_1', 'GTEST_2']);

      // Second distribution would exceed budget
      await expect(
        mockCampaignService.distributeRewards(campaign.id, ['GTEST_3', 'GTEST_4'])
      ).rejects.toThrow('Insufficient budget');
    });
  });

  describe('Campaign State Transitions', () => {
    it('should enforce valid state transitions', async () => {
      const campaign = await mockCampaignService.createCampaign({
        name: 'State Test',
        budget: 1000,
        rewardAmount: 10,
      });

      // draft -> active
      await mockCampaignService.startCampaign(campaign.id);
      let current = await mockCampaignService.getCampaign(campaign.id);
      expect(current?.status).toBe('active');

      // active -> paused
      await mockCampaignService.pauseCampaign(campaign.id);
      current = await mockCampaignService.getCampaign(campaign.id);
      expect(current?.status).toBe('paused');

      // paused -> active
      await mockCampaignService.startCampaign(campaign.id);
      current = await mockCampaignService.getCampaign(campaign.id);
      expect(current?.status).toBe('active');

      // active -> completed
      await mockCampaignService.completeCampaign(campaign.id);
      current = await mockCampaignService.getCampaign(campaign.id);
      expect(current?.status).toBe('completed');
    });

    it('should prevent invalid state transitions', async () => {
      const campaign = await mockCampaignService.createCampaign({
        name: 'Invalid Transition',
        budget: 1000,
        rewardAmount: 10,
      });

      // Cannot pause draft campaign
      await expect(
        mockCampaignService.pauseCampaign(campaign.id)
      ).rejects.toThrow();

      await mockCampaignService.startCampaign(campaign.id);
      await mockCampaignService.completeCampaign(campaign.id);

      // Cannot start completed campaign
      await expect(
        mockCampaignService.startCampaign(campaign.id)
      ).rejects.toThrow();
    });
  });

  describe('Reward Processing Edge Cases', () => {
    it('should handle processing failures and retries', async () => {
      const campaign = await mockCampaignService.createCampaign({
        name: 'Retry Test',
        budget: 1000,
        rewardAmount: 10,
      });
      await mockCampaignService.startCampaign(campaign.id);

      const rewards = await mockCampaignService.distributeRewards(campaign.id, [
        'GTEST_RETRY',
      ]);

      const processed = await mockCampaignService.processReward(rewards[0].id);

      if (processed.status === 'failed') {
        // In real scenario, would implement retry logic
        expect(processed.failureReason).toBeDefined();
      } else {
        expect(processed.status).toBe('completed');
        expect(processed.transactionHash).toBeDefined();
      }
    });

    it('should maintain reward integrity during processing', async () => {
      const campaign = await mockCampaignService.createCampaign({
        name: 'Integrity Test',
        budget: 1000,
        rewardAmount: 50,
      });
      await mockCampaignService.startCampaign(campaign.id);

      const rewards = await mockCampaignService.distributeRewards(campaign.id, [
        'GTEST_INTEGRITY',
      ]);

      const originalReward = rewards[0];
      const processed = await mockCampaignService.processReward(originalReward.id);

      // Verify reward data integrity
      expect(processed.id).toBe(originalReward.id);
      expect(processed.campaignId).toBe(originalReward.campaignId);
      expect(processed.recipientPublicKey).toBe(originalReward.recipientPublicKey);
      expect(processed.amount).toBe(originalReward.amount);
    });
  });

  describe('Multi-Campaign Scenarios', () => {
    it('should handle multiple active campaigns', async () => {
      const campaigns = await Promise.all([
        mockCampaignService.createCampaign({
          name: 'Campaign A',
          budget: 1000,
          rewardAmount: 10,
        }),
        mockCampaignService.createCampaign({
          name: 'Campaign B',
          budget: 2000,
          rewardAmount: 20,
        }),
        mockCampaignService.createCampaign({
          name: 'Campaign C',
          budget: 3000,
          rewardAmount: 30,
        }),
      ]);

      for (const campaign of campaigns) {
        await mockCampaignService.startCampaign(campaign.id);
      }

      const allCampaigns = await mockCampaignService.getAllCampaigns();
      const activeCampaigns = allCampaigns.filter(c => c.status === 'active');
      expect(activeCampaigns).toHaveLength(3);
    });

    it('should isolate campaign data', async () => {
      const campaign1 = await mockCampaignService.createCampaign({
        name: 'Isolated 1',
        budget: 1000,
        rewardAmount: 10,
      });
      const campaign2 = await mockCampaignService.createCampaign({
        name: 'Isolated 2',
        budget: 2000,
        rewardAmount: 20,
      });

      await mockCampaignService.startCampaign(campaign1.id);
      await mockCampaignService.startCampaign(campaign2.id);

      await mockCampaignService.addParticipant(campaign1.id, {
        publicKey: 'GTEST_C1_USER',
        username: 'c1user',
      });

      await mockCampaignService.addParticipant(campaign2.id, {
        publicKey: 'GTEST_C2_USER',
        username: 'c2user',
      });

      const c1 = await mockCampaignService.getCampaign(campaign1.id);
      const c2 = await mockCampaignService.getCampaign(campaign2.id);

      expect(c1?.participants).toHaveLength(1);
      expect(c2?.participants).toHaveLength(1);
      expect(c1?.participants[0].publicKey).not.toBe(c2?.participants[0].publicKey);
    });

    it('should allow user to participate in multiple campaigns', async () => {
      const userKey = 'GTEST_MULTI_USER';

      const campaigns = await Promise.all([
        mockCampaignService.createCampaign({
          name: 'Multi Campaign 1',
          budget: 1000,
          rewardAmount: 10,
        }),
        mockCampaignService.createCampaign({
          name: 'Multi Campaign 2',
          budget: 2000,
          rewardAmount: 20,
        }),
      ]);

      for (const campaign of campaigns) {
        await mockCampaignService.startCampaign(campaign.id);
        await mockCampaignService.addParticipant(campaign.id, {
          publicKey: userKey,
          username: 'multiuser',
        });
      }

      // User should be in both campaigns
      const c1 = await mockCampaignService.getCampaign(campaigns[0].id);
      const c2 = await mockCampaignService.getCampaign(campaigns[1].id);

      expect(c1?.participants.some(p => p.publicKey === userKey)).toBe(true);
      expect(c2?.participants.some(p => p.publicKey === userKey)).toBe(true);
    });
  });

  describe('Performance and Scalability', () => {
    it('should handle large number of participants', async () => {
      const campaign = await mockCampaignService.createCampaign({
        name: 'Large Scale Test',
        budget: 100000,
        rewardAmount: 10,
      });
      await mockCampaignService.startCampaign(campaign.id);

      const participantCount = 100;
      const participants = [];

      for (let i = 0; i < participantCount; i++) {
        const participant = await mockCampaignService.addParticipant(campaign.id, {
          publicKey: `GTEST_SCALE_${i}`,
          username: `scaleuser${i}`,
        });
        participants.push(participant);
      }

      const updated = await mockCampaignService.getCampaign(campaign.id);
      expect(updated?.participants).toHaveLength(participantCount);
    });

    it('should handle batch reward distribution efficiently', async () => {
      const campaign = await mockCampaignService.createCampaign({
        name: 'Batch Distribution',
        budget: 50000,
        rewardAmount: 10,
      });
      await mockCampaignService.startCampaign(campaign.id);

      const batchSize = 50;
      const recipientKeys = Array.from(
        { length: batchSize },
        (_, i) => `GTEST_BATCH_${i}`
      );

      const startTime = Date.now();
      const rewards = await mockCampaignService.distributeRewards(
        campaign.id,
        recipientKeys
      );
      const duration = Date.now() - startTime;

      expect(rewards).toHaveLength(batchSize);
      expect(duration).toBeLessThan(1000); // Should complete in under 1 second
    });
  });

  describe('Data Consistency', () => {
    it('should maintain consistency across operations', async () => {
      const campaign = await mockCampaignService.createCampaign({
        name: 'Consistency Test',
        budget: 5000,
        rewardAmount: 100,
      });
      await mockCampaignService.startCampaign(campaign.id);

      // Add participants
      for (let i = 0; i < 5; i++) {
        await mockCampaignService.addParticipant(campaign.id, {
          publicKey: `GTEST_CONS_${i}`,
          username: `consuser${i}`,
        });
      }

      // Distribute rewards
      const rewards = await mockCampaignService.distributeRewards(campaign.id, [
        'GTEST_CONS_0',
        'GTEST_CONS_1',
      ]);

      // Process rewards
      await Promise.all(rewards.map(r => mockCampaignService.processReward(r.id)));

      // Verify consistency
      const stats = await mockCampaignService.getCampaignStats(campaign.id);
      const campaignData = await mockCampaignService.getCampaign(campaign.id);

      expect(stats.totalParticipants).toBe(campaignData?.participants.length);
      expect(stats.totalDistributed).toBe(campaignData?.totalDistributed);
      expect(stats.totalRewards).toBe(rewards.length);
    });
  });
});
