export interface ContractState {
  [key: string]: any;
}

export interface ContractStateEntry {
  key: string;
  value: any;
  lastModified: number;
}

export interface ContractInvocationParams {
  contractId: string;
  method: string;
  params: any[];
}

export interface ContractSimulationResult {
  result: any;
  estimatedFee: string;
  events: ContractEvent[];
}

export interface ContractEvent {
  type: string;
  contractId: string;
  topics: string[];
  data: any;
}

export interface WasmDeployParams {
  wasmBuffer: Buffer;
  salt?: string;
}
