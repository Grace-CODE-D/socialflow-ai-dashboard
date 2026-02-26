import React, { useState } from 'react';
import { VerificationStatus } from '../services/identityService';

interface VerificationBadgeProps {
  verificationStatus: VerificationStatus;
  size?: 'sm' | 'md' | 'lg';
  showTooltip?: boolean;
}

export const VerificationBadge: React.FC<VerificationBadgeProps> = ({
  verificationStatus,
  size = 'md',
  showTooltip = true
}) => {
  const [isTooltipVisible, setIsTooltipVisible] = useState(false);

  if (!verificationStatus.isVerified) {
    return null;
  }

  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  const handleViewOnChain = () => {
    if (verificationStatus.transactionHash) {
      const url = `https://stellar.expert/explorer/testnet/tx/${verificationStatus.transactionHash}`;
      window.open(url, '_blank');
    }
  };

  return (
    <div className="relative inline-block">
      <div
        className="cursor-pointer"
        onMouseEnter={() => showTooltip && setIsTooltipVisible(true)}
        onMouseLeave={() => setIsTooltipVisible(false)}
      >
        <svg
          className={`${sizeClasses[size]} text-blue-500`}
          fill="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
          <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="2" />
        </svg>
      </div>

      {showTooltip && isTooltipVisible && (
        <div className="absolute z-50 bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64 bg-[#1A1D1F] border border-gray-700 rounded-lg shadow-xl p-4">
          <div className="text-white text-sm space-y-2">
            <div className="font-semibold text-blue-400 flex items-center gap-2">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
              </svg>
              Verified on Stellar
            </div>
            
            {verificationStatus.verifiedAt && (
              <div className="text-gray-400 text-xs">
                Verified: {new Date(verificationStatus.verifiedAt).toLocaleDateString()}
              </div>
            )}

            {verificationStatus.attestations && verificationStatus.attestations.length > 0 && (
              <div className="text-xs">
                <div className="text-gray-400 mb-1">Attestations:</div>
                <div className="space-y-1">
                  {verificationStatus.attestations.map((attestation, idx) => (
                    <div key={idx} className="text-gray-300 truncate">
                      • {attestation}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {verificationStatus.transactionHash && (
              <button
                onClick={handleViewOnChain}
                className="w-full mt-2 bg-blue-600 hover:bg-blue-700 text-white text-xs py-2 px-3 rounded transition-colors flex items-center justify-center gap-1"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                View On-Chain Verification
              </button>
            )}
          </div>
          
          {/* Tooltip arrow */}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-px">
            <div className="border-8 border-transparent border-t-gray-700"></div>
          </div>
        </div>
      )}
    </div>
  );
};
