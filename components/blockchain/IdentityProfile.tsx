import React, { useState } from 'react';
import { Globe, Edit2 } from 'lucide-react';
import { Card } from '../ui/Card';

interface IdentityProfileProps {
  onEditProfile: () => void;
}

interface ProfileData {
  name: string;
  bio: string;
  website: string;
  avatar: string;
  walletAddress: string;
}

export const IdentityProfile: React.FC<IdentityProfileProps> = ({ onEditProfile }) => {
  const [profile] = useState<ProfileData>({
    name: 'John Doe',
    bio: 'Content creator and blockchain enthusiast. Building the future of decentralized social media.',
    website: 'https://example.com',
    avatar: 'https://via.placeholder.com/150',
    walletAddress: 'GXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX'
  });

  return (
    <Card className="max-w-2xl mx-auto">
      <div className="flex flex-col items-center">
        <div className="relative mb-4">
          <img
            src={profile.avatar}
            alt={profile.name}
            className="w-32 h-32 rounded-full object-cover border-4 border-primary-blue"
          />
          <div className="absolute bottom-0 right-0 w-8 h-8 bg-green-500 rounded-full border-4 border-dark-surface" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">{profile.name}</h2>
        <div className="flex items-center gap-2 mb-4">
          <span className="text-sm text-gray-subtext font-mono">
            {profile.walletAddress.slice(0, 8)}...{profile.walletAddress.slice(-8)}
          </span>
        </div>
        <p className="text-gray-subtext text-center mb-4 max-w-md">{profile.bio}</p>
        {profile.website && (
          <a href={profile.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-primary-blue hover:text-primary-teal transition-colors mb-6">
            <Globe size={16} />
            <span className="text-sm">{profile.website}</span>
          </a>
        )}
        <button onClick={onEditProfile} className="flex items-center gap-2 px-6 py-3 bg-primary-blue hover:bg-primary-teal text-white rounded-lg transition-colors">
          <Edit2 size={18} />
          <span>Edit Profile</span>
        </button>
      </div>
    </Card>
  );
};
