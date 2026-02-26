import React, { useState, useEffect } from 'react';
import { stellarService } from '../src/blockchain/services/StellarService';
import { ViewProps } from '../types';

const MaterialIcon = ({ name }: { name: string }) => (
  <span className="material-symbols-outlined">{name}</span>
);

interface NetworkStatus {
  connected: boolean;
  network: string;
  horizonUrl: string;
}

interface Balance {
  asset: string;
  issuer: string;
  balance: number;
}

interface Transaction {
  id: string;
  created_at: string;
  source_account: string;
  type: string;
  successful: boolean;
}

export const DeveloperTools: React.FC<ViewProps> = () => {
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>({
    connected: false,
    network: 'Unknown',
    horizonUrl: ''
  });
  const [testAccount, setTestAccount] = useState('');
  const [balances, setBalances] = useState<Balance[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    checkNetworkStatus();
  }, []);

  const checkNetworkStatus = async () => {
    try {
      const isConnected = await stellarService.getNetworkStatus();
      const config = stellarService.getNetwork();
      setNetworkStatus({
        connected: isConnected,
        network: config.networkPassphrase.includes('Test') ? 'Testnet' : 'Mainnet',
        horizonUrl: config.horizonUrl
      });
    } catch (err) {
      setNetworkStatus(prev => ({ ...prev, connected: false }));
    }
  };

  const loadAccountData = async () => {
    if (!testAccount) {
      setError('Please enter a test account address');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const accountBalances = await stellarService.getBalances(testAccount);
      setBalances(accountBalances);

      const server = stellarService['getServer']();
      const txResponse = await server.transactions()
        .forAccount(testAccount)
        .limit(5)
        .order('desc')
        .call();

      setTransactions(txResponse.records.map((tx: any) => ({
        id: tx.id,
        created_at: tx.created_at,
        source_account: tx.source_account,
        type: tx.memo_type || 'none',
        successful: tx.successful
      })));
    } catch (err: any) {
      setError(err.message || 'Failed to load account data');
      setBalances([]);
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  const fundTestAccount = async () => {
    if (!testAccount) {
      setError('Please enter a test account address');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`https://friendbot.stellar.org?addr=${testAccount}`);
      if (response.ok) {
        alert('Test account funded successfully!');
        await loadAccountData();
      } else {
        throw new Error('Friendbot request failed');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fund account');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Developer Tools</h1>
          <p className="text-gray-subtext">Monitor network status and test blockchain operations</p>
        </div>
      </div>

      {/* Network Status */}
      <div className="bg-dark-card border border-white/5 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-white flex items-center gap-2">
            <MaterialIcon name="cloud" />
            Network Status
          </h2>
          <button
            onClick={checkNetworkStatus}
            className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm transition-colors"
          >
            Refresh
          </button>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="bg-dark-bg rounded-xl p-4">
            <div className="text-gray-subtext text-sm mb-1">Connection</div>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${networkStatus.connected ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-white font-medium">
                {networkStatus.connected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
          </div>

          <div className="bg-dark-bg rounded-xl p-4">
            <div className="text-gray-subtext text-sm mb-1">Network</div>
            <div className="text-white font-medium">{networkStatus.network}</div>
          </div>

          <div className="bg-dark-bg rounded-xl p-4">
            <div className="text-gray-subtext text-sm mb-1">Horizon URL</div>
            <div className="text-white font-medium text-xs truncate">{networkStatus.horizonUrl}</div>
          </div>
        </div>
      </div>

      {/* Test Account Input */}
      <div className="bg-dark-card border border-white/5 rounded-2xl p-6">
        <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
          <MaterialIcon name="account_circle" />
          Test Account
        </h2>

        <div className="flex gap-3 mb-4">
          <input
            type="text"
            value={testAccount}
            onChange={(e) => setTestAccount(e.target.value)}
            placeholder="Enter Stellar test account address (G...)"
            className="flex-1 bg-dark-bg border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-subtext focus:outline-none focus:border-primary-blue"
          />
          <button
            onClick={loadAccountData}
            disabled={loading}
            className="px-6 py-3 bg-primary-blue hover:bg-primary-blue/80 rounded-xl font-medium transition-colors disabled:opacity-50"
          >
            Load Data
          </button>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-red-400 text-sm">
            {error}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="bg-dark-card border border-white/5 rounded-2xl p-6">
        <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
          <MaterialIcon name="bolt" />
          Quick Actions
        </h2>

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={fundTestAccount}
            disabled={loading || !testAccount}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-primary-teal/10 hover:bg-primary-teal/20 border border-primary-teal/20 rounded-xl text-primary-teal font-medium transition-colors disabled:opacity-50"
          >
            <MaterialIcon name="account_balance" />
            Fund via Friendbot
          </button>

          <button
            onClick={() => copyToClipboard(testAccount)}
            disabled={!testAccount}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white font-medium transition-colors disabled:opacity-50"
          >
            <MaterialIcon name="content_copy" />
            Copy Address
          </button>
        </div>
      </div>

      {/* Account Balances */}
      {balances.length > 0 && (
        <div className="bg-dark-card border border-white/5 rounded-2xl p-6">
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <MaterialIcon name="account_balance_wallet" />
            Account Balances
          </h2>

          <div className="space-y-2">
            {balances.map((balance, idx) => (
              <div key={idx} className="bg-dark-bg rounded-xl p-4 flex items-center justify-between">
                <div>
                  <div className="text-white font-medium">{balance.asset}</div>
                  <div className="text-gray-subtext text-sm truncate max-w-xs">
                    {balance.issuer}
                  </div>
                </div>
                <div className="text-white font-bold text-lg">
                  {balance.balance.toFixed(7)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Transactions */}
      {transactions.length > 0 && (
        <div className="bg-dark-card border border-white/5 rounded-2xl p-6">
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <MaterialIcon name="receipt_long" />
            Recent Transactions
          </h2>

          <div className="space-y-2">
            {transactions.map((tx) => (
              <div key={tx.id} className="bg-dark-bg rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${tx.successful ? 'bg-green-500' : 'bg-red-500'}`} />
                    <span className="text-white font-medium text-sm">
                      {tx.successful ? 'Success' : 'Failed'}
                    </span>
                  </div>
                  <span className="text-gray-subtext text-xs">
                    {new Date(tx.created_at).toLocaleString()}
                  </span>
                </div>
                <div className="text-gray-subtext text-xs font-mono truncate">
                  {tx.id}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
