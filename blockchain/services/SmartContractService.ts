import {
  ContractState,
  ContractStateEntry,
  ContractInvocationParams,
  ContractSimulationResult,
  ContractEvent,
  WasmDeployParams,
} from '../types/contract';

interface StateCache {
  data: ContractState;
  timestamp: number;
  ttl: number;
}

interface StateChangeListener {
  contractId: string;
  callback: (state: ContractState) => void;
}

export class SmartContractService {
  private rpcUrl: string;
  private stateCache: Map<string, StateCache> = new Map();
  private stateListeners: StateChangeListener[] = [];
  private readonly DEFAULT_TTL = 60000; // 60 seconds

  constructor(rpcUrl: string) {
    this.rpcUrl = rpcUrl;
  }

  async checkHealth(): Promise<boolean> {
    try {
      const response = await fetch(this.rpcUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jsonrpc: '2.0', method: 'getHealth', id: 1 }),
      });
      const data = await response.json();
      return data.result?.status === 'healthy';
    } catch {
      return false;
    }
  }

  async getContractState(contractId: string): Promise<ContractState> {
    const cached = this.stateCache.get(contractId);
    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      return cached.data;
    }

    const entries = await this.queryContractStorage(contractId);
    const state = this.parseStateData(entries);
    
    this.stateCache.set(contractId, {
      data: state,
      timestamp: Date.now(),
      ttl: this.DEFAULT_TTL,
    });

    this.notifyStateChange(contractId, state);
    return state;
  }

  private async queryContractStorage(contractId: string): Promise<ContractStateEntry[]> {
    const response = await fetch(this.rpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'getLedgerEntries',
        params: { keys: [contractId] },
        id: 1,
      }),
    });

    const data = await response.json();
    if (data.error) throw new Error(data.error.message);
    
    return data.result?.entries || [];
  }

  private parseStateData(entries: any[]): ContractState {
    const state: ContractState = {};
    entries.forEach((entry) => {
      if (entry.key && entry.val) {
        state[entry.key] = entry.val;
      }
    });
    return state;
  }

  onStateChange(contractId: string, callback: (state: ContractState) => void): () => void {
    const listener = { contractId, callback };
    this.stateListeners.push(listener);
    return () => {
      this.stateListeners = this.stateListeners.filter((l) => l !== listener);
    };
  }

  private notifyStateChange(contractId: string, state: ContractState): void {
    this.stateListeners
      .filter((l) => l.contractId === contractId)
      .forEach((l) => l.callback(state));
  }

  async invokeContract(params: ContractInvocationParams, readOnly = false): Promise<any> {
    const method = readOnly ? 'simulateTransaction' : 'sendTransaction';
    const response = await fetch(this.rpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method,
        params: {
          contractId: params.contractId,
          function: params.method,
          args: params.params,
        },
        id: 1,
      }),
    });

    const data = await response.json();
    if (data.error) {
      throw new Error(this.parseError(data.error));
    }
    return data.result;
  }

  async simulateTransaction(params: ContractInvocationParams): Promise<ContractSimulationResult> {
    const response = await fetch(this.rpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'simulateTransaction',
        params: {
          contractId: params.contractId,
          function: params.method,
          args: params.params,
        },
        id: 1,
      }),
    });

    const data = await response.json();
    if (data.error) throw new Error(this.parseError(data.error));

    return {
      result: data.result?.result,
      estimatedFee: data.result?.cost?.fee || '0',
      events: this.parseEvents(data.result?.events || []),
    };
  }

  async deployWasm(params: WasmDeployParams): Promise<string> {
    const response = await fetch(this.rpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'uploadContractWasm',
        params: {
          wasm: params.wasmBuffer.toString('base64'),
          salt: params.salt,
        },
        id: 1,
      }),
    });

    const data = await response.json();
    if (data.error) throw new Error(this.parseError(data.error));
    return data.result?.wasmId;
  }

  parseEvents(rawEvents: any[]): ContractEvent[] {
    return rawEvents.map((event) => ({
      type: event.type || 'contract',
      contractId: event.contractId || '',
      topics: event.topics || [],
      data: event.data,
    }));
  }

  private parseError(error: any): string {
    if (error.message?.includes('out of gas')) return 'Transaction out of gas';
    if (error.message?.includes('invalid params')) return 'Invalid parameters';
    return error.message || 'Unknown error';
  }

  clearCache(contractId?: string): void {
    if (contractId) {
      this.stateCache.delete(contractId);
    } else {
      this.stateCache.clear();
    }
  }
}
