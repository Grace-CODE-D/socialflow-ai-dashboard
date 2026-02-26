import React, { useEffect, useState } from 'react';
import { identityService, VerificationStatus } from '../services/identityService';
import { VerificationBadge } from './VerificationBadge';

interface UserProfileCardProps {
  userId: string;
  username: string;
  displayName: string;
  avatar?: string;
  bio?: string;
}

/**
 * Example component showing how to use VerificationBadge in user profile contexts
 */
export const UserProfileCard: React.FC<UserProfileCardProps> = ({
  userId,
  username,
  displayName,
  avatar,
  bio
}) => {
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus>({ isVerified: false });

  useEffect(() => {
    loadVerificationStatus();
  }, [userId]);

  const loadVerificationStatus = async () => {
    const status = await identityService.getVerificationStatus(userId);
    setVerificationStatus(status);
  };

  return (
    <div className="bg-[#1A1D1F] rounded-lg p-6 border border-gray-700">
      <div className="flex items-start gap-4">
        <img
          src={avatar || 'https://picsum.photos/100/100'}
          alt={displayName}
          className="w-16 h-16 rounded-full object-cover"
        />
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-lg font-semibold text-white">{displayName}</h3>
            <VerificationBadge verificationStatus={verificationStatus} size="md" />
          </div>
          <p className="text-sm text-gray-400 mb-2">@{username}</p>
          {bio && <p className="text-sm text-gray-300">{bio}</p>}
        </div>
      </div>
    </div>
  );
};
