/**
 * Example React Component for Wallet Connection
 * Demonstrates how to integrate WalletService into a React application
 */

import React, { useState, useEffect } from 'react';
import { walletService } from '../services/WalletService';
import { WalletConnection, WalletException, WalletError } from '../types/wallet';

export const WalletConnectExample: React.FC = () => {
  const [connection, setConnection] = useState<WalletConnection | null>(null);
  const [availableProviders, setAvailableProviders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Load available providers
    const providers = walletService.getAvailableProviders();
    setAvailableProviders(providers);

    // Try to restore session
    restoreSession();

    return () => {
      // Cleanup on unmount
      walletService.destroy();
    };
  }, []);

  const restoreSession = async () => {
    try {
      const restored = await walletService.loadSession();
      if (restored) {
        const activeConnection = walletService.getActiveConnection();
        setConnection(activeConnection);
      }
    } catch (err) {
      console.error('Failed to restore session:', err);
    }
  };

  const handleConnect = async (providerName: string) => {
    setLoading(true);
    setError(null);

    try {
      const newConnection = await walletService.connectWallet(providerName, 'TESTNET');
      setConnection(newConnection);
    } catch (err) {
      if (err instanceof WalletException) {
        switch (err.code) {
          case WalletError.NOT_INSTALLED:
            setError(`${providerName} is not installed. Please install it first.`);
            break;
          case WalletError.USER_REJECTED:
            setError('Connection request was rejected.');
            break;
          default:
            setError(`Failed to connect: ${err.message}`);
        }
      } else {
        setError('An unexpected error occurred.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      await walletService.disconnectWallet();
      setConnection(null);
      setError(null);
    } catch (err) {
      console.error('Failed to disconnect:', err);
    }
  };

  const handleSignTransaction = async () => {
    if (!connection) return;

    setLoading(true);
    setError(null);

    try {
      // Example transaction XDR (replace with actual transaction)
      const mockXDR = 'AAAAAQAAAAA...';
      
      const result = await walletService.signTransaction(mockXDR);
      console.log('Transaction signed:', result);
      alert('Transaction signed successfully!');
    } catch (err) {
      if (err instanceof WalletException) {
        if (err.code === WalletError.USER_REJECTED) {
          setError('Transaction signing was rejected.');
        } else {
          setError(`Failed to sign transaction: ${err.message}`);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <h2>Stellar Wallet Connection</h2>

      {error && (
        <div style={{
          padding: '10px',
          marginBottom: '20px',
          backgroundColor: '#fee',
          border: '1px solid #fcc',
          borderRadius: '4px',
          color: '#c00'
        }}>
          {error}
        </div>
      )}

      {!connection ? (
        <div>
          <h3>Connect Your Wallet</h3>
          <p>Choose a wallet provider to connect:</p>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {availableProviders.map((provider) => (
              <button
                key={provider.name}
                onClick={() => handleConnect(provider.name)}
                disabled={!provider.isInstalled || loading}
                style={{
                  padding: '12px 20px',
                  fontSize: '16px',
                  backgroundColor: provider.isInstalled ? '#4CAF50' : '#ccc',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: provider.isInstalled ? 'pointer' : 'not-allowed',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px'
                }}
              >
                <span style={{ fontSize: '24px' }}>{provider.metadata.icon}</span>
                <div style={{ textAlign: 'left', flex: 1 }}>
                  <div style={{ fontWeight: 'bold' }}>{provider.metadata.name}</div>
                  <div style={{ fontSize: '12px', opacity: 0.9 }}>
                    {provider.isInstalled ? 'Click to connect' : 'Not installed'}
                  </div>
                </div>
              </button>
            ))}
          </div>

          {loading && (
            <div style={{ marginTop: '20px', textAlign: 'center' }}>
              Connecting...
            </div>
          )}
        </div>
      ) : (
        <div>
          <h3>Connected</h3>
          
          <div style={{
            padding: '15px',
            backgroundColor: '#e8f5e9',
            border: '1px solid #4CAF50',
            borderRadius: '4px',
            marginBottom: '20px'
          }}>
            <div style={{ marginBottom: '8px' }}>
              <strong>Provider:</strong> {connection.provider}
            </div>
            <div style={{ marginBottom: '8px' }}>
              <strong>Network:</strong> {connection.network}
            </div>
            <div style={{ wordBreak: 'break-all' }}>
              <strong>Public Key:</strong><br />
              <code style={{ fontSize: '12px' }}>{connection.publicKey}</code>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={handleSignTransaction}
              disabled={loading}
              style={{
                flex: 1,
                padding: '12px 20px',
                fontSize: '16px',
                backgroundColor: '#2196F3',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Sign Test Transaction
            </button>

            <button
              onClick={handleDisconnect}
              disabled={loading}
              style={{
                flex: 1,
                padding: '12px 20px',
                fontSize: '16px',
                backgroundColor: '#f44336',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Disconnect
            </button>
          </div>
        </div>
      )}

      <div style={{
        marginTop: '30px',
        padding: '15px',
        backgroundColor: '#f5f5f5',
        borderRadius: '4px',
        fontSize: '14px'
      }}>
        <h4 style={{ marginTop: 0 }}>Session Info</h4>
        <p>
          Your wallet session will automatically disconnect after 30 minutes of inactivity.
          Any wallet interaction will refresh the session timer.
        </p>
      </div>
    </div>
  );
};

export default WalletConnectExample;
