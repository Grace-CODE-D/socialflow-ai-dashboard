/**
 * Example usage of SmartContractService
 * 
 * This file demonstrates how to interact with Soroban smart contracts
 */

import { SmartContractService } from '../services/SmartContractService';
import { ContractCallType } from '../types/soroban';
import {
    toScVal,
    fromScVal,
    addressToScVal,
    u64ToScVal,
    symbolToScVal,
} from '../utils/sorobanHelpers';

// Initialize service
const contractService = new SmartContractService('TESTNET');

/**
 * Example 1: Read-only contract call
 * This doesn't require wallet signature
 */
export async function readContractBalance(
    contractId: string,
    userAddress: string,
    sourceAccount: string
): Promise<bigint | null> {
    try {
        const result = await contractService.invoke(
            {
                contractId,
                method: 'balance',
                args: [addressToScVal(userAddress)],
            },
            sourceAccount,
            ContractCallType.READ_ONLY
        );

        if (result.success && result.result) {
            return fromScVal(result.result);
        }

        console.error('Failed to read balance:', result.error);
        return null;
    } catch (error) {
        console.error('Error reading contract balance:', error);
        return null;
    }
}

/**
 * Example 2: State-changing contract call
 * This requires wallet signature
 */
export async function transferTokens(
    contractId: string,
    fromAddress: string,
    toAddress: string,
    amount: bigint,
    sourceAccount: string,
    signTransaction: (xdr: string) => Promise<string>
): Promise<boolean> {
    try {
        const result = await contractService.invoke(
            {
                contractId,
                method: 'transfer',
                args: [
                    addressToScVal(fromAddress),
                    addressToScVal(toAddress),
                    u64ToScVal(amount),
                ],
            },
            sourceAccount,
            ContractCallType.STATE_CHANGING,
            signTransaction
        );

        if (result.success) {
            console.log('Transfer successful!');
            console.log('Transaction hash:', result.transactionHash);
            console.log('Events:', result.events);
            return true;
        }

        // Handle specific error types
        if (result.errorType === 'OUT_OF_GAS') {
            console.error('Transaction ran out of gas. Increase resource limits.');
        } else if (result.errorType === 'SIMULATION_FAILED') {
            console.error('Simulation failed:', result.error);
        } else {
            console.error('Transaction failed:', result.error);
        }

        return false;
    } catch (error) {
        console.error('Error transferring tokens:', error);
        return false;
    }
}

/**
 * Example 3: Deploy a WASM contract (admin function)
 */
export async function deployContract(
    wasmBuffer: Buffer,
    sourceAccount: string,
    signTransaction: (xdr: string) => Promise<string>
): Promise<string | null> {
    try {
        const result = await contractService.deployWasm(
            { wasmBuffer },
            sourceAccount,
            signTransaction
        );

        if (result.success) {
            console.log('Contract deployed successfully!');
            console.log('Contract ID:', result.contractId);
            console.log('WASM Hash:', result.wasmHash);
            console.log('Transaction Hash:', result.transactionHash);
            return result.contractId || null;
        }

        console.error('Deployment failed:', result.error);
        return null;
    } catch (error) {
        console.error('Error deploying contract:', error);
        return null;
    }
}

/**
 * Example 4: Get contract events
 */
export async function getRecentEvents(
    contractId: string,
    startLedger?: number
): Promise<void> {
    try {
        const events = await contractService.getContractEvents(
            contractId,
            startLedger
        );

        console.log(`Found ${events.length} events:`);
        events.forEach((event, index) => {
            console.log(`\nEvent ${index + 1}:`);
            console.log('  Type:', event.type);
            console.log('  Ledger:', event.ledger);
            console.log('  Contract ID:', event.contractId);
            console.log('  Transaction Hash:', event.txHash);
            console.log('  Topics:', event.topic);
        });
    } catch (error) {
        console.error('Error fetching events:', error);
    }
}

/**
 * Example 5: Check network health
 */
export async function checkNetworkHealth(): Promise<void> {
    try {
        const health = await contractService.getHealth();
        console.log('Network Status:', health.status);
        console.log('Latest Ledger:', health.ledger);
    } catch (error) {
        console.error('Error checking network health:', error);
    }
}

/**
 * Example 6: Simulate contract call before execution
 */
export async function simulateContractCall(
    contractId: string,
    method: string,
    args: any[],
    sourceAccount: string
): Promise<void> {
    try {
        const scValArgs = args.map(toScVal);

        const simulation = await contractService.simulate(
            {
                contractId,
                method,
                args: scValArgs,
            },
            sourceAccount
        );

        if (simulation.success) {
            console.log('Simulation successful!');
            console.log('Result:', simulation.result ? fromScVal(simulation.result) : 'void');
            console.log('CPU Instructions:', simulation.cost.cpuInstructions);
            console.log('Memory Bytes:', simulation.cost.memoryBytes);
            console.log('Min Resource Fee:', simulation.minResourceFee, 'stroops');
            console.log('Events:', simulation.events?.length || 0);
        } else {
            console.error('Simulation failed:', simulation.error);
        }
    } catch (error) {
        console.error('Error simulating contract call:', error);
    }
}
