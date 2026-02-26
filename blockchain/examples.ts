/**
 * Example usage of SmartContractService
 * This file demonstrates how to integrate the service into your application
 */

import { SmartContractService } from './services/SmartContractService';

// Initialize the service
const contractService = new SmartContractService(
  process.env.SOROBAN_RPC_URL || 'https://soroban-testnet.stellar.org'
);

// Example 1: Check RPC health before operations
async function checkConnection() {
  const isHealthy = await contractService.checkHealth();
  if (!isHealthy) {
    throw new Error('RPC connection is not healthy');
  }
  console.log('✓ RPC connection is healthy');
}

// Example 2: Query contract state with caching
async function getTokenBalance(contractId: string, address: string) {
  const state = await contractService.getContractState(contractId);
  return state[`balance_${address}`] || 0;
}

// Example 3: Monitor state changes in real-time
function watchContractState(contractId: string) {
  const unsubscribe = contractService.onStateChange(contractId, (newState) => {
    console.log('Contract state updated:', newState);
    // Update UI or trigger other actions
  });

  // Return cleanup function
  return unsubscribe;
}

// Example 4: Simulate before executing
async function transferWithSimulation(
  contractId: string,
  from: string,
  to: string,
  amount: number
) {
  // First simulate to get fee estimate
  const simulation = await contractService.simulateTransaction({
    contractId,
    method: 'transfer',
    params: [from, to, amount],
  });

  console.log(`Estimated fee: ${simulation.estimatedFee} stroops`);
  console.log(`Events: ${simulation.events.length}`);

  // If user approves, execute the transaction
  const result = await contractService.invokeContract(
    {
      contractId,
      method: 'transfer',
      params: [from, to, amount],
    },
    false
  );

  return result;
}

// Example 5: Deploy a new contract
async function deployNewContract(wasmCode: Buffer) {
  try {
    const wasmId = await contractService.deployWasm({
      wasmBuffer: wasmCode,
      salt: `deploy_${Date.now()}`,
    });
    console.log(`Contract deployed with WASM ID: ${wasmId}`);
    return wasmId;
  } catch (error) {
    console.error('Deployment failed:', error);
    throw error;
  }
}

// Example 6: Read-only contract query
async function getContractInfo(contractId: string) {
  const result = await contractService.invokeContract(
    {
      contractId,
      method: 'get_info',
      params: [],
    },
    true // read-only
  );
  return result;
}

// Example 7: Handle errors gracefully
async function safeContractCall(contractId: string, method: string, params: any[]) {
  try {
    return await contractService.invokeContract(
      { contractId, method, params },
      false
    );
  } catch (error: any) {
    if (error.message.includes('out of gas')) {
      console.error('Transaction failed: Insufficient gas');
      // Prompt user to increase gas limit
    } else if (error.message.includes('Invalid parameters')) {
      console.error('Transaction failed: Invalid parameters provided');
      // Show parameter validation error to user
    } else {
      console.error('Transaction failed:', error.message);
    }
    throw error;
  }
}

// Example 8: Batch operations with state monitoring
async function batchTransferWithMonitoring(
  contractId: string,
  transfers: Array<{ to: string; amount: number }>
) {
  const unsubscribe = watchContractState(contractId);

  try {
    const results = [];
    for (const transfer of transfers) {
      const result = await contractService.invokeContract(
        {
          contractId,
          method: 'transfer',
          params: ['sender', transfer.to, transfer.amount],
        },
        false
      );
      results.push(result);
    }
    return results;
  } finally {
    unsubscribe();
  }
}

// Example 9: Cache management
async function refreshContractData(contractId: string) {
  // Clear cache to force fresh data
  contractService.clearCache(contractId);
  
  // Fetch fresh state
  const state = await contractService.getContractState(contractId);
  return state;
}

// Example 10: Parse and display events
async function executeAndShowEvents(contractId: string, method: string, params: any[]) {
  const simulation = await contractService.simulateTransaction({
    contractId,
    method,
    params,
  });

  console.log('Transaction will emit the following events:');
  simulation.events.forEach((event, index) => {
    console.log(`Event ${index + 1}:`);
    console.log(`  Type: ${event.type}`);
    console.log(`  Contract: ${event.contractId}`);
    console.log(`  Topics: ${event.topics.join(', ')}`);
    console.log(`  Data:`, event.data);
  });

  return simulation;
}

export {
  checkConnection,
  getTokenBalance,
  watchContractState,
  transferWithSimulation,
  deployNewContract,
  getContractInfo,
  safeContractCall,
  batchTransferWithMonitoring,
  refreshContractData,
  executeAndShowEvents,
};
