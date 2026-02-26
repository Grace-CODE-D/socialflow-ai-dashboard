import React from 'react';
import { StagingDock } from './blockchain/StagingDock';
import { useStagingDock } from '../hooks/useStagingDock';
import { TransactionType, TransactionStatus } from '../types';

export const BlockchainDemo: React.FC = () => {
  const { addTransaction } = useStagingDock();

  const handleAddPayment = () => {
    addTransaction({
      type: TransactionType.PAYMENT,
      status: TransactionStatus.PENDING,
      description: 'Send 100 XLM to Alice',
      amount: '100',
      asset: 'XLM',
      recipient: 'GXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
      requiresSignature: true
    });
  };

  const handleMintToken = () => {
    addTransaction({
      type: TransactionType.TOKEN_MINT,
      status: TransactionStatus.PENDING,
      description: 'Mint 1000 SOCIAL tokens',
      amount: '1000',
      asset: 'SOCIAL',
      requiresSignature: true
    });
  };

  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold mb-4">Blockchain Transaction Demo</h2>
      <div className="flex gap-4">
        <button
          onClick={handleAddPayment}
          className="px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg"
        >
          Add Payment
        </button>
        <button
          onClick={handleMintToken}
          className="px-4 py-2 bg-green-500 hover:bg-green-600 rounded-lg"
        >
          Mint Token
        </button>
      </div>
      <StagingDock />
    </div>
  );
};
