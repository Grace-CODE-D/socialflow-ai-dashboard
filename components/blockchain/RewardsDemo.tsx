import React, { useState } from 'react';
import { RewardsConfig } from './RewardsConfig';
import { RewardClaimModal } from './RewardClaimModal';
import { RewardConfig, UserReward } from '../../blockchain/types/rewards';
import { FiGift, FiSettings } from 'react-icons/fi';

export const RewardsDemo: React.FC = () => {
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'config' | 'claim'>('config');

  // Mock rewards data
  const mockRewards: UserReward[] = [
    {
      id: 'reward_1',
      campaignName: 'Summer Engagement Campaign',
      amount: '150',
      asset: { code: 'XLM', issuer: '' },
      earnedDate: Date.now() - 2 * 24 * 60 * 60 * 1000,
      claimed: false,
      eligibilityMet: true,
    },
    {
      id: 'reward_2',
      campaignName: 'Content Creator Bonus',
      amount: '500',
      asset: { code: 'XLM', issuer: '' },
      earnedDate: Date.now() - 5 * 24 * 60 * 60 * 1000,
      claimed: false,
      eligibilityMet: true,
    },
    {
      id: 'reward_3',
      campaignName: 'Early Adopter Reward',
      amount: '1000',
      asset: { code: 'XLM', issuer: '' },
      earnedDate: Date.now() - 10 * 24 * 60 * 60 * 1000,
      claimed: true,
      claimTxHash: '0x123abc...',
      eligibilityMet: true,
    },
    {
      id: 'reward_4',
      campaignName: 'VIP Campaign',
      amount: '2000',
      asset: { code: 'XLM', issuer: '' },
      earnedDate: Date.now() - 1 * 24 * 60 * 60 * 1000,
      claimed: false,
      eligibilityMet: false,
      reason: 'Minimum follower count not met (500 required)',
    },
  ];

  const handleSaveConfig = async (config: RewardConfig) => {
    console.log('Saving reward configuration:', config);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    alert('Configuration saved successfully!');
  };

  const handleClaimReward = async (rewardId: string): Promise<string> => {
    console.log('Claiming reward:', rewardId);
    // Simulate blockchain transaction
    await new Promise(resolve => setTimeout(resolve, 2000));
    return `0x${Math.random().toString(16).substr(2, 40)}`;
  };

  const unclaimedCount = mockRewards.filter(r => !r.claimed && r.eligibilityMet).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Engagement Rewards</h1>
          <p className="text-gray-400">Configure and manage your reward campaigns</p>
        </div>

        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setActiveTab('config')}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all ${
              activeTab === 'config'
                ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                : 'bg-white/10 text-gray-400 hover:bg-white/20'
            }`}
          >
            <FiSettings />
            Configure Rewards
          </button>
          
          <button
            onClick={() => setActiveTab('claim')}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all relative ${
              activeTab === 'claim'
                ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                : 'bg-white/10 text-gray-400 hover:bg-white/20'
            }`}
          >
            <FiGift />
            Claim Rewards
            {unclaimedCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                {unclaimedCount}
              </span>
            )}
          </button>
        </div>

        {activeTab === 'config' && (
          <RewardsConfig onSave={handleSaveConfig} />
        )}

        {activeTab === 'claim' && (
          <div className="text-center py-12">
            <button
              onClick={() => setShowClaimModal(true)}
              className="px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg text-xl font-bold hover:opacity-90 transition-opacity"
            >
              View & Claim Rewards ({unclaimedCount} Available)
            </button>
          </div>
        )}

        <RewardClaimModal
          isOpen={showClaimModal}
          onClose={() => setShowClaimModal(false)}
          rewards={mockRewards}
          onClaim={handleClaimReward}
        />
      </div>
    </div>
  );
};
