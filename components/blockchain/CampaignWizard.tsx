import React, { useState } from 'react';
import { Card } from '../ui/Card';
import { ViewProps, View, CampaignType, Campaign, CampaignStatus } from '../../types';

const MaterialIcon = ({ name, className }: { name: string, className?: string }) => (
  <span className={`material-symbols-outlined ${className}`}>{name}</span>
);

type WizardStep = 'type' | 'budget' | 'rules' | 'review';

export const CampaignWizard: React.FC<ViewProps> = ({ onNavigate }) => {
  const [currentStep, setCurrentStep] = useState<WizardStep>('type');
  const [campaignData, setCampaignData] = useState<Partial<Campaign>>({
    name: '',
    type: CampaignType.ENGAGEMENT,
    budget: { amount: 0, asset: 'XLM', spent: 0 },
    rules: { maxRewardsPerUser: 100 },
    status: CampaignStatus.DRAFT
  });

  const steps: { id: WizardStep; label: string; icon: string }[] = [
    { id: 'type', label: 'Campaign Type', icon: 'category' },
    { id: 'budget', label: 'Budget & Duration', icon: 'account_balance_wallet' },
    { id: 'rules', label: 'Rules & Rewards', icon: 'rule' },
    { id: 'review', label: 'Review & Launch', icon: 'check_circle' }
  ];

  const getCurrentStepIndex = () => steps.findIndex(s => s.id === currentStep);

  const handleNext = () => {
    const currentIndex = getCurrentStepIndex();
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1].id);
    }
  };

  const handleBack = () => {
    const currentIndex = getCurrentStepIndex();
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1].id);
    }
  };

  const handleLaunch = () => {
    const campaign: Campaign = {
      id: `campaign-${Date.now()}`,
      name: campaignData.name || 'Untitled Campaign',
      type: campaignData.type!,
      status: CampaignStatus.ACTIVE,
      budget: campaignData.budget!,
      rules: campaignData.rules!,
      startDate: campaignData.startDate || new Date(),
      endDate: campaignData.endDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      createdAt: new Date(),
      metrics: { participants: 0, rewardsDistributed: 0, engagementCount: 0 }
    };

    console.log('Campaign launched:', campaign);
    alert('Campaign launched successfully!');
    onNavigate(View.CAMPAIGN_DASHBOARD);
  };

  return (
    <div className="p-7 max-w-6xl mx-auto animate-fade-in">
      <div className="flex justify-between items-center mb-7">
        <div>
          <h2 className="text-2xl font-bold text-white">Create Campaign</h2>
          <p className="text-gray-subtext text-sm mt-1">Set up your Web3 engagement campaign</p>
        </div>
        <button 
          onClick={() => onNavigate(View.CAMPAIGN_DASHBOARD)}
          className="text-gray-subtext hover:text-white text-sm font-medium px-4 py-2"
        >
          Cancel
        </button>
      </div>

      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <React.Fragment key={step.id}>
              <div className="flex flex-col items-center flex-1">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                  getCurrentStepIndex() >= index 
                    ? 'bg-primary-blue text-white' 
                    : 'bg-dark-surface text-gray-subtext'
                }`}>
                  <MaterialIcon name={step.icon} className="text-2xl" />
                </div>
                <span className={`text-xs mt-2 font-medium ${
                  getCurrentStepIndex() >= index ? 'text-white' : 'text-gray-subtext'
                }`}>
                  {step.label}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div className={`h-0.5 flex-1 mx-4 mb-6 transition-all ${
                  getCurrentStepIndex() > index ? 'bg-primary-blue' : 'bg-dark-border'
                }`} />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <Card>
        {currentStep === 'type' && (
          <TypeStep campaignData={campaignData} setCampaignData={setCampaignData} />
        )}
        {currentStep === 'budget' && (
          <BudgetStep campaignData={campaignData} setCampaignData={setCampaignData} />
        )}
        {currentStep === 'rules' && (
          <RulesStep campaignData={campaignData} setCampaignData={setCampaignData} />
        )}
        {currentStep === 'review' && (
          <ReviewStep campaignData={campaignData} />
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-8 pt-6 border-t border-dark-border">
          <button
            onClick={handleBack}
            disabled={getCurrentStepIndex() === 0}
            className="px-6 py-3 rounded-2xl text-sm font-medium text-gray-subtext hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            Back
          </button>
          {currentStep === 'review' ? (
            <button
              onClick={handleLaunch}
              className="bg-gradient-to-r from-primary-blue to-primary-teal text-white px-8 py-3 rounded-2xl text-sm font-medium hover:opacity-90 shadow-lg shadow-blue-500/20 transition-all"
            >
              Launch Campaign
            </button>
          ) : (
            <button
              onClick={handleNext}
              className="bg-primary-blue text-white px-6 py-3 rounded-2xl text-sm font-medium hover:bg-blue-700 transition-all"
            >
              Next
            </button>
          )}
        </div>
      </Card>
    </div>
  );
};

// Type Selection Step
const TypeStep: React.FC<{
  campaignData: Partial<Campaign>;
  setCampaignData: React.Dispatch<React.SetStateAction<Partial<Campaign>>>;
}> = ({ campaignData, setCampaignData }) => {
  const campaignTypes = [
    {
      type: CampaignType.ENGAGEMENT,
      icon: 'favorite',
      title: 'Engagement Campaign',
      description: 'Reward users for likes, shares, and comments',
      color: 'from-pink-500 to-rose-500'
    },
    {
      type: CampaignType.REFERRAL,
      icon: 'group_add',
      title: 'Referral Campaign',
      description: 'Reward users for bringing new followers',
      color: 'from-blue-500 to-cyan-500'
    },
    {
      type: CampaignType.MILESTONE,
      icon: 'emoji_events',
      title: 'Milestone Campaign',
      description: 'Reward users for reaching specific goals',
      color: 'from-amber-500 to-orange-500'
    }
  ];

  return (
    <div>
      <h3 className="text-xl font-semibold text-white mb-2">Select Campaign Type</h3>
      <p className="text-gray-subtext text-sm mb-6">Choose the type of campaign you want to create</p>

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-subtext mb-2">Campaign Name</label>
        <input
          type="text"
          value={campaignData.name}
          onChange={(e) => setCampaignData({ ...campaignData, name: e.target.value })}
          className="w-full bg-dark-bg border border-dark-border rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary-blue/50"
          placeholder="Enter campaign name"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {campaignTypes.map((ct) => (
          <button
            key={ct.type}
            onClick={() => setCampaignData({ ...campaignData, type: ct.type })}
            className={`p-6 rounded-2xl border-2 transition-all text-left ${
              campaignData.type === ct.type
                ? 'border-primary-blue bg-primary-blue/10'
                : 'border-dark-border bg-dark-surface hover:border-gray-500'
            }`}
          >
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${ct.color} flex items-center justify-center mb-4`}>
              <MaterialIcon name={ct.icon} className="text-white text-2xl" />
            </div>
            <h4 className="text-white font-semibold mb-2">{ct.title}</h4>
            <p className="text-gray-subtext text-sm">{ct.description}</p>
          </button>
        ))}
      </div>
    </div>
  );
};

