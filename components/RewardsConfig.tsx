import React, { useState } from 'react';
import { Card } from './ui/Card';
import { ViewProps } from '../types';

const MaterialIcon = ({ name, className }: { name: string, className?: string }) => (
  <span className={`material-symbols-outlined ${className}`}>{name}</span>
);

interface RewardRule {
  id: string;
  type: 'likes' | 'shares' | 'comments' | 'views';
  threshold: number;
  reward: number;
  enabled: boolean;
}

interface RewardPool {
  balance: number;
  distributed: number;
  currency: string;
}

export const RewardsConfig: React.FC<ViewProps> = () => {
  const [rewardRules, setRewardRules] = useState<RewardRule[]>([
    { id: '1', type: 'likes', threshold: 100, reward: 10, enabled: true },
    { id: '2', type: 'shares', threshold: 50, reward: 25, enabled: true },
    { id: '3', type: 'comments', threshold: 20, reward: 15, enabled: true },
    { id: '4', type: 'views', threshold: 1000, reward: 50, enabled: false },
  ]);

  const [pool, setPool] = useState<RewardPool>({
    balance: 5000,
    distributed: 2450,
    currency: 'XLM'
  });

  const [showAddRule, setShowAddRule] = useState(false);
  const [newRule, setNewRule] = useState<Partial<RewardRule>>({
    type: 'likes',
    threshold: 0,
    reward: 0,
    enabled: true
  });

  const toggleRule = (id: string) => {
    setRewardRules(prev => prev.map(rule => 
      rule.id === id ? { ...rule, enabled: !rule.enabled } : rule
    ));
  };

  const updateRule = (id: string, field: keyof RewardRule, value: any) => {
    setRewardRules(prev => prev.map(rule => 
      rule.id === id ? { ...rule, [field]: value } : rule
    ));
  };

  const deleteRule = (id: string) => {
    if (confirm('Delete this reward rule?')) {
      setRewardRules(prev => prev.filter(rule => rule.id !== id));
    }
  };

  const addRule = () => {
    if (newRule.threshold && newRule.reward) {
      setRewardRules(prev => [...prev, {
        id: Date.now().toString(),
        type: newRule.type as any,
        threshold: newRule.threshold,
        reward: newRule.reward,
        enabled: newRule.enabled || true
      }]);
      setNewRule({ type: 'likes', threshold: 0, reward: 0, enabled: true });
      setShowAddRule(false);
    }
  };

  const deployContract = () => {
    alert('Deploying smart contract to Stellar network...\nThis will create a Soroban contract to manage reward distribution.');
  };

  const addFunds = () => {
    const amount = prompt('Enter amount to add to reward pool (XLM):');
    if (amount && !isNaN(Number(amount))) {
      setPool(prev => ({ ...prev, balance: prev.balance + Number(amount) }));
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'likes': return 'favorite';
      case 'shares': return 'share';
      case 'comments': return 'comment';
      case 'views': return 'visibility';
      default: return 'star';
    }
  };

  return (
    <div className="p-7 space-y-7 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Engagement Rewards Configuration</h2>
          <p className="text-sm text-gray-subtext mt-1">Set up reward rules and manage your reward pool</p>
        </div>
        <button
          onClick={deployContract}
          className="px-4 py-2 rounded-xl bg-primary-blue text-white font-medium hover:bg-primary-blue/90 transition-colors flex items-center gap-2"
        >
          <MaterialIcon name="rocket_launch" />
          Deploy Contract
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 rounded-xl bg-primary-teal/10">
              <MaterialIcon name="account_balance_wallet" className="text-primary-teal text-2xl" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-subtext">Pool Balance</p>
              <p className="text-2xl font-bold text-white">{pool.balance} {pool.currency}</p>
            </div>
            <button
              onClick={addFunds}
              className="p-2 rounded-lg bg-primary-teal/10 text-primary-teal hover:bg-primary-teal/20 transition-colors"
            >
              <MaterialIcon name="add" />
            </button>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 rounded-xl bg-primary-blue/10">
              <MaterialIcon name="payments" className="text-primary-blue text-2xl" />
            </div>
            <div>
              <p className="text-sm text-gray-subtext">Total Distributed</p>
              <p className="text-2xl font-bold text-white">{pool.distributed} {pool.currency}</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 rounded-xl bg-purple-500/10">
              <MaterialIcon name="rule" className="text-purple-400 text-2xl" />
            </div>
            <div>
              <p className="text-sm text-gray-subtext">Active Rules</p>
              <p className="text-2xl font-bold text-white">{rewardRules.filter(r => r.enabled).length}</p>
            </div>
          </div>
        </Card>
      </div>

      <Card>
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold text-white">Reward Rules</h3>
          <button
            onClick={() => setShowAddRule(!showAddRule)}
            className="px-4 py-2 rounded-xl bg-dark-surface border border-dark-border text-sm text-white hover:bg-white/5 transition-colors flex items-center gap-2"
          >
            <MaterialIcon name="add" />
            Add Rule
          </button>
        </div>

        {showAddRule && (
          <div className="mb-6 p-4 rounded-xl bg-dark-surface border border-primary-blue/30">
            <h4 className="text-sm font-semibold text-white mb-4">New Reward Rule</h4>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="text-xs text-gray-subtext mb-2 block">Engagement Type</label>
                <select
                  value={newRule.type}
                  onChange={(e) => setNewRule({ ...newRule, type: e.target.value as any })}
                  className="w-full bg-dark-bg text-white border border-dark-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary-blue"
                >
                  <option value="likes">Likes</option>
                  <option value="shares">Shares</option>
                  <option value="comments">Comments</option>
                  <option value="views">Views</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-subtext mb-2 block">Threshold</label>
                <input
                  type="number"
                  value={newRule.threshold || ''}
                  onChange={(e) => setNewRule({ ...newRule, threshold: Number(e.target.value) })}
                  className="w-full bg-dark-bg text-white border border-dark-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary-blue"
                  placeholder="100"
                />
              </div>
              <div>
                <label className="text-xs text-gray-subtext mb-2 block">Reward (XLM)</label>
                <input
                  type="number"
                  value={newRule.reward || ''}
                  onChange={(e) => setNewRule({ ...newRule, reward: Number(e.target.value) })}
                  className="w-full bg-dark-bg text-white border border-dark-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary-blue"
                  placeholder="10"
                />
              </div>
              <div className="flex items-end gap-2">
                <button
                  onClick={addRule}
                  className="flex-1 px-4 py-2 rounded-lg bg-primary-blue text-white text-sm font-medium hover:bg-primary-blue/90 transition-colors"
                >
                  Add
                </button>
                <button
                  onClick={() => setShowAddRule(false)}
                  className="px-4 py-2 rounded-lg bg-dark-bg text-gray-subtext text-sm hover:bg-white/5 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-3">
          {rewardRules.map((rule) => (
            <div
              key={rule.id}
              className={`p-4 rounded-xl border transition-all ${
                rule.enabled 
                  ? 'bg-dark-surface border-dark-border' 
                  : 'bg-dark-bg border-dark-border opacity-60'
              }`}
            >
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  rule.enabled ? 'bg-primary-blue/10' : 'bg-gray-700/20'
                }`}>
                  <MaterialIcon name={getIcon(rule.type)} className={rule.enabled ? 'text-primary-blue' : 'text-gray-500'} />
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-white font-medium capitalize">{rule.type}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      rule.enabled ? 'bg-green-500/10 text-green-400' : 'bg-gray-500/10 text-gray-400'
                    }`}>
                      {rule.enabled ? 'Active' : 'Disabled'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-subtext">
                    Reward {rule.reward} XLM when reaching {rule.threshold} {rule.type}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleRule(rule.id)}
                    className={`p-2 rounded-lg transition-colors ${
                      rule.enabled 
                        ? 'bg-green-500/10 text-green-400 hover:bg-green-500/20' 
                        : 'bg-gray-500/10 text-gray-400 hover:bg-gray-500/20'
                    }`}
                  >
                    <MaterialIcon name={rule.enabled ? 'toggle_on' : 'toggle_off'} />
                  </button>
                  <button
                    onClick={() => deleteRule(rule.id)}
                    className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
                  >
                    <MaterialIcon name="delete" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <h3 className="text-lg font-semibold text-white mb-4">Smart Contract Settings</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-xl bg-dark-surface">
            <div>
              <p className="text-white font-medium">Prevent Duplicate Claims</p>
              <p className="text-sm text-gray-subtext">Users can only claim each reward once</p>
            </div>
            <button className="p-2 rounded-lg bg-green-500/10 text-green-400">
              <MaterialIcon name="toggle_on" />
            </button>
          </div>

          <div className="flex items-center justify-between p-4 rounded-xl bg-dark-surface">
            <div>
              <p className="text-white font-medium">Auto-Pause on Depletion</p>
              <p className="text-sm text-gray-subtext">Pause rewards when pool balance is low</p>
            </div>
            <button className="p-2 rounded-lg bg-green-500/10 text-green-400">
              <MaterialIcon name="toggle_on" />
            </button>
          </div>

          <div className="flex items-center justify-between p-4 rounded-xl bg-dark-surface">
            <div>
              <p className="text-white font-medium">Eligibility Verification</p>
              <p className="text-sm text-gray-subtext">Verify engagement before distributing rewards</p>
            </div>
            <button className="p-2 rounded-lg bg-green-500/10 text-green-400">
              <MaterialIcon name="toggle_on" />
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
};
