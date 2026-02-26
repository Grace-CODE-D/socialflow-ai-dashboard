import React from 'react';

interface OnChainProof {
  transactionHash: string;
  attestationData: string;
  blockNumber: number;
  signature: string;
  timestamp: string;
  network: 'testnet' | 'mainnet';
}

interface OnChainProofDisplayProps {
  proof: OnChainProof;
}

const MaterialIcon = ({ name, className }: { name: string; className?: string }) => (
  <span className={`material-symbols-outlined ${className}`}>{name}</span>
);

export const OnChainProofDisplay: React.FC<OnChainProofDisplayProps> = ({ proof }) => {
  const explorerUrl = `https://stellar.expert/explorer/${proof.network}/tx/${proof.transactionHash}`;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const ProofField = ({ label, value, copyable = false }: { label: string; value: string; copyable?: boolean }) => (
    <div className="bg-dark-bg rounded-lg p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-gray-subtext">{label}</span>
        {copyable && (
          <button
            onClick={() => copyToClipboard(value)}
            className="text-primary-blue hover:text-blue-400 transition-colors"
            title="Copy to clipboard"
          >
            <MaterialIcon name="content_copy" className="text-sm" />
          </button>
        )}
      </div>
      <div className="text-white font-mono text-sm break-all">{value}</div>
    </div>
  );

  return (
    <div className="bg-dark-surface rounded-xl p-6 space-y-4">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-primary-blue/20 flex items-center justify-center">
          <MaterialIcon name="verified" className="text-primary-blue text-xl" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-white">On-Chain Verification Proof</h3>
          <p className="text-sm text-gray-subtext">Immutable verification record on Stellar</p>
        </div>
      </div>

      <ProofField label="Transaction Hash" value={proof.transactionHash} copyable />
      
      <ProofField label="Attestation Data" value={proof.attestationData} copyable />
      
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-dark-bg rounded-lg p-4">
          <span className="text-sm text-gray-subtext block mb-2">Block Number</span>
          <div className="text-white font-semibold">{proof.blockNumber.toLocaleString()}</div>
        </div>
        <div className="bg-dark-bg rounded-lg p-4">
          <span className="text-sm text-gray-subtext block mb-2">Timestamp</span>
          <div className="text-white font-semibold">
            {new Date(proof.timestamp).toLocaleString()}
          </div>
        </div>
      </div>

      <ProofField label="Verification Signature" value={proof.signature} copyable />

      <a
        href={explorerUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-2 w-full bg-primary-blue hover:bg-blue-700 text-white py-3 px-4 rounded-lg transition-colors font-medium"
      >
        <MaterialIcon name="open_in_new" className="text-lg" />
        View on Stellar Expert
      </a>
    </div>
  );
};
