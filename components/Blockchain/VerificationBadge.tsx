import React, { useState, useEffect } from 'react';
import { identityService } from '/home/afolarinwa-soleye/socialflow-ai-dashboard/services/IndetificationService.ts';

interface VerificationBadgeProps {
  publicKey: string;
  size?: 'sm' | 'md' | 'lg';
  showTooltip?: boolean;
}

export const VerificationBadge: React.FC<VerificationBadgeProps> = ({ 
  publicKey, 
  size = 'md',
  showTooltip = true 
}) => {
  const [isVerified, setIsVerified] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const verify = async () => {
      setLoading(true);
      try {
        // Requirement 403.2: Fetch identity status
        const status = await identityService.checkStatus(publicKey);
        if (isMounted) setIsVerified(status.isValid);
      } catch (error) {
        if (isMounted) setIsVerified(false);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    verify();
    return () => { isMounted = false; };
  }, [publicKey]);

  if (loading || !isVerified) return null;

  const sizeMap = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  return (
    <div className="inline-flex items-center justify-center group relative ml-1">
      {/* Requirement 403.1: Badge icon with hover animation */}
      <svg 
        className={`${sizeMap[size]} text-blue-500 fill-current transform transition-all duration-300 ease-out group-hover:scale-125 group-hover:rotate-12 group-hover:drop-shadow-md`}
        viewBox="0 0 20 20"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" />
      </svg>

      {/* Requirement 18.5: Social Integrity Tooltip */}
      {showTooltip && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block pointer-events-none">
          <div className="bg-gray-800 text-white text-[10px] px-2 py-1 rounded shadow-lg whitespace-nowrap">
            Identity Verified on Stellar
          </div>
          <div className="w-2 h-2 bg-gray-800 rotate-45 mx-auto -mt-1"></div>
        </div>
      )}
    </div>
  );
};