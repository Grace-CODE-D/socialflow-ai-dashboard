import React, { useState } from 'react';
import { UserReward, ClaimStatus } from '../../blockchain/types/rewards';
import { FiX, FiCheck, FiAlertCircle, FiLoader, FiGift, FiExternalLink } from 'react-icons/fi';

interface RewardClaimModalProps {
  isOpen: boolean;
  onClose: () => void;
  rewards: UserReward[];
  onClaim: (rewardId: string) => Promise<string>;
}

export const RewardClaimModal: React.FC<RewardClaimModalProps> = ({
  isOpen,
  onClose,
  rewards,
  onClaim,
}) => {
  const [claimStatus, setClaimStatus] = useState<Record<string, ClaimStatus>>({});

  if (!isOpen) return null;

  const handleClaim = async (reward: UserReward) => {
    setClaimStatus({
      ...claimStatus,
      [reward.id]: { status: 'pending' },
    });

    try {
      const txHash = await onClaim(reward.id);
      setClaimStatus({
        ...claimStatus,
        [reward.id]: { status: 'success', txHash },
      });
    } catch (error: any) {
      setClaimStatus({
        ...claimStatus,
        [reward.id]: { status: 'error', error: error.message },
      });
    }
  };

  const availableRewards = rewards.filter(r => !r.claimed && r.eligibilityMet);
  const claimedRewards = rewards.filter(r => r.claimed);
  const ineligibleRewards = rewards.filter(r => !r.eligibilityMet);

  const totalAvailable = availableRewards.reduce((sum, r) => sum + parseFloat(r.amount), 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden border border-white/10">
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <FiGift className="text-3xl text-purple-400" />
            <div>
              <h2 className="text-2xl font-bold text-white">Your Rewards</h2>
              <p className="text-sm text-gray-400">
                {availableRewards.length} reward{availableRewards.length !== 1 ? 's' : ''} available
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <FiX className="text-xl text-gray-400" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
          {availableRewards.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Available Rewards</h3>
                <div className="text-right">
                  <p className="text-sm text-gray-400">Total Available</p>
                  <p className="text-xl font-bold text-purple-400">
                    {totalAvailable.toFixed(2)} {availableRewards[0]?.asset.code}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {availableRewards.map((reward) => {
                  const status = claimStatus[reward.id];
                  return (
                    <div
                      key={reward.id}
                      className="p-4 bg-white/5 rounded-lg border border-white/10 hover:border-purple-500/50 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <h4 className="font-semibold text-white">{reward.campaignName}</h4>
                          <p className="text-sm text-gray-400">
                            Earned {new Date(reward.earnedDate).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-purple-400">
                            {reward.amount} {reward.asset.code}
                          </p>
                        </div>
                      </div>

                      {status?.status === 'pending' && (
                        <div className="flex items-center gap-2 text-blue-400 text-sm">
                          <FiLoader className="animate-spin" />
                          <span>Processing claim...</span>
                        </div>
                      )}

                      {status?.status === 'success' && (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-green-400 text-sm">
                            <FiCheck />
                            <span>Claimed successfully!</span>
                          </div>
                          {status.txHash && (
                            <a
                              href={`https://stellar.expert/explorer/testnet/tx/${status.txHash}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 text-xs text-purple-400 hover:text-purple-300"
                            >
                              View transaction <FiExternalLink />
                            </a>
                          )}
                        </div>
                      )}

                      {status?.status === 'error' && (
                        <div className="flex items-center gap-2 text-red-400 text-sm">
                          <FiAlertCircle />
                          <span>{status.error || 'Failed to claim reward'}</span>
                        </div>
                      )}

                      {!status && (
                        <button
                          onClick={() => handleClaim(reward)}
                          className="w-full mt-3 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg font-semibold hover:opacity-90 transition-opacity"
                        >
                          Claim Reward
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {ineligibleRewards.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-white mb-4">Ineligible Rewards</h3>
              <div className="space-y-3">
                {ineligibleRewards.map((reward) => (
                  <div
                    key={reward.id}
                    className="p-4 bg-white/5 rounded-lg border border-red-500/30 opacity-60"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h4 className="font-semibold text-white">{reward.campaignName}</h4>
                        <p className="text-sm text-gray-400">
                          Earned {new Date(reward.earnedDate).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold text-gray-400">
                          {reward.amount} {reward.asset.code}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-red-400 text-sm">
                      <FiAlertCircle />
                      <span>{reward.reason || 'Eligibility criteria not met'}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {claimedRewards.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Claimed Rewards</h3>
              <div className="space-y-3">
                {claimedRewards.map((reward) => (
                  <div
                    key={reward.id}
                    className="p-4 bg-white/5 rounded-lg border border-green-500/30"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h4 className="font-semibold text-white">{reward.campaignName}</h4>
                        <p className="text-sm text-gray-400">
                          Claimed {new Date(reward.earnedDate).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold text-green-400">
                          {reward.amount} {reward.asset.code}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-green-400 text-sm">
                      <FiCheck />
                      <span>Claimed</span>
                    </div>
                    {reward.claimTxHash && (
                      <a
                        href={`https://stellar.expert/explorer/testnet/tx/${reward.claimTxHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs text-purple-400 hover:text-purple-300 mt-1"
                      >
                        View transaction <FiExternalLink />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {rewards.length === 0 && (
            <div className="text-center py-12">
              <FiGift className="text-6xl text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">No Rewards Yet</h3>
              <p className="text-gray-400">
                Start engaging with content to earn rewards!
              </p>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-white/10 bg-white/5">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg font-semibold transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
