import { useState, useCallback } from 'react';
import { SmartContractService } from '../services/SmartContractService';
import { walletService, WalletInfo } from '../services/WalletService';
import { ContractCallType, ContractInvocationResult } from '../types/soroban';
import { xdr } from '@stellar/stellar-sdk';

/**
 * React hook for Soroban contract interactions
 */
export function useSorobanContract(
    contractId: string,
    network: 'TESTNET' | 'MAINNET' | 'FUTURENET' = 'TESTNET'
) {
    const [contractService] = useState(() => new SmartContractService(network));
    const [wallet, setWallet] = useState<WalletInfo | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    /**
     * Connect wallet
     */
    const connectWallet = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            const connectedWallet = await walletService.autoConnect();
            if (!connectedWallet) {
                throw new Error('No wallet available. Please install Freighter or Albedo.');
            }

            setWallet(connectedWallet);
            return connectedWallet;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to connect wallet';
            setError(errorMessage);
            return null;
        } finally {
            setIsLoading(false);
        }
    }, []);

    /**
     * Disconnect wallet
     */
    const disconnectWallet = useCallback(() => {
        walletService.disconnect();
        setWallet(null);
    }, []);

    /**
     * Read-only contract call
     */
    const readContract = useCallback(
        async (method: string, args: xdr.ScVal[] = []): Promise<any> => {
            if (!wallet) {
                throw new Error('Wallet not connected');
            }

            setIsLoading(true);
            setError(null);

            try {
                const result = await contractService.invoke(
                    { contractId, method, args },
                    wallet.publicKey,
                    ContractCallType.READ_ONLY
                );

                if (!result.success) {
                    throw new Error(result.error || 'Contract call failed');
                }

                return result.result;
            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : 'Contract call failed';
                setError(errorMessage);
                throw err;
            } finally {
                setIsLoading(false);
            }
        },
        [contractService, contractId, wallet]
    );

    /**
     * State-changing contract call (requires signature)
     */
    const writeContract = useCallback(
        async (method: string, args: xdr.ScVal[] = []): Promise<ContractInvocationResult> => {
            if (!wallet) {
                throw new Error('Wallet not connected');
            }

            setIsLoading(true);
            setError(null);

            try {
                const signTransaction = async (xdr: string) => {
                    return await walletService.signTransaction(xdr, network.toLowerCase());
                };

                const result = await contractService.invoke(
                    { contractId, method, args },
                    wallet.publicKey,
                    ContractCallType.STATE_CHANGING,
                    signTransaction
                );

                if (!result.success) {
                    const errorMessage = result.error || 'Transaction failed';
                    setError(errorMessage);

                    // Provide user-friendly error messages
                    if (result.errorType === 'OUT_OF_GAS') {
                        throw new Error('Transaction ran out of gas. Please try again with higher limits.');
                    } else if (result.errorType === 'SIMULATION_FAILED') {
                        throw new Error(`Simulation failed: ${errorMessage}`);
                    } else {
                        throw new Error(errorMessage);
                    }
                }

                return result;
            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : 'Transaction failed';
                setError(errorMessage);
                throw err;
            } finally {
                setIsLoading(false);
            }
        },
        [contractService, contractId, wallet, network]
    );

    /**
     * Simulate contract call
     */
    const simulateContract = useCallback(
        async (method: string, args: xdr.ScVal[] = []) => {
            if (!wallet) {
                throw new Error('Wallet not connected');
            }

            setIsLoading(true);
            setError(null);

            try {
                const result = await contractService.simulate(
                    { contractId, method, args },
                    wallet.publicKey
                );

                if (!result.success) {
                    throw new Error(result.error || 'Simulation failed');
                }

                return result;
            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : 'Simulation failed';
                setError(errorMessage);
                throw err;
            } finally {
                setIsLoading(false);
            }
        },
        [contractService, contractId, wallet]
    );

    /**
     * Get contract events
     */
    const getEvents = useCallback(
        async (startLedger?: number, endLedger?: number) => {
            setIsLoading(true);
            setError(null);

            try {
                const events = await contractService.getContractEvents(
                    contractId,
                    startLedger,
                    endLedger
                );
                return events;
            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : 'Failed to fetch events';
                setError(errorMessage);
                throw err;
            } finally {
                setIsLoading(false);
            }
        },
        [contractService, contractId]
    );

    return {
        // State
        wallet,
        isLoading,
        error,
        isConnected: !!wallet,

        // Actions
        connectWallet,
        disconnectWallet,
        readContract,
        writeContract,
        simulateContract,
        getEvents,
    };
}
