import { renderHook, act } from '@testing-library/react';

const mockInvoke = vi.fn();
const mockSimulate = vi.fn();
const mockGetContractEvents = vi.fn();

vi.mock('../services/SmartContractService', () => ({
  SmartContractService: vi.fn().mockImplementation(() => ({
    invoke: mockInvoke,
    simulate: mockSimulate,
    getContractEvents: mockGetContractEvents,
  })),
}));

const mockAutoConnect = vi.fn();
const mockDisconnect = vi.fn();
const mockIsConnected = vi.fn();
const mockSignTransaction = vi.fn();
let disconnectCallback: (() => void) | null = null;

vi.mock('../services/WalletService', () => ({
  walletService: {
    autoConnect: (...args: any[]) => mockAutoConnect(...args),
    disconnect: (...args: any[]) => mockDisconnect(...args),
    isConnected: (...args: any[]) => mockIsConnected(...args),
    signTransaction: (...args: any[]) => mockSignTransaction(...args),
    onDisconnect: (listener: () => void) => {
      disconnectCallback = listener;
      return vi.fn();
    },
  },
}));

import { useSorobanContract } from './useSorobanContract';
import { ContractCallType } from '../types/soroban';

const WALLET = { publicKey: 'GABC123', name: 'Freighter', isConnected: true };

afterEach(() => {
  vi.clearAllMocks();
  disconnectCallback = null;
});

describe('useSorobanContract', () => {
  it('initializes with no wallet connected', () => {
    const { result } = renderHook(() => useSorobanContract('CONTRACT_ID'));

    expect(result.current.wallet).toBeNull();
    expect(result.current.isConnected).toBe(false);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('connects a wallet successfully', async () => {
    mockAutoConnect.mockResolvedValue(WALLET);
    const { result } = renderHook(() => useSorobanContract('CONTRACT_ID'));

    await act(async () => {
      await result.current.connectWallet();
    });

    expect(result.current.wallet).toEqual(WALLET);
    expect(result.current.isConnected).toBe(true);
    expect(result.current.isLoading).toBe(false);
  });

  it('sets an error when no wallet is available to connect', async () => {
    mockAutoConnect.mockResolvedValue(null);
    const { result } = renderHook(() => useSorobanContract('CONTRACT_ID'));

    await act(async () => {
      await result.current.connectWallet();
    });

    expect(result.current.wallet).toBeNull();
    expect(result.current.error).toMatch(/No wallet available/);
  });

  it('disconnects the wallet', async () => {
    mockAutoConnect.mockResolvedValue(WALLET);
    const { result } = renderHook(() => useSorobanContract('CONTRACT_ID'));

    await act(async () => {
      await result.current.connectWallet();
    });

    act(() => {
      result.current.disconnectWallet();
    });

    expect(mockDisconnect).toHaveBeenCalled();
    expect(result.current.wallet).toBeNull();
  });

  it('clears the wallet when the wallet service reports a disconnect event', async () => {
    mockAutoConnect.mockResolvedValue(WALLET);
    const { result } = renderHook(() => useSorobanContract('CONTRACT_ID'));

    await act(async () => {
      await result.current.connectWallet();
    });

    act(() => {
      disconnectCallback?.();
    });

    expect(result.current.wallet).toBeNull();
    expect(result.current.error).toMatch(/Wallet disconnected/);
  });

  it('throws when calling readContract without a connected wallet', async () => {
    const { result } = renderHook(() => useSorobanContract('CONTRACT_ID'));

    await expect(result.current.readContract('getBalance')).rejects.toThrow();
  });

  it('reads from a contract when wallet is connected', async () => {
    mockAutoConnect.mockResolvedValue(WALLET);
    mockInvoke.mockResolvedValue({ success: true, result: '42' });
    const { result } = renderHook(() => useSorobanContract('CONTRACT_ID'));

    await act(async () => {
      await result.current.connectWallet();
    });

    let value: any;
    await act(async () => {
      value = await result.current.readContract('getBalance');
    });

    expect(value).toBe('42');
    expect(mockInvoke).toHaveBeenCalledWith(
      { contractId: 'CONTRACT_ID', method: 'getBalance', args: [] },
      WALLET.publicKey,
      ContractCallType.READ_ONLY
    );
  });

  it('propagates an error when the read call fails', async () => {
    mockAutoConnect.mockResolvedValue(WALLET);
    mockInvoke.mockResolvedValue({ success: false, error: 'boom' });
    const { result } = renderHook(() => useSorobanContract('CONTRACT_ID'));

    await act(async () => {
      await result.current.connectWallet();
    });

    await expect(result.current.readContract('getBalance')).rejects.toThrow('boom');
    expect(result.current.error).toBe('boom');
  });

  it('writes to a contract when wallet is connected', async () => {
    mockAutoConnect.mockResolvedValue(WALLET);
    mockInvoke.mockResolvedValue({ success: true, result: 'ok' });
    const { result } = renderHook(() => useSorobanContract('CONTRACT_ID'));

    await act(async () => {
      await result.current.connectWallet();
    });

    let value: any;
    await act(async () => {
      value = await result.current.writeContract('transfer');
    });

    expect(value).toEqual({ success: true, result: 'ok' });
    expect(mockInvoke).toHaveBeenCalledWith(
      { contractId: 'CONTRACT_ID', method: 'transfer', args: [] },
      WALLET.publicKey,
      ContractCallType.STATE_CHANGING,
      expect.any(Function)
    );
  });

  it('surfaces a user-friendly error when a write runs out of gas', async () => {
    mockAutoConnect.mockResolvedValue(WALLET);
    mockInvoke.mockResolvedValue({ success: false, error: 'gas', errorType: 'OUT_OF_GAS' });
    const { result } = renderHook(() => useSorobanContract('CONTRACT_ID'));

    await act(async () => {
      await result.current.connectWallet();
    });

    await expect(result.current.writeContract('transfer')).rejects.toThrow(/out of gas/i);
  });

  it('simulates a contract call', async () => {
    mockAutoConnect.mockResolvedValue(WALLET);
    mockSimulate.mockResolvedValue({ success: true, result: 'sim' });
    const { result } = renderHook(() => useSorobanContract('CONTRACT_ID'));

    await act(async () => {
      await result.current.connectWallet();
    });

    let value: any;
    await act(async () => {
      value = await result.current.simulateContract('preview');
    });

    expect(value).toEqual({ success: true, result: 'sim' });
    expect(mockSimulate).toHaveBeenCalledWith(
      { contractId: 'CONTRACT_ID', method: 'preview', args: [] },
      WALLET.publicKey
    );
  });

  it('fetches contract events without requiring a wallet', async () => {
    mockGetContractEvents.mockResolvedValue([{ id: 'evt1' }]);
    const { result } = renderHook(() => useSorobanContract('CONTRACT_ID'));

    let events: any;
    await act(async () => {
      events = await result.current.getEvents(10, 20);
    });

    expect(events).toEqual([{ id: 'evt1' }]);
    expect(mockGetContractEvents).toHaveBeenCalledWith('CONTRACT_ID', 10, 20);
  });
});
