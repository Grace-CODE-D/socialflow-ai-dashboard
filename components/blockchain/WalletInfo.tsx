import React, { useState, useEffect } from 'react';
import { WalletState } from '../../types';
import { getWalletState, subscribe } from '../../store/blockchainSlice';

const MaterialIcon = ({ name, className }: { name: string, className?: string }) => (
  <span className={`material-symbols-outlined ${className}`}>{name}</span>
);

export const WalletInfo: React.FC = () => {
  const [walletState, setWalletState] = useState<WalletState>(getWalletState());
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribe(setWalletState);
    return unsubscribe;
  }, []);

  if (!walletState.isConnected || !walletState.publicKey) {
    return null;
  }

  const truncateAddress = (address: string): string => {
    if (address.length <= 12) return address;
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  const handleCopy = async () => {
    if (walletState.publicKey) {
      try {
        await navigator.clipboard.writeText(walletState.publicKey);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (error) {
        console.error('Failed to copy address:', error);
      }
    }
  };

  const formatBalance = (balance: string | null): string => {
    if (!balance) return '0.00';
    const num = parseFloat(balance);
    return num.toFixed(2);
  };

  const topTokens = walletState.tokenBalances.slice(0, 3);

  return (
    <div className="flex items-center gap-3 pl-6 border-l border-dark-border">
      {/* Network Badge */}
      <div className={`px-2 py-1 rounded-lg text-xs font-medium ${
        walletState.network === 'mainnet' 
          ? 'bg-green-500/10 text-green-400' 
          : 'bg-yellow-500/10 text-yellow-400'
      }`}>
        {walletState.network === 'mainnet' ? 'Mainnet' : 'Testnet'}
      </div>

      {/* Wallet Info Card */}
      <div className="bg-dark-surface border border-dark-border rounded-xl px-3 py-2 min-w-[200px]">
        {/* Public Key with Copy */}
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-xs font-mono text-white">
              {truncateAddress(walletState.publicKey)}
            </span>
          </div>
          <button
            onClick={handleCopy}
            className="text-gray-subtext hover:text-white transition-colors"
            title="Copy full address"
          >
            <MaterialIcon name={copied ? "check" : "content_copy"} className="text-sm" />
          </button>
        </div>

        {/* Balances */}
        <div className="space-y-1">
          {/* XLM Balance */}
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-subtext">XLM</span>
            <span className="text-white font-medium">
              {formatBalance(walletState.xlmBalance)}
            </span>
          </div>

          {/* Top 3 Token Balances */}
          {topTokens.map((token, index) => (
            <div key={index} className="flex items-center justify-between text-xs">
              <span className="text-gray-subtext">{token.code}</span>
              <span className="text-white font-medium">
                {formatBalance(token.balance)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
