import { xdr, SorobanRpc } from '@stellar/stellar-sdk';

export interface ContractInvocationParams {
    contractId: string;
    method: string;
    args: xdr.ScVal[];
}

export interface ContractSimulationResult {
    success: boolean;
    result?: xdr.ScVal;
    cost: {
        cpuInstructions: string;
        memoryBytes: string;
    };
    minResourceFee: string;
    events?: SorobanRpc.Api.EventResponse[];
    error?: string;
}

export interface ContractInvocationResult {
    success: boolean;
    transactionHash?: string;
    result?: xdr.ScVal;
    events?: SorobanRpc.Api.EventResponse[];
    error?: string;
    errorType?: 'OUT_OF_GAS' | 'SIMULATION_FAILED' | 'TRANSACTION_FAILED' | 'UNKNOWN';
}

export interface WasmDeploymentParams {
    wasmBuffer: Buffer;
    salt?: Buffer;
}

export interface WasmDeploymentResult {
    success: boolean;
    contractId?: string;
    wasmHash?: string;
    transactionHash?: string;
    error?: string;
}

export interface SorobanConfig {
    rpcUrl: string;
    networkPassphrase: string;
}

export enum ContractCallType {
    READ_ONLY = 'READ_ONLY',
    STATE_CHANGING = 'STATE_CHANGING',
}
