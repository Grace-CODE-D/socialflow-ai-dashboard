import React, { useState, useEffect } from 'react';
import { VerificationStatus } from '../services/identityService';

interface VerifiedAccount {
  platform: string;
  username: string;
  verifiedAt: string;
  transactionHash?: string;
}

interface VerifyProfileSectionProps {
  onVerifyClick: () => void;
}

const MaterialIcon = ({ name, className }: { name: string; className?: string }) => (
  <span className={`material-symbols-outlined ${className}`}>{name}</span>
);

export const VerifyProfileSection: React.FC<VerifyProfileSectionProps> = ({ onVerifyClick }) => {
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus>({
    isVerified: false,
  });
  const [verifiedAccounts, setVerifiedAccounts] = useState<VerifiedAccount[]>([]);

  useEffect(() => {
    loadVerificationData();
  }, []);

  const loadVerificationData = async () => {
    // Mock data - replace with actual API call
    setVerificationStatus({
      isVerified: true,
      verifiedAt: '2026-02-20T10:00:00Z',
      transactionHash: '0x1234567890abcdef',
      attestations: ['Twitter: @testuser', 'GitHub: testuser'],
    });

    setVerifiedAccounts([
      {
        platform: 'Twitter',
        username: '@testuser',
        verifiedAt: '2026-02-20T10:00:00Z',
        transactionHash: '0x1234567890abcdef',
      },
      {
        platform: 'GitHub',
        username: 'testuser',
        verifiedAt: '2026-02-21T14:30:00Z',
        transactionHash: '0xabcdef1234567890',
      },
    ]);
  };

  const viewOnChain = (txHash: string) => {
    window.open(`https://stellar.expert/explorer/testnet/tx/${txHash}`, '_blank');
  };

  return (
    <div className="bg-dark-surface rounded-xl p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-primary-blue/20 flex items-center justify-center">
            <MaterialIcon name="verified" className="text-primary-blue text-2xl" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Verify My Profile</h3>
            <p className="text-sm text-gray-subtext">Link and verify your social accounts on-chain</p>
          </div>
        </div>
        {verificationStatus.isVerified && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/20 rounded-lg">
            <MaterialIcon name="check_circle" className="text-green-400 text-sm" />
            <span className="text-sm font-medium text-green-400">Verified</span>
          </div>
        )}
      </div>

      {/* Verification Status */}
      <div className="bg-dark-bg rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-white">Verification Status</span>
          {verificationStatus.isVerified && verificationStatus.verifiedAt && (
            <span className="text-xs text-gray-subtext">
              Since {new Date(verificationStatus.verifiedAt).toLocaleDateString()}
            </span>
          )}
        </div>
        {verificationStatus.isVerified ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-green-400">
              <MaterialIcon name="check" className="text-sm" />
              <span>Profile verified on Stellar blockchain</span>
            </div>
            {verificationStatus.transactionHash && (
              <button
                onClick={() => viewOnChain(verificationStatus.transactionHash!)}
                className="text-xs text-primary-blue hover:text-blue-400 transition-colors flex items-center gap-1"
              >
                <MaterialIcon name="open_in_new" className="text-xs" />
                View on-chain verification
              </button>
            )}
          </div>
        ) : (
          <div className="text-sm text-gray-subtext">
            No verified accounts yet. Start by verifying your first social account.
          </div>
        )}
      </div>

      {/* Verified Accounts List */}
      {verifiedAccounts.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-white mb-3">Verified Accounts</h4>
          <div className="space-y-3">
            {verifiedAccounts.map((account, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3 bg-dark-bg rounded-lg hover:bg-white/5 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary-blue/20 flex items-center justify-center">
                    <MaterialIcon name="link" className="text-primary-blue" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-white">{account.platform}</span>
                      <MaterialIcon name="verified" className="text-primary-blue text-sm" />
                    </div>
                    <span className="text-xs text-gray-subtext">{account.username}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-xs text-gray-subtext">Verified</div>
                    <div className="text-xs text-white">
                      {new Date(account.verifiedAt).toLocaleDateString()}
                    </div>
                  </div>
                  {account.transactionHash && (
                    <button
                      onClick={() => viewOnChain(account.transactionHash!)}
                      className="p-2 hover:bg-white/5 rounded-lg transition-colors"
                      title="View on-chain"
                    >
                      <MaterialIcon name="open_in_new" className="text-primary-blue text-sm" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Verify New Account Button */}
      <button
        onClick={onVerifyClick}
        className="w-full flex items-center justify-center gap-2 bg-primary-blue hover:bg-blue-700 text-white py-3 px-4 rounded-lg transition-colors font-medium"
      >
        <MaterialIcon name="add_circle" className="text-lg" />
        Verify New Account
      </button>
    </div>
  );
};
