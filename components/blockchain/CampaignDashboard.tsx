import React, { useState } from 'react';
import { Card } from '../ui/Card';
import { ViewProps, View, Campaign, CampaignStatus, CampaignType } from '../../types';

const MaterialIcon = ({ name, className }: { name: string, className?: string }) => (
  <span className={`material-symbols-outlined ${className}`}>{name}</span>
);

export const CampaignDashboard: React.FC<ViewProps> = ({ onNavigate }) => {
  const [filterStatus, setFilterStatus] = useState<CampaignStatus | 'all'>('all');

  // Mock campaigns data
  const mockCampaigns: Campaign[] = [
    {
      id: '1',
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
      }
    },
    {
      id: '2',
      name: 'Referral Growth Campaign',
      type: CampaignType.REFERRAL,
      status: CampaignStatus.ACTIVE,
      budget: { amount: 500, asset: 'USDC', spent: 120 },
      rules: {
        referral: {
          rewardPerReferral: 5,
          minimumReferrals: 3
        },
        maxRewardsPerUser: 50
      },
      startDate: new Date('2026-02-01'),
      endDate: new Date('2026-02-28'),
      createdAt: new Date('2026-01-28'),
      metrics: {
        participants: 89,
        rewardsDistributed: 120,
        engagementCount: 24
      }
    },
    {
      id: '3',
      name: '10K Followers Milestone',
      type: CampaignType.MILESTONE,
      status: CampaignStatus.PAUSED,
      budget: { amount: 2000, asset: 'XLM', spent: 0 },
      rules: {
        milestone: {
          followerCountTarget: 10000,
          engagementRateTarget: 5.5,
          rewardAmount: 100
        },
        maxRewardsPerUser: 100
      },
      startDate: new Date('2026-02-20'),
      endDate: new Date('2026-04-20'),
      createdAt: new Date('2026-02-18'),
      metrics: {
        participants: 0,
        rewardsDistributed: 0,
        engagementCount: 0
      }
    },
    {
      id: '4',
      name: 'Holiday Engagement',
      type: CampaignType.ENGAGEMENT,
      status: CampaignStatus.COMPLETED,
      budget: { amount: 750, asset: 'XLM', spent: 750 },
      rules: {
        engagement: {
          likesThreshold: 5,
          rewardPerLike: 0.3
        },
        maxRewardsPerUser: 50
      },
      startDate: new Date('2025-12-20'),
      endDate: new Date('2026-01-05'),
      createdAt: new Date('2025-12-15'),
      metrics: {
        participants: 456,
        rewardsDistributed: 750,
        engagementCount: 2500
      }
    }
  ];

  const filteredCampaigns = filterStatus === 'all' 
    ? mockCampaigns 
    : mockCampaigns.filter(c => c.status === filterStatus);

  const getStatusColor = (status: CampaignStatus) => {
    switch (status) {
      case CampaignStatus.ACTIVE: return 'text-green-400 bg-green-400/10';
      case CampaignStatus.PAUSED: return 'text-yellow-400 bg-yellow-400/10';
      case CampaignStatus.COMPLETED: return 'text-gray-400 bg-gray-400/10';
      case CampaignStatus.DRAFT: return 'text-blue-400 bg-blue-400/10';
    }
  };

  const getTypeIcon = (type: CampaignType) => {
    switch (type) {
      case CampaignType.ENGAGEMENT: return 'favorite';
      case CampaignType.REFERRAL: return 'group_add';
      case CampaignType.MILESTONE: return 'emoji_events';
    }
  };

  const getTypeColor = (type: CampaignType) => {
    switch (type) {
      case CampaignType.ENGAGEMENT: return 'from-pink-500 to-rose-500';
      case CampaignType.REFERRAL: return 'from-blue-500 to-cyan-500';
      case CampaignType.MILESTONE: return 'from-amber-500 to-orange-500';
    }
  };

  return (
    <div className="p-7 max-w-7xl mx-auto animate-fade-in">
      <div className="flex justify-between items-center mb-7">
        <div>
          <h2 className="text-2xl font-bold text-white">Campaign Management</h2>
          <p className="text-gray-subtext text-sm mt-1">Manage your Web3 engagement campaigns</p>
        </div>
        <button 
          onClick={() => onNavigate(View.CAMPAIGN_WIZARD)}
          className="bg-gradient-to-r from-primary-blue to-primary-teal text-white px-6 py-3 rounded-2xl text-sm font-medium hover:opacity-90 shadow-lg shadow-blue-500/20 transition-all flex items-center gap-2"
        >
          <MaterialIcon name="add" />
          Create Campaign
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-7">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-subtext text-xs font-medium">Active Campaigns</p>
              <p className="text-2xl font-bold text-white mt-1">
                {mockCampaigns.filter(c => c.status === CampaignStatus.ACTIVE).length}
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
              <MaterialIcon name="campaign" className="text-white text-2xl" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-subtext text-xs font-medium">Total Budget</p>
              <p className="text-2xl font-bold text-white mt-1">
                {mockCampaigns.reduce((sum, c) => sum + c.budget.amount, 0).toLocaleString()}
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
              <MaterialIcon name="account_balance_wallet" className="text-white text-2xl" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-subtext text-xs font-medium">Rewards Distributed</p>
              <p className="text-2xl font-bold text-white mt-1">
                {mockCampaigns.reduce((sum, c) => sum + (c.metrics?.rewardsDistributed || 0), 0).toLocaleString()}
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <MaterialIcon name="redeem" className="text-white text-2xl" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-subtext text-xs font-medium">Total Participants</p>
              <p className="text-2xl font-bold text-white mt-1">
                {mockCampaigns.reduce((sum, c) => sum + (c.metrics?.participants || 0), 0).toLocaleString()}
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
              <MaterialIcon name="groups" className="text-white text-2xl" />
            </div>
          </div>
        </Card>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6">
        {[
          { id: 'all', label: 'All Campaigns' },
          { id: CampaignStatus.ACTIVE, label: 'Active' },
          { id: CampaignStatus.PAUSED, label: 'Paused' },
          { id: CampaignStatus.COMPLETED, label: 'Completed' }
        ].map((filter) => (
          <button
            key={filter.id}
            onClick={() => setFilterStatus(filter.id as CampaignStatus | 'all')}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              filterStatus === filter.id
                ? 'bg-primary-blue text-white'
                : 'bg-dark-surface text-gray-subtext hover:text-white'
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {/* Campaigns List */}
      <div className="space-y-4">
        {filteredCampaigns.length === 0 ? (
          <Card>
            <div className="text-center py-12">
              <MaterialIcon name="campaign" className="text-gray-600 text-5xl mb-4" />
              <p className="text-gray-subtext">No campaigns found</p>
              <button
                onClick={() => onNavigate(View.CAMPAIGN_WIZARD)}
                className="mt-4 text-primary-blue hover:text-blue-400 text-sm font-medium"
              >
                Create your first campaign
              </button>
            </div>
          </Card>
        ) : (
          filteredCampaigns.map((campaign) => (
            <Card key={campaign.id}>
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4 flex-1">
                  <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${getTypeColor(campaign.type)} flex items-center justify-center flex-shrink-0`}>
                    <MaterialIcon name={getTypeIcon(campaign.type)} className="text-white text-2xl" />
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-white">{campaign.name}</h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(campaign.status)}`}>
                        {campaign.status}
                      </span>
                      <span className="px-3 py-1 rounded-full text-xs font-medium text-gray-400 bg-dark-bg capitalize">
                        {campaign.type}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-4">
                      <div>
                        <p className="text-xs text-gray-subtext mb-1">Budget</p>
                        <p className="text-sm font-medium text-white">
                          {campaign.budget.amount} {campaign.budget.asset}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-subtext mb-1">Spent</p>
                        <p className="text-sm font-medium text-white">
                          {campaign.budget.spent} {campaign.budget.asset}
                        </p>
                        <div className="w-full bg-dark-bg rounded-full h-1.5 mt-1">
                          <div 
                            className="bg-primary-blue h-1.5 rounded-full transition-all"
                            style={{ width: `${(campaign.budget.spent / campaign.budget.amount) * 100}%` }}
                          />
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-gray-subtext mb-1">Participants</p>
                        <p className="text-sm font-medium text-white">
                          {campaign.metrics?.participants.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-subtext mb-1">Rewards Distributed</p>
                        <p className="text-sm font-medium text-white">
                          {campaign.metrics?.rewardsDistributed.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-subtext mb-1">Duration</p>
                        <p className="text-sm font-medium text-white">
                          {Math.ceil((campaign.endDate.getTime() - campaign.startDate.getTime()) / (1000 * 60 * 60 * 24))} days
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 ml-4">
                  {campaign.status === CampaignStatus.ACTIVE && (
                    <button className="p-2 hover:bg-dark-bg rounded-lg transition-colors" title="Pause Campaign">
                      <MaterialIcon name="pause" className="text-gray-subtext hover:text-white" />
                    </button>
                  )}
                  {campaign.status === CampaignStatus.PAUSED && (
                    <button className="p-2 hover:bg-dark-bg rounded-lg transition-colors" title="Resume Campaign">
                      <MaterialIcon name="play_arrow" className="text-gray-subtext hover:text-white" />
                    </button>
                  )}
                  <button 
                    onClick={() => onNavigate(View.CAMPAIGN_DETAIL)}
                    className="p-2 hover:bg-dark-bg rounded-lg transition-colors" 
                    title="View Details"
                  >
                    <MaterialIcon name="visibility" className="text-gray-subtext hover:text-white" />
                  </button>
                  <button className="p-2 hover:bg-dark-bg rounded-lg transition-colors" title="Edit Campaign">
                    <MaterialIcon name="edit" className="text-gray-subtext hover:text-white" />
                  </button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};
