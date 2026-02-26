import { useState, useEffect } from 'react';
// Assuming identityService exists in your services folder
import { identityService } from '/home/afolarinwa-soleye/socialflow-ai-dashboard/services/IndetificationService.ts';

export const useVerification = (publicKey: string) => {
  const [isVerified, setIsVerified] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const verifyIdentity = async () => {
      if (!publicKey) {
        setIsLoading(false);
        return;
      }

      try {
        // Requirement 18.4: Validate attestation signatures
        // This calls the service to check the Stellar ledger for attestations
        const status = await identityService.checkStatus(publicKey);
        setIsVerified(status.isValid);
      } catch (error) {
        console.error("Verification check failed:", error);
        setIsVerified(false);
      } finally {
        setIsLoading(false);
      }
    };

    verifyIdentity();
  }, [publicKey]);

  return { isVerified, isLoading };
};