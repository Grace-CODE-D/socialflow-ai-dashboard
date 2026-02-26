import React, { useState } from 'react';
import { TrendingUp, Target, Wallet, CheckCircle, AlertCircle } from 'lucide-react';
import { paymentService, PaymentResult } from '../services/paymentService';

interface PromotionCampaign {
  id: string;
  postId: string;
  budget: number;
  currency: 'XLM' | 'TOKEN';
  goal: number;
  goalType: 'views' | 'likes' | 'shares';
  consumed: number;
  status: 'active' | 'completed' | 'paused';
  transactionId?: string;
  createdAt: Date;
}

export const PromotionManager: React.FC = () => {
  const [budget, setBudget] = useState<number>(50);
  const [currency, setCurrency] = useState<'XLM' | 'TOKEN'>('XLM');
  const [goal, setGoal] = useState<number>(1000);
  const [goalType, setGoalType] = useState<'views' | 'likes' | 'shares'>('views');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentResult, setPaymentResult] = useState<PaymentResult | null>(null);
  const [campaigns, setCampaigns] = useState<PromotionCampaign[]>([]);

  const handleCreatePromotion = async () => {
    setIsProcessing(true);
    setPaymentResult(null);

    const result = await paymentService.lockFunds({
      amount: budget,
      currency,
      treasuryAccount: paymentService.getTreasuryAccount()
    });

    setPaymentResult(result);
    setIsProcessing(false);

    if (result.success) {
      const newCampaign: PromotionCampaign = {
        id: `promo_${Date.now()}`,
        postId: 'post_example',
        budget,
        currency,
        goal,
        goalType,
        consumed: 0,
        status: 'active',
        transactionId: result.transactionId,
        createdAt: new Date()
      };
      setCampaigns([...campaigns, newCampaign]);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <TrendingUp className="w-8 h-8 text-purple-500" />
        <h1 className="text-3xl font-bold">Post Promotion</h1>
      </div>

      {/* Create Promotion Card */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Create New Promotion</h2>
        
        <div className="space-y-4">
          {/* Budget Selection */}
          <div>
            <label className="block text-sm font-medium mb-2">Budget</label>
            <div className="flex gap-2">
              <input
                type="number"
                value={budget}
                onChange={(e) => setBudget(Number(e.target.value))}
                className="flex-1 px-4 py-2 border rounded-lg"
                min="1"
              />
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value as 'XLM' | 'TOKEN')}
                className="px-4 py-2 border rounded-lg"
              >
                <option value="XLM">XLM</option>
                <option value="TOKEN">TOKEN</option>
              </select>
            </div>
          </div>

          {/* Goal Selection */}
          <div>
            <label className="block text-sm font-medium mb-2">Campaign Goal</label>
            <div className="flex gap-2">
              <input
                type="number"
                value={goal}
                onChange={(e) => setGoal(Number(e.target.value))}
                className="flex-1 px-4 py-2 border rounded-lg"
                min="1"
              />
              <select
                value={goalType}
                onChange={(e) => setGoalType(e.target.value as 'views' | 'likes' | 'shares')}
                className="px-4 py-2 border rounded-lg"
              >
                <option value="views">Views</option>
                <option value="likes">Likes</option>
                <option value="shares">Shares</option>
              </select>
            </div>
          </div>

          {/* Create Button */}
          <button
            onClick={handleCreatePromotion}
            disabled={isProcessing}
            className="w-full bg-purple-500 text-white py-3 rounded-lg font-semibold hover:bg-purple-600 disabled:bg-gray-400 flex items-center justify-center gap-2"
          >
            <Wallet className="w-5 h-5" />
            {isProcessing ? 'Processing Payment...' : 'Lock Funds & Create Promotion'}
          </button>

          {/* Payment Result */}
          {paymentResult && (
            <div className={`p-4 rounded-lg flex items-start gap-3 ${
              paymentResult.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
            }`}>
              {paymentResult.success ? (
                <CheckCircle className="w-5 h-5 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 mt-0.5" />
              )}
              <div>
                <p className="font-semibold">
                  {paymentResult.success ? 'Payment Successful!' : 'Payment Failed'}
                </p>
                {paymentResult.transactionId && (
                  <p className="text-sm mt-1">TX: {paymentResult.transactionId}</p>
                )}
                {paymentResult.error && (
                  <p className="text-sm mt-1">{paymentResult.error}</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Active Campaigns */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Active Campaigns</h2>
        
        {campaigns.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No active campaigns</p>
        ) : (
          <div className="space-y-4">
            {campaigns.map((campaign) => (
              <CampaignCard key={campaign.id} campaign={campaign} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

interface CampaignCardProps {
  campaign: PromotionCampaign;
}

const CampaignCard: React.FC<CampaignCardProps> = ({ campaign }) => {
  const progress = (campaign.consumed / campaign.budget) * 100;
  const goalProgress = Math.min((campaign.consumed / campaign.goal) * 100, 100);

  return (
    <div className="border rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-semibold">
            Sponsored
          </span>
          <span className="text-sm text-gray-500">
            {campaign.createdAt.toLocaleDateString()}
          </span>
        </div>
        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
          campaign.status === 'active' ? 'bg-green-100 text-green-700' :
          campaign.status === 'completed' ? 'bg-blue-100 text-blue-700' :
          'bg-gray-100 text-gray-700'
        }`}>
          {campaign.status}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-sm text-gray-500">Budget</p>
          <p className="text-lg font-semibold">
            {campaign.budget} {campaign.currency}
          </p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Goal</p>
          <p className="text-lg font-semibold">
            {campaign.goal} {campaign.goalType}
          </p>
        </div>
      </div>

      {/* Budget Consumption */}
      <div>
        <div className="flex justify-between text-sm mb-1">
          <span className="text-gray-600">Budget Consumed</span>
          <span className="font-semibold">{progress.toFixed(1)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-purple-500 h-2 rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Goal Progress */}
      <div>
        <div className="flex justify-between text-sm mb-1">
          <span className="text-gray-600">Goal Progress</span>
          <span className="font-semibold">{goalProgress.toFixed(1)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-green-500 h-2 rounded-full transition-all"
            style={{ width: `${goalProgress}%` }}
          />
        </div>
      </div>

      {campaign.transactionId && (
        <p className="text-xs text-gray-500 truncate">
          TX: {campaign.transactionId}
        </p>
      )}
    </div>
  );
};