// Budget & Duration Step
const BudgetStep: React.FC<{
  campaignData: Partial<Campaign>;
  setCampaignData: React.Dispatch<React.SetStateAction<Partial<Campaign>>>;
}> = ({ campaignData, setCampaignData }) => {
  const getTodayString = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  return (
    <div>
      <h3 className="text-xl font-semibold text-white mb-2">Budget & Duration</h3>
      <p className="text-gray-subtext text-sm mb-6">Configure your campaign budget and timeline</p>

      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-subtext mb-2">Budget Amount</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={campaignData.budget?.amount || 0}
              onChange={(e) => setCampaignData({
                ...campaignData,
                budget: { ...campaignData.budget!, amount: parseFloat(e.target.value) }
              })}
              className="w-full bg-dark-bg border border-dark-border rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary-blue/50"
              placeholder="0.00"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-subtext mb-2">Asset</label>
            <select
              value={campaignData.budget?.asset || 'XLM'}
              onChange={(e) => setCampaignData({
                ...campaignData,
                budget: { ...campaignData.budget!, asset: e.target.value }
              })}
              className="w-full bg-dark-bg border border-dark-border rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary-blue/50"
            >
              <option value="XLM">XLM (Stellar Lumens)</option>
              <option value="USDC">USDC (USD Coin)</option>
              <option value="ETH">ETH (Ethereum)</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-subtext mb-2">Start Date</label>
            <input
              type="date"
              min={getTodayString()}
              value={campaignData.startDate?.toISOString().split('T')[0] || getTodayString()}
              onChange={(e) => setCampaignData({ ...campaignData, startDate: new Date(e.target.value) })}
              className="w-full bg-dark-bg border border-dark-border rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary-blue/50"
              style={{ colorScheme: 'dark' }}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-subtext mb-2">End Date</label>
            <input
              type="date"
              min={getTodayString()}
              value={campaignData.endDate?.toISOString().split('T')[0] || ''}
              onChange={(e) => setCampaignData({ ...campaignData, endDate: new Date(e.target.value) })}
              className="w-full bg-dark-bg border border-dark-border rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary-blue/50"
              style={{ colorScheme: 'dark' }}
            />
          </div>
        </div>

        <div className="p-4 bg-dark-bg rounded-xl border border-dark-border">
          <div className="flex items-start gap-3">
            <MaterialIcon name="info" className="text-primary-teal text-xl" />
            <div>
              <p className="text-white text-sm font-medium">Budget Information</p>
              <p className="text-gray-subtext text-xs mt-1">
                Your budget will be locked in a smart contract and distributed automatically based on campaign rules.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Rules Configuration Step
const RulesStep: React.FC<{
  campaignData: Partial<Campaign>;
  setCampaignData: React.Dispatch<React.SetStateAction<Partial<Campaign>>>;
}> = ({ campaignData, setCampaignData }) => {
  return (
    <div>
      <h3 className="text-xl font-semibold text-white mb-2">Campaign Rules</h3>
      <p className="text-gray-subtext text-sm mb-6">Define how rewards are distributed</p>

      <div className="space-y-6">
        {campaignData.type === CampaignType.ENGAGEMENT && (
          <EngagementRulesEditor campaignData={campaignData} setCampaignData={setCampaignData} />
        )}
        {campaignData.type === CampaignType.REFERRAL && (
          <ReferralRulesEditor campaignData={campaignData} setCampaignData={setCampaignData} />
        )}
        {campaignData.type === CampaignType.MILESTONE && (
          <MilestoneRulesEditor campaignData={campaignData} setCampaignData={setCampaignData} />
        )}

        <div>
          <label className="block text-sm font-medium text-gray-subtext mb-2">Maximum Rewards Per User</label>
          <input
            type="number"
            min="0"
            value={campaignData.rules?.maxRewardsPerUser || 0}
            onChange={(e) => setCampaignData({
              ...campaignData,
              rules: { ...campaignData.rules!, maxRewardsPerUser: parseInt(e.target.value) }
            })}
            className="w-full bg-dark-bg border border-dark-border rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary-blue/50"
            placeholder="100"
          />
          <p className="text-xs text-gray-600 mt-2">Limit the maximum rewards a single user can earn</p>
        </div>
      </div>
    </div>
  );
};

const EngagementRulesEditor: React.FC<{
  campaignData: Partial<Campaign>;
  setCampaignData: React.Dispatch<React.SetStateAction<Partial<Campaign>>>;
}> = ({ campaignData, setCampaignData }) => {
  const updateEngagementRule = (field: string, value: number) => {
    setCampaignData({
      ...campaignData,
      rules: {
        ...campaignData.rules!,
        engagement: {
          ...campaignData.rules?.engagement,
          [field]: value
        }
      }
    });
  };

  return (
    <div className="space-y-4">
      <h4 className="text-white font-medium">Engagement Thresholds & Rewards</h4>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-gray-subtext mb-2">Likes Threshold</label>
          <input
            type="number"
            min="0"
            value={campaignData.rules?.engagement?.likesThreshold || 0}
            onChange={(e) => updateEngagementRule('likesThreshold', parseInt(e.target.value))}
            className="w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-1 focus:ring-primary-blue/50"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-subtext mb-2">Reward Per Like</label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={campaignData.rules?.engagement?.rewardPerLike || 0}
            onChange={(e) => updateEngagementRule('rewardPerLike', parseFloat(e.target.value))}
            className="w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-1 focus:ring-primary-blue/50"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-gray-subtext mb-2">Shares Threshold</label>
          <input
            type="number"
            min="0"
            value={campaignData.rules?.engagement?.sharesThreshold || 0}
            onChange={(e) => updateEngagementRule('sharesThreshold', parseInt(e.target.value))}
            className="w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-1 focus:ring-primary-blue/50"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-subtext mb-2">Reward Per Share</label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={campaignData.rules?.engagement?.rewardPerShare || 0}
            onChange={(e) => updateEngagementRule('rewardPerShare', parseFloat(e.target.value))}
            className="w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-1 focus:ring-primary-blue/50"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-gray-subtext mb-2">Comments Threshold</label>
          <input
            type="number"
            min="0"
            value={campaignData.rules?.engagement?.commentsThreshold || 0}
            onChange={(e) => updateEngagementRule('commentsThreshold', parseInt(e.target.value))}
            className="w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-1 focus:ring-primary-blue/50"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-subtext mb-2">Reward Per Comment</label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={campaignData.rules?.engagement?.rewardPerComment || 0}
            onChange={(e) => updateEngagementRule('rewardPerComment', parseFloat(e.target.value))}
            className="w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-1 focus:ring-primary-blue/50"
          />
        </div>
      </div>
    </div>
  );
};

const ReferralRulesEditor: React.FC<{
  campaignData: Partial<Campaign>;
  setCampaignData: React.Dispatch<React.SetStateAction<Partial<Campaign>>>;
}> = ({ campaignData, setCampaignData }) => {
  return (
    <div className="space-y-4">
      <h4 className="text-white font-medium">Referral Rules</h4>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-gray-subtext mb-2">Reward Per Referral</label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={campaignData.rules?.referral?.rewardPerReferral || 0}
            onChange={(e) => setCampaignData({
              ...campaignData,
              rules: {
                ...campaignData.rules!,
                referral: {
                  ...campaignData.rules?.referral,
                  rewardPerReferral: parseFloat(e.target.value)
                }
              }
            })}
            className="w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-1 focus:ring-primary-blue/50"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-subtext mb-2">Minimum Referrals</label>
          <input
            type="number"
            min="0"
            value={campaignData.rules?.referral?.minimumReferrals || 0}
            onChange={(e) => setCampaignData({
              ...campaignData,
              rules: {
                ...campaignData.rules!,
                referral: {
                  ...campaignData.rules?.referral,
                  minimumReferrals: parseInt(e.target.value)
                }
              }
            })}
            className="w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-1 focus:ring-primary-blue/50"
          />
        </div>
      </div>
    </div>
  );
};

const MilestoneRulesEditor: React.FC<{
  campaignData: Partial<Campaign>;
  setCampaignData: React.Dispatch<React.SetStateAction<Partial<Campaign>>>;
}> = ({ campaignData, setCampaignData }) => {
  return (
    <div className="space-y-4">
      <h4 className="text-white font-medium">Milestone Targets</h4>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-gray-subtext mb-2">Follower Count Target</label>
          <input
            type="number"
            min="0"
            value={campaignData.rules?.milestone?.followerCountTarget || 0}
            onChange={(e) => setCampaignData({
              ...campaignData,
              rules: {
                ...campaignData.rules!,
                milestone: {
                  ...campaignData.rules?.milestone!,
                  followerCountTarget: parseInt(e.target.value)
                }
              }
            })}
            className="w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-1 focus:ring-primary-blue/50"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-subtext mb-2">Engagement Rate Target (%)</label>
          <input
            type="number"
            min="0"
            max="100"
            step="0.1"
            value={campaignData.rules?.milestone?.engagementRateTarget || 0}
            onChange={(e) => setCampaignData({
              ...campaignData,
              rules: {
                ...campaignData.rules!,
                milestone: {
                  ...campaignData.rules?.milestone!,
                  engagementRateTarget: parseFloat(e.target.value)
                }
              }
            })}
            className="w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-1 focus:ring-primary-blue/50"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm text-gray-subtext mb-2">Reward Amount</label>
        <input
          type="number"
          min="0"
          step="0.01"
          value={campaignData.rules?.milestone?.rewardAmount || 0}
          onChange={(e) => setCampaignData({
            ...campaignData,
            rules: {
              ...campaignData.rules!,
              milestone: {
                ...campaignData.rules?.milestone!,
                rewardAmount: parseFloat(e.target.value)
              }
            }
          })}
          className="w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-1 focus:ring-primary-blue/50"
        />
      </div>
    </div>
  );
};

// Review Step
const ReviewStep: React.FC<{ campaignData: Partial<Campaign> }> = ({ campaignData }) => {
  return (
    <div>
      <h3 className="text-xl font-semibold text-white mb-2">Review Campaign</h3>
      <p className="text-gray-subtext text-sm mb-6">Review your campaign details before launching</p>

      <div className="space-y-4">
        <div className="p-4 bg-dark-bg rounded-xl border border-dark-border">
          <h4 className="text-white font-medium mb-3">Campaign Details</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-subtext">Name:</span>
              <span className="text-white">{campaignData.name || 'Untitled'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-subtext">Type:</span>
              <span className="text-white capitalize">{campaignData.type}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-subtext">Budget:</span>
              <span className="text-white">{campaignData.budget?.amount} {campaignData.budget?.asset}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-subtext">Duration:</span>
              <span className="text-white">
                {campaignData.startDate?.toLocaleDateString()} - {campaignData.endDate?.toLocaleDateString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-subtext">Max Rewards Per User:</span>
              <span className="text-white">{campaignData.rules?.maxRewardsPerUser}</span>
            </div>
          </div>
        </div>

        <div className="p-4 bg-gradient-to-r from-primary-blue/10 to-primary-teal/10 rounded-xl border border-primary-blue/30">
          <div className="flex items-start gap-3">
            <MaterialIcon name="info" className="text-primary-teal text-xl" />
            <div>
              <p className="text-white text-sm font-medium">Ready to Launch</p>
              <p className="text-gray-subtext text-xs mt-1">
                Your campaign will be deployed to the blockchain and start immediately after launch.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
