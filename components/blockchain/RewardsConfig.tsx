import React, { useState } from 'react';
import { Card } from '../ui/Card';
import { RewardRule, EligibilityCriteria, RewardPool, RewardConfig } from '../../blockchain/types/rewards';
import { FiPlus, FiTrash2, FiSave, FiDollarSign, FiUsers, FiSettings } from 'react-icons/fi';

interface RewardsConfigProps {
  onSave: (config: RewardConfig) => Promise<void>;
  initialConfig?: RewardConfig;
}

export const RewardsConfig: React.FC<RewardsConfigProps> = ({ onSave, initialConfig }) => {
  const [name, setName] = useState(initialConfig?.name || '');
  const [rules, setRules] = useState<RewardRule[]>(initialConfig?.rules || [
    { actionType: 'like', rewardAmount: '10', enabled: true },
    { actionType: 'share', rewardAmount: '50', enabled: true },
    { actionType: 'comment', rewardAmount: '25', enabled: true },
    { actionType: 'view', rewardAmount: '1', enabled: false },
  ]);
  
  const [pool, setPool] = useState<RewardPool>(initialConfig?.pool || {
    totalBudget: '10000',
    remainingBudget: '10000',
    asset: { code: 'XLM', issuer: '' },
    startDate: Date.now(),
    endDate: Date.now() + 30 * 24 * 60 * 60 * 1000,
  });

  const [eligibility, setEligibility] = useState<EligibilityCriteria>(initialConfig?.eligibility || {
    minFollowers: 100,
    minEngagementRate: 2,
    accountAge: 30,
    verifiedOnly: false,
  });

  const [saving, setSaving] = useState(false);

  const updateRule = (index: number, field: keyof RewardRule, value: any) => {
    const updated = [...rules];
    updated[index] = { ...updated[index], [field]: value };
    setRules(updated);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const config: RewardConfig = {
        id: initialConfig?.id || `reward_${Date.now()}`,
        name,
        rules,
        pool,
        eligibility,
        status: 'active',
      };
      await onSave(config);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">Engagement Rewards Configuration</h2>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg hover:opacity-90 disabled:opacity-50"
          >
            <FiSave />
            {saving ? 'Saving...' : 'Save Configuration'}
          </button>
        </div>

        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Campaign Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Summer Engagement Campaign"
              className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
            />
          </div>
        </div>
      </Card>

      <Card>
        <div className="flex items-center gap-2 mb-4">
          <FiDollarSign className="text-purple-400" />
          <h3 className="text-xl font-semibold text-white">Reward Rules</h3>
        </div>
        
        <div className="space-y-3">
          {rules.map((rule, index) => (
            <div key={rule.actionType} className="flex items-center gap-4 p-4 bg-white/5 rounded-lg">
              <input
                type="checkbox"
                checked={rule.enabled}
                onChange={(e) => updateRule(index, 'enabled', e.target.checked)}
                className="w-5 h-5 rounded"
              />
              
              <div className="flex-1">
                <span className="text-white font-medium capitalize">{rule.actionType}</span>
              </div>
              
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={rule.rewardAmount}
                  onChange={(e) => updateRule(index, 'rewardAmount', e.target.value)}
                  disabled={!rule.enabled}
                  className="w-24 px-3 py-1 bg-white/5 border border-white/10 rounded text-white disabled:opacity-50"
                />
                <span className="text-gray-400 text-sm">{pool.asset.code}</span>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <div className="flex items-center gap-2 mb-4">
          <FiSettings className="text-purple-400" />
          <h3 className="text-xl font-semibold text-white">Reward Pool Budget</h3>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Total Budget</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={pool.totalBudget}
                onChange={(e) => setPool({ ...pool, totalBudget: e.target.value, remainingBudget: e.target.value })}
                className="flex-1 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white"
              />
              <span className="text-gray-400">{pool.asset.code}</span>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Asset</label>
            <input
              type="text"
              value={pool.asset.code}
              onChange={(e) => setPool({ ...pool, asset: { ...pool.asset, code: e.target.value } })}
              className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Start Date</label>
            <input
              type="date"
              value={new Date(pool.startDate).toISOString().split('T')[0]}
              onChange={(e) => setPool({ ...pool, startDate: new Date(e.target.value).getTime() })}
              className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">End Date</label>
            <input
              type="date"
              value={new Date(pool.endDate).toISOString().split('T')[0]}
              onChange={(e) => setPool({ ...pool, endDate: new Date(e.target.value).getTime() })}
              className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white"
            />
          </div>
        </div>
      </Card>

      <Card>
        <div className="flex items-center gap-2 mb-4">
          <FiUsers className="text-purple-400" />
          <h3 className="text-xl font-semibold text-white">Eligibility Criteria</h3>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Minimum Followers</label>
            <input
              type="number"
              value={eligibility.minFollowers || ''}
              onChange={(e) => setEligibility({ ...eligibility, minFollowers: parseInt(e.target.value) || undefined })}
              placeholder="Optional"
              className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Min Engagement Rate (%)</label>
            <input
              type="number"
              step="0.1"
              value={eligibility.minEngagementRate || ''}
              onChange={(e) => setEligibility({ ...eligibility, minEngagementRate: parseFloat(e.target.value) || undefined })}
              placeholder="Optional"
              className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Account Age (days)</label>
            <input
              type="number"
              value={eligibility.accountAge || ''}
              onChange={(e) => setEligibility({ ...eligibility, accountAge: parseInt(e.target.value) || undefined })}
              placeholder="Optional"
              className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500"
            />
          </div>
          
          <div className="flex items-center gap-2 pt-8">
            <input
              type="checkbox"
              checked={eligibility.verifiedOnly || false}
              onChange={(e) => setEligibility({ ...eligibility, verifiedOnly: e.target.checked })}
              className="w-5 h-5 rounded"
            />
            <label className="text-sm font-medium text-gray-300">Verified Accounts Only</label>
          </div>
        </div>
      </Card>
    </div>
  );
};
