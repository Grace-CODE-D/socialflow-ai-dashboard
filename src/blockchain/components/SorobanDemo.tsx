import React, { useState } from 'react';
import { useSorobanContract } from '../hooks/useSorobanContract';
import { addressToScVal, u64ToScVal, fromScVal } from '../utils/sorobanHelpers';

/**
 * Demo component showing Soroban contract integration
 * 
 * This component demonstrates:
 * - Wallet connection
 * - Read-only contract calls
 * - State-changing contract calls with signature
 * - Error handling
 */
export function SorobanDemo() {
    const [contractId, setContractId] = useState('');
    const [recipientAddress, setRecipientAddress] = useState('');
    const [amount, setAmount] = useState('');
    const [balance, setBalance] = useState<string | null>(null);

    const {
        wallet,
        isLoading,
        error,
        isConnected,
        connectWallet,
        disconnectWallet,
        readContract,
        writeContract,
        simulateContract,
    } = useSorobanContract(contractId || 'CCONTRACT_ID_PLACEHOLDER', 'TESTNET');

    const handleConnect = async () => {
        try {
            await connectWallet();
        } catch (err) {
            console.error('Connection failed:', err);
        }
    };

    const handleReadBalance = async () => {
        if (!wallet || !contractId) return;

        try {
            const result = await readContract('balance', [
                addressToScVal(wallet.publicKey),
            ]);

            const balanceValue = fromScVal(result);
            setBalance(balanceValue.toString());
        } catch (err) {
            console.error('Failed to read balance:', err);
        }
    };

    const handleTransfer = async () => {
        if (!wallet || !contractId || !recipientAddress || !amount) return;

        try {
            // First simulate to estimate costs
            const simulation = await simulateContract('transfer', [
                addressToScVal(wallet.publicKey),
                addressToScVal(recipientAddress),
                u64ToScVal(BigInt(amount)),
            ]);

            console.log('Simulation result:', simulation);

            // Then execute the transaction
            const result = await writeContract('transfer', [
                addressToScVal(wallet.publicKey),
                addressToScVal(recipientAddress),
                u64ToScVal(BigInt(amount)),
            ]);

            if (result.success) {
                alert(`Transfer successful! TX: ${result.transactionHash}`);
                // Refresh balance
                await handleReadBalance();
            }
        } catch (err) {
            console.error('Transfer failed:', err);
        }
    };

    return (
        <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
            <h2>Soroban Contract Bridge Demo</h2>

            {/* Wallet Connection */}
            <div style={{ marginBottom: '20px', padding: '15px', border: '1px solid #ccc', borderRadius: '8px' }}>
                <h3>Wallet Connection</h3>
                {!isConnected ? (
                    <button onClick={handleConnect} disabled={isLoading}>
                        {isLoading ? 'Connecting...' : 'Connect Wallet'}
                    </button>
                ) : (
                    <div>
                        <p>Connected: {wallet?.publicKey.substring(0, 8)}...{wallet?.publicKey.substring(wallet.publicKey.length - 8)}</p>
                        <p>Type: {wallet?.type}</p>
                        <button onClick={disconnectWallet}>Disconnect</button>
                    </div>
                )}
            </div>

            {/* Contract Configuration */}
            <div style={{ marginBottom: '20px', padding: '15px', border: '1px solid #ccc', borderRadius: '8px' }}>
                <h3>Contract Configuration</h3>
                <div style={{ marginBottom: '10px' }}>
                    <label>
                        Contract ID:
                        <input
                            type="text"
                            value={contractId}
                            onChange={(e) => setContractId(e.target.value)}
                            placeholder="CCONTRACT_ID_HERE"
                            style={{ width: '100%', padding: '8px', marginTop: '5px' }}
                        />
                    </label>
                </div>
            </div>

            {/* Read-Only Operations */}
            {isConnected && contractId && (
                <div style={{ marginBottom: '20px', padding: '15px', border: '1px solid #ccc', borderRadius: '8px' }}>
                    <h3>Read-Only Operations</h3>
                    <button onClick={handleReadBalance} disabled={isLoading}>
                        {isLoading ? 'Loading...' : 'Read Balance'}
                    </button>
                    {balance !== null && (
                        <p style={{ marginTop: '10px' }}>Balance: {balance}</p>
                    )}
                </div>
            )}

            {/* State-Changing Operations */}
            {isConnected && contractId && (
                <div style={{ marginBottom: '20px', padding: '15px', border: '1px solid #ccc', borderRadius: '8px' }}>
                    <h3>State-Changing Operations</h3>
                    <div style={{ marginBottom: '10px' }}>
                        <label>
                            Recipient Address:
                            <input
                                type="text"
                                value={recipientAddress}
                                onChange={(e) => setRecipientAddress(e.target.value)}
                                placeholder="GRECIPIENT_ADDRESS_HERE"
                                style={{ width: '100%', padding: '8px', marginTop: '5px' }}
                            />
                        </label>
                    </div>
                    <div style={{ marginBottom: '10px' }}>
                        <label>
                            Amount:
                            <input
                                type="number"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                placeholder="1000000"
                                style={{ width: '100%', padding: '8px', marginTop: '5px' }}
                            />
                        </label>
                    </div>
                    <button
                        onClick={handleTransfer}
                        disabled={isLoading || !recipientAddress || !amount}
                    >
                        {isLoading ? 'Processing...' : 'Transfer Tokens'}
                    </button>
                </div>
            )}

            {/* Error Display */}
            {error && (
                <div style={{ padding: '15px', backgroundColor: '#fee', border: '1px solid #fcc', borderRadius: '8px', color: '#c00' }}>
                    <strong>Error:</strong> {error}
                </div>
            )}

            {/* Instructions */}
            <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
                <h4>Instructions:</h4>
                <ol>
                    <li>Install Freighter or Albedo wallet extension</li>
                    <li>Click "Connect Wallet" to connect</li>
                    <li>Enter a valid Soroban contract ID</li>
                    <li>Use "Read Balance" for read-only calls (no signature required)</li>
                    <li>Use "Transfer Tokens" for state-changing calls (requires wallet signature)</li>
                </ol>
                <p><strong>Note:</strong> This demo uses Testnet. Make sure your wallet is configured for Testnet.</p>
            </div>
        </div>
    );
}
