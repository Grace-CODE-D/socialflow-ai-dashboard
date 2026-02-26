import { SmartContractService } from '../services/SmartContractService';
import { ContractInvocationParams, WasmDeployParams } from '../types/contract';

global.fetch = jest.fn();

describe('SmartContractService', () => {
  let service: SmartContractService;
  const mockRpcUrl = 'https://soroban-testnet.stellar.org';

  beforeEach(() => {
    service = new SmartContractService(mockRpcUrl);
    jest.clearAllMocks();
  });

  describe('RPC Connection and Health Check', () => {
    it('should return true when RPC is healthy', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({ result: { status: 'healthy' } }),
      });

      const isHealthy = await service.checkHealth();
      expect(isHealthy).toBe(true);
      expect(fetch).toHaveBeenCalledWith(mockRpcUrl, expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining('getHealth'),
      }));
    });

    it('should return false when RPC is unhealthy', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({ result: { status: 'unhealthy' } }),
      });

      const isHealthy = await service.checkHealth();
      expect(isHealthy).toBe(false);
    });

    it('should return false on connection error', async () => {
      (fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      const isHealthy = await service.checkHealth();
      expect(isHealthy).toBe(false);
    });
  });

  describe('Contract Invocation', () => {
    const mockParams: ContractInvocationParams = {
      contractId: 'CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD2KM',
      method: 'transfer',
      params: ['sender', 'recipient', 1000],
    };

    it('should invoke contract with write operation', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({ result: { success: true, txHash: '0x123' } }),
      });

      const result = await service.invokeContract(mockParams, false);
      expect(result.success).toBe(true);
      expect(fetch).toHaveBeenCalledWith(mockRpcUrl, expect.objectContaining({
        body: expect.stringContaining('sendTransaction'),
      }));
    });

    it('should invoke contract with read operation', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({ result: { balance: 5000 } }),
      });

      const result = await service.invokeContract(mockParams, true);
      expect(result.balance).toBe(5000);
      expect(fetch).toHaveBeenCalledWith(mockRpcUrl, expect.objectContaining({
        body: expect.stringContaining('simulateTransaction'),
      }));
    });

    it('should throw error on invalid params', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({ error: { message: 'invalid params' } }),
      });

      await expect(service.invokeContract(mockParams)).rejects.toThrow('Invalid parameters');
    });
  });

  describe('Simulation and Fee Estimation', () => {
    const mockParams: ContractInvocationParams = {
      contractId: 'CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD2KM',
      method: 'mint',
      params: ['recipient', 100],
    };

    it('should simulate transaction and return fee estimate', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({
          result: {
            result: { success: true },
            cost: { fee: '1000' },
            events: [],
          },
        }),
      });

      const simulation = await service.simulateTransaction(mockParams);
      expect(simulation.result.success).toBe(true);
      expect(simulation.estimatedFee).toBe('1000');
      expect(simulation.events).toEqual([]);
    });

    it('should parse events from simulation', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({
          result: {
            result: { success: true },
            cost: { fee: '500' },
            events: [
              { type: 'transfer', contractId: 'C123', topics: ['from', 'to'], data: { amount: 100 } },
            ],
          },
        }),
      });

      const simulation = await service.simulateTransaction(mockParams);
      expect(simulation.events).toHaveLength(1);
      expect(simulation.events[0].type).toBe('transfer');
      expect(simulation.events[0].topics).toEqual(['from', 'to']);
    });

    it('should throw error on simulation failure', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({ error: { message: 'out of gas' } }),
      });

      await expect(service.simulateTransaction(mockParams)).rejects.toThrow('Transaction out of gas');
    });
  });

  describe('WASM Deployment', () => {
    it('should deploy WASM successfully', async () => {
      const mockWasm = Buffer.from('mock-wasm-code');
      const params: WasmDeployParams = { wasmBuffer: mockWasm, salt: 'test-salt' };

      (fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({ result: { wasmId: 'wasm-123' } }),
      });

      const wasmId = await service.deployWasm(params);
      expect(wasmId).toBe('wasm-123');
      expect(fetch).toHaveBeenCalledWith(mockRpcUrl, expect.objectContaining({
        body: expect.stringContaining('uploadContractWasm'),
      }));
    });

    it('should deploy WASM without salt', async () => {
      const mockWasm = Buffer.from('mock-wasm-code');
      const params: WasmDeployParams = { wasmBuffer: mockWasm };

      (fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({ result: { wasmId: 'wasm-456' } }),
      });

      const wasmId = await service.deployWasm(params);
      expect(wasmId).toBe('wasm-456');
    });

    it('should throw error on deployment failure', async () => {
      const mockWasm = Buffer.from('invalid-wasm');
      const params: WasmDeployParams = { wasmBuffer: mockWasm };

      (fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({ error: { message: 'Invalid WASM' } }),
      });

      await expect(service.deployWasm(params)).rejects.toThrow('Invalid WASM');
    });
  });

  describe('Event Parsing', () => {
    it('should parse contract events correctly', () => {
      const rawEvents = [
        { type: 'transfer', contractId: 'C1', topics: ['from', 'to'], data: { amount: 100 } },
        { type: 'mint', contractId: 'C2', topics: ['recipient'], data: { amount: 50 } },
      ];

      const parsed = service.parseEvents(rawEvents);
      expect(parsed).toHaveLength(2);
      expect(parsed[0].type).toBe('transfer');
      expect(parsed[1].type).toBe('mint');
    });

    it('should handle events with missing fields', () => {
      const rawEvents = [{ data: { value: 123 } }];

      const parsed = service.parseEvents(rawEvents);
      expect(parsed[0].type).toBe('contract');
      expect(parsed[0].contractId).toBe('');
      expect(parsed[0].topics).toEqual([]);
    });

    it('should return empty array for no events', () => {
      const parsed = service.parseEvents([]);
      expect(parsed).toEqual([]);
    });
  });

  describe('Error Handling', () => {
    const mockParams: ContractInvocationParams = {
      contractId: 'C123',
      method: 'test',
      params: [],
    };

    it('should handle out-of-gas error', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({ error: { message: 'Transaction out of gas' } }),
      });

      await expect(service.invokeContract(mockParams)).rejects.toThrow('Transaction out of gas');
    });

    it('should handle invalid params error', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({ error: { message: 'invalid params provided' } }),
      });

      await expect(service.invokeContract(mockParams)).rejects.toThrow('Invalid parameters');
    });

    it('should handle unknown errors', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({ error: { message: 'Something went wrong' } }),
      });

      await expect(service.invokeContract(mockParams)).rejects.toThrow('Something went wrong');
    });
  });

  describe('Contract State Queries', () => {
    const contractId = 'CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD2KM';

    it('should query and return contract state', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({
          result: {
            entries: [
              { key: 'balance', val: 1000 },
              { key: 'owner', val: 'GABC...' },
            ],
          },
        }),
      });

      const state = await service.getContractState(contractId);
      expect(state.balance).toBe(1000);
      expect(state.owner).toBe('GABC...');
    });

    it('should cache contract state with TTL', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({
          result: { entries: [{ key: 'value', val: 42 }] },
        }),
      });

      await service.getContractState(contractId);
      await service.getContractState(contractId);

      expect(fetch).toHaveBeenCalledTimes(1);
    });

    it('should refresh cache after TTL expires', async () => {
      (fetch as jest.Mock)
        .mockResolvedValueOnce({
          json: async () => ({ result: { entries: [{ key: 'value', val: 1 }] } }),
        })
        .mockResolvedValueOnce({
          json: async () => ({ result: { entries: [{ key: 'value', val: 2 }] } }),
        });

      await service.getContractState(contractId);
      
      // Fast-forward time
      jest.spyOn(Date, 'now').mockReturnValue(Date.now() + 70000);
      
      const state = await service.getContractState(contractId);
      expect(state.value).toBe(2);
      expect(fetch).toHaveBeenCalledTimes(2);
    });

    it('should notify listeners on state change', async () => {
      const callback = jest.fn();
      service.onStateChange(contractId, callback);

      (fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({
          result: { entries: [{ key: 'count', val: 5 }] },
        }),
      });

      await service.getContractState(contractId);
      expect(callback).toHaveBeenCalledWith({ count: 5 });
    });

    it('should allow unsubscribing from state changes', async () => {
      const callback = jest.fn();
      const unsubscribe = service.onStateChange(contractId, callback);

      unsubscribe();

      (fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({
          result: { entries: [{ key: 'value', val: 10 }] },
        }),
      });

      await service.getContractState(contractId);
      expect(callback).not.toHaveBeenCalled();
    });

    it('should clear cache for specific contract', async () => {
      (fetch as jest.Mock).mockResolvedValue({
        json: async () => ({ result: { entries: [{ key: 'value', val: 1 }] } }),
      });

      await service.getContractState(contractId);
      service.clearCache(contractId);
      await service.getContractState(contractId);

      expect(fetch).toHaveBeenCalledTimes(2);
    });

    it('should clear all cache', async () => {
      (fetch as jest.Mock).mockResolvedValue({
        json: async () => ({ result: { entries: [] } }),
      });

      await service.getContractState('contract1');
      await service.getContractState('contract2');
      
      service.clearCache();
      
      await service.getContractState('contract1');
      expect(fetch).toHaveBeenCalledTimes(3);
    });
  });
});
