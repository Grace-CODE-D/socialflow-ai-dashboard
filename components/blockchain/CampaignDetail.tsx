import React, { useState } from 'react';
import { Card } from '../ui/Card';
import { ViewPropsWithCampaign, View, Campaign, CampaignStatus, CampaignType, CampaignParticipant, RewardTransaction } from '../../types';

const MaterialIcon = ({ name, className }: { name: string, className?: string }) => (
  <span className={`material-symbols-outlined ${className}`}>{name}</span>
);

export const CampaignDetail: React.FC<ViewPropsWithCampaign> = ({ onNavigate, campaignId }) => {
  const [showAddBudget, setShowAddBudget] = useState(false);
  const [additionalBudget, setAdditionalBudget] = useState(0);
  const [showEditModal, setShowEditModal] = useState(false);

  // Mock campaign data
  const campaign: Campaign = {
    id: campaignId || '1',
    name: 'Summer Engagement Boost',
    type: CampaignType.ENGAGEMENT,
    status: CampaignStatus.ACTIVE,
    budget: { amount: 1000, asset: 'XLM', spent: 450 },
    rules: {
      engagement: {
        likesThreshold: 10,
        sharesThreshold: 5,
        commentsThreshold: 3,
        rewardPerLike: 0.5,
        rewardPerShare: 1.0,
        rewardPerComment: 0.75
      },
      maxRewardsPerUser: 100
    },
    startDate: new Date('2026-02-15'),
    endDate: new Date('2026-03-15'),
    createdAt: new Date('2026-02-10'),
    metrics: {
      participants: 234,
      rewardsDistributed: 450,
      engagementCount: 1250
    },
    participants: [
      { id: '1', username: '@sarah_creator', avatar: '', walletAddress: 'GABC...XYZ', rewardsEarned: 45.5, engagementCount: 89, joinedAt: new Date('2026-02-15'), rank: 1 },
      { id: '2', username: '@mike_influencer', avatar: '', walletAddress: 'GDEF...ABC', rewardsEarned: 38.2, engagementCount: 76, joinedAt: new Date('2026-02-16'), rank: 2 },
      { id: '3', username: '@emma_social', avatar: '', walletAddress: 'GHIJ...DEF', rewardsEarned: 32.8, engagementCount: 65, joinedAt: new Date('2026-02-16'), rank: 3 },
      { id: '4', username: '@john_marketer', avatar: '', walletAddress: 'GKLM...GHI', rewardsEarned: 28.5, engagementCount: 57, joinedAt: new Date('2026-02-17'), rank: 4 },
      { id: '5', username: '@lisa_content', avatar: '', walletAddress: 'GNOP...JKL', rewardsEarned: 25.0, engagementCount: 50, joinedAt: new Date('2026-02-17'), rank: 5 }
    ],
    rewardHistory: [
      { id: '1', participantId: '1', participantName: '@sarah_creator', amount: 5.0, asset: 'XLM', action: 'Likes milestone reached', timestamp: new Date('2026-02-21 10:30'), txHash: '0xabc123...' },
      { id: '2', participantId: '2', participantName: '@mike_influencer', amount: 3.5, asset: 'XLM', action: 'Shares milestone reached', timestamp: new Date('2026-02-21 09:15'), txHash: '0xdef456...' },
      { id: '3', participantId: '3', participantName: '@emma_social', amount: 2.8, asset: 'XLM', action: 'Comments milestone reached', timestamp: new Date('2026-02-21 08:45'), txHash: '0xghi789...' },
      { id: '4', participantId: '1', participantName: '@sarah_creator', amount: 4.2, asset: 'XLM', action: 'Engagement bonus', timestamp: new Date('2026-02-20 16:20'), txHash: '0xjkl012...' },
      { id: '5', participantId: '4', participantName: '@john_marketer', amount: 3.0, asset: 'XLM', action: 'Likes milestone reached', timestamp: new Date('2026-02-20 14:10'), txHash: '0xmno345...' }
    ]
  };

  const handlePauseResume = () => {
    if (campaign.status === CampaignStatus.ACTIVE) {
      alert('Campaign paused successfully');
    } else {
      alert('Campaign resumed successfully');
    }
  };

  const handleAddBudget = () => {
    if (additionalBudget > 0) {
      alert(`Added ${additionalBudget} ${campaign.budget.asset} to campaign budget`);
      setShowAddBudget(false);
      setAdditionalBudget(0);
    }
  };

  const handleTerminate = () => {
    if (confirm('Are you sure you want to terminate this campaign? Remaining budget will be returned.')) {
      alert('Campaign terminated. Remaining budget returned to wallet.');
      onNavigate(View.CAMPAIGN_DASHBOARD);
    }
  };

  const handleEmergencyStop = () => {
    if (confirm('EMERGENCY STOP: This will immediately halt all campaign activities. Continue?')) {
      alert('Emergency stop activated. Campaign halted.');
      onNavigate(View.CAMPAIGN_DASHBOARD);
    }
  };

  const handleGenerateReport = () => {
    alert('Generating campaign report...');
    // This would trigger the report generation
  };

  const budgetUtilization = (campaign.budget.spent / campaign.budget.amount) * 100;
  const daysRemaining = Math.ceil((campaign.endDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

  return (
    <div className="p-7 max-w-7xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex justify-between items-start mb-7">
        <div>
          <button
            onClick={() => onNavigate(View.CAMPAIGN_DASHBOARD)}
            className="flex items-center gap-2 text-gray-subtext hover:text-white mb-3 transition-colors"
          >
            <MaterialIcon name="arrow_back" />
            <span className="text-sm">Back to Campaigns</span>
          </button>
          <h2 className="text-2xl font-bold text-white">{campaign.name}</h2>
          <div className="flex items-center gap-3 mt-2">
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
              campaign.status === CampaignStatus.ACTIVE ? 'text-green-400 bg-green-400/10' :
              campaign.status === CampaignStatus.PAUSED ? 'text-yellow-400 bg-yellow-400/10' :
              'text-gray-400 bg-gray-400/10'
            }`}>
              {campaign.status}
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-medium text-gray-400 bg-dark-bg capitalize">
              {campaign.type}
            </span>
            <span className="text-gray-subtext text-sm">{daysRemaining} days remaining</span>
          </div>
        </div>

        <div className="flex gap-2">
          {campaign.status === CampaignStatus.ACTIVE && (
            <button
              onClick={handlePauseResume}
              className="px-4 py-2 rounded-xl bg-dark-surface text-white hover:bg-dark-border transition-colors flex items-center gap-2"
            >
              <MaterialIcon name="pause" className="text-base" />
              Pause
            </button>
          )}
          {campaign.status === CampaignStatus.PAUSED && (
            <button
              onClick={handlePauseResume}
              className="px-4 py-2 rounded-xl bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-colors flex items-center gap-2"
            >
              <MaterialIcon name="play_arrow" className="text-base" />
              Resume
            </button>
          )}
          <button
            onClick={() => setShowAddBudget(true)}
            className="px-4 py-2 rounded-xl bg-primary-blue text-white hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <MaterialIcon name="add" className="text-base" />
            Add Budget
          </button>
          <button
            onClick={() => setShowEditModal(true)}
            className="px-4 py-2 rounded-xl bg-dark-surface text-white hover:bg-dark-border transition-colors flex items-center gap-2"
          >
            <MaterialIcon name="edit" className="text-base" />
            Edit
          </button>
          <button
            onClick={handleGenerateReport}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-primary-blue to-primary-teal text-white hover:opacity-90 transition-opacity flex items-center gap-2"
          >
            <MaterialIcon name="description" className="text-base" />
            Generate Report
          </button>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-7">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-subtext text-xs font-medium">Total Participants</p>
              <p className="text-2xl font-bold text-white mt-1">{campaign.metrics?.participants}</p>
            </div>
            <MaterialIcon name="groups" className="text-primary-blue text-3xl" />
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-subtext text-xs font-medium">Engagement Count</p>
              <p className="text-2xl font-bold text-white mt-1">{campaign.metrics?.engagementCount.toLocaleString()}</p>
            </div>
            <MaterialIcon name="favorite" className="text-pink-500 text-3xl" />
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-subtext text-xs font-medium">Rewards Distributed</p>
              <p className="text-2xl font-bold text-white mt-1">{campaign.budget.spent} {campaign.budget.asset}</p>
            </div>
            <MaterialIcon name="redeem" className="text-primary-teal text-3xl" />
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-subtext text-xs font-medium">Budget Remaining</p>
              <p className="text-2xl font-bold text-white mt-1">{campaign.budget.amount - campaign.budget.spent} {campaign.budget.asset}</p>
            </div>
            <MaterialIcon name="account_balance_wallet" className="text-amber-500 text-3xl" />
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Budget Utilization Chart */}
          <Card>
            <h3 className="text-lg font-semibold text-white mb-4">Budget Utilization</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-subtext">Spent: {campaign.budget.spent} {campaign.budget.asset}</span>
                  <span className="text-white font-medium">{budgetUtilization.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-dark-bg rounded-full h-3">
                  <div 
                    className="bg-gradient-to-r from-primary-blue to-primary-teal h-3 rounded-full transition-all"
                    style={{ width: `${budgetUtilization}%` }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 pt-4 border-t border-dark-border">
                <div>
                  <p className="text-xs text-gray-subtext mb-1">Total Budget</p>
                  <p className="text-sm font-medium text-white">{campaign.budget.amount} {campaign.budget.asset}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-subtext mb-1">Spent</p>
                  <p className="text-sm font-medium text-white">{campaign.budget.spent} {campaign.budget.asset}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-subtext mb-1">Remaining</p>
                  <p className="text-sm font-medium text-white">{campaign.budget.amount - campaign.budget.spent} {campaign.budget.asset}</p>
                </div>
              </div>
            </div>
          </Card>

          {/* Reward Distribution History */}
          <Card>
            <h3 className="text-lg font-semibold text-white mb-4">Recent Reward Distributions</h3>
            <div className="space-y-3">
              {campaign.rewardHistory?.slice(0, 5).map((reward) => (
                <div key={reward.id} className="flex items-center justify-between p-3 bg-dark-bg rounded-xl hover:bg-dark-surface transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-blue to-primary-teal flex items-center justify-center">
                      <MaterialIcon name="redeem" className="text-white text-xl" />
                    </div>
                    <div>
                      <p className="text-white font-medium text-sm">{reward.participantName}</p>
                      <p className="text-gray-subtext text-xs">{reward.action}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-white font-medium text-sm">+{reward.amount} {reward.asset}</p>
                    <p className="text-gray-subtext text-xs">{reward.timestamp.toLocaleTimeString()}</p>
                  </div>
                </div>
              ))}
            </div>
            <button className="w-full mt-4 text-primary-blue hover:text-blue-400 text-sm font-medium">
              View All Transactions
            </button>
          </Card>

          {/* Real-time Analytics */}
          <Card>
            <h3 className="text-lg font-semibold text-white mb-4">Real-time Analytics</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-3 bg-dark-bg rounded-xl">
                <p className="text-xs text-gray-subtext mb-1">Avg. Reward/User</p>
                <p className="text-lg font-bold text-white">
                  {(campaign.budget.spent / (campaign.metrics?.participants || 1)).toFixed(2)} {campaign.budget.asset}
                </p>
              </div>
              <div className="p-3 bg-dark-bg rounded-xl">
                <p className="text-xs text-gray-subtext mb-1">Engagement Rate</p>
                <p className="text-lg font-bold text-white">
                  {((campaign.metrics?.engagementCount || 0) / (campaign.metrics?.participants || 1)).toFixed(1)}
                </p>
              </div>
              <div className="p-3 bg-dark-bg rounded-xl">
                <p className="text-xs text-gray-subtext mb-1">Daily Participants</p>
                <p className="text-lg font-bold text-white">+12</p>
              </div>
              <div className="p-3 bg-dark-bg rounded-xl">
                <p className="text-xs text-gray-subtext mb-1">ROI Estimate</p>
                <p className="text-lg font-bold text-green-400">+245%</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Leaderboard */}
          <Card>
            <h3 className="text-lg font-semibold text-white mb-4">Top Performers</h3>
            <div className="space-y-3">
              {campaign.participants?.slice(0, 5).map((participant, index) => (
                <div key={participant.id} className="flex items-center gap-3 p-2 hover:bg-dark-bg rounded-xl transition-colors">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                    index === 0 ? 'bg-amber-500 text-white' :
                    index === 1 ? 'bg-gray-400 text-white' :
                    index === 2 ? 'bg-orange-600 text-white' :
                    'bg-dark-bg text-gray-subtext'
                  }`}>
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <p className="text-white font-medium text-sm">{participant.username}</p>
                    <p className="text-gray-subtext text-xs">{participant.engagementCount} engagements</p>
                  </div>
                  <div className="text-right">
                    <p className="text-primary-teal font-medium text-sm">{participant.rewardsEarned} {campaign.budget.asset}</p>
                  </div>
                </div>
              ))}
            </div>
            <button className="w-full mt-4 text-primary-blue hover:text-blue-400 text-sm font-medium">
              View Full Leaderboard
            </button>
          </Card>

          {/* Campaign Controls */}
          <Card>
            <h3 className="text-lg font-semibold text-white mb-4">Campaign Controls</h3>
            <div className="space-y-2">
              <button
                onClick={handleTerminate}
                className="w-full px-4 py-3 rounded-xl bg-orange-500/20 text-orange-400 hover:bg-orange-500/30 transition-colors flex items-center justify-center gap-2"
              >
                <MaterialIcon name="stop_circle" />
                Terminate Campaign
              </button>
              <button
                onClick={handleEmergencyStop}
                className="w-full px-4 py-3 rounded-xl bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors flex items-center justify-center gap-2"
              >
                <MaterialIcon name="warning" />
                Emergency Stop
              </button>
            </div>
            <div className="mt-4 p-3 bg-dark-bg rounded-xl">
              <p className="text-xs text-gray-subtext">
                <MaterialIcon name="info" className="text-xs mr-1" />
                Emergency stop will immediately halt all activities and return remaining budget.
              </p>
            </div>
          </Card>

          {/* Campaign Info */}
          <Card>
            <h3 className="text-lg font-semibold text-white mb-4">Campaign Information</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-subtext">Start Date</span>
                <span className="text-white">{campaign.startDate.toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-subtext">End Date</span>
                <span className="text-white">{campaign.endDate.toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-subtext">Created</span>
                <span className="text-white">{campaign.createdAt.toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-subtext">Max Rewards/User</span>
                <span className="text-white">{campaign.rules.maxRewardsPerUser} {campaign.budget.asset}</span>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Add Budget Modal */}
      {showAddBudget && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <h3 className="text-xl font-semibold text-white mb-4">Add Budget</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-subtext mb-2">Additional Amount</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={additionalBudget}
                  onChange={(e) => setAdditionalBudget(parseFloat(e.target.value))}
                  className="w-full bg-dark-bg border border-dark-border rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary-blue/50"
                  placeholder="0.00"
                />
                <p className="text-xs text-gray-subtext mt-2">Asset: {campaign.budget.asset}</p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowAddBudget(false)}
                  className="flex-1 px-4 py-3 rounded-xl bg-dark-surface text-white hover:bg-dark-border transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddBudget}
                  className="flex-1 px-4 py-3 rounded-xl bg-primary-blue text-white hover:bg-blue-700 transition-colors"
                >
                  Add Budget
                </button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};
