/**
 * Blockchain Module Entry Point
 * Exports wallet services, smart contract services, and event parsing
 */

// Wallet Types & Services
export type {
  NetworkType,
  WalletProvider,
  WalletProviderMetadata,
  WalletConnection,
  WalletSession,
  SignTransactionResult,
  SignAuthEntryResult,
  WalletError,
  WalletException
} from './types/wallet';

export { WalletService, walletService } from './services/WalletService';
export { FreighterProvider } from './services/providers/FreighterProvider';
export { AlbedoProvider } from './services/providers/AlbedoProvider';

// Smart Contract & Soroban Services
export { SmartContractService, sorobanService } from './services/SmartContractService';
export type {
  ContractInvocationParams,
  ContractSimulationResult,
  ContractInvocationResult,
  WasmDeploymentParams,
  WasmDeploymentResult,
  SorobanConfig,
  ContractCallType,
} from './types/soroban';
