import { createMockWalletProvider, MockWalletProvider } from '../../utils/testing/mockWalletProvider';

describe('MockWalletProvider', () => {
  let mockWallet: MockWalletProvider;

  beforeEach(() => {
    mockWallet = createMockWalletProvider();
  });

  afterEach(() => {
    mockWallet.reset();
  });

  describe('Connection', () => {
    it('should start disconnected', () => {
      expect(mockWallet.isConnected).toBe(false);
      expect(mockWallet.selectedAddress).toBeNull();
    });

    it('should connect successfully', async () => {
      const accounts = await mockWallet.connect();
      
      expect(mockWallet.isConnected).toBe(true);
      expect(mockWallet.selectedAddress).toBe(accounts[0]);
      expect(accounts).toHaveLength(1);
      expect(accounts[0]).toMatch(/^0x[a-fA-F0-9]{40}$/);
    });

    it('should emit connect event', async () => {
      const connectHandler = jest.fn();
      mockWallet.on('connect', connectHandler);
      
      await mockWallet.connect();
      
      expect(connectHandler).toHaveBeenCalledWith({ chainId: 1 });
    });

    it('should disconnect successfully', async () => {
      await mockWallet.connect();
      expect(mockWallet.isConnected).toBe(true);
      
      await mockWallet.disconnect();
      
      expect(mockWallet.isConnected).toBe(false);
      expect(mockWallet.selectedAddress).toBeNull();
    });

    it('should emit disconnect event', async () => {
      const disconnectHandler = jest.fn();
      mockWallet.on('disconnect', disconnectHandler);
      
      await mockWallet.connect();
      await mockWallet.disconnect();
      
      expect(disconnectHandler).toHaveBeenCalled();
    });
  });

  describe('Accounts', () => {
    beforeEach(async () => {
      await mockWallet.connect();
    });

    it('should return connected accounts', async () => {
      const accounts = await mockWallet.getAccounts();
      
      expect(accounts).toHaveLength(1);
      expect(accounts[0]).toBe(mockWallet.selectedAddress);
    });

    it('should return empty array when disconnected', async () => {
      await mockWallet.disconnect();
      const accounts = await mockWallet.getAccounts();
      
      expect(accounts).toHaveLength(0);
    });

    it('should get account balance', async () => {
      const balance = await mockWallet.getBalance(mockWallet.selectedAddress!);
      
      expect(balance).toBe('1000000000000000000000'); // 1000 ETH in wei
    });

    it('should throw error for unknown account', async () => {
      const unknownAddress = '0x1234567890123456789012345678901234567890';
      
      await expect(mockWallet.getBalance(unknownAddress)).rejects.toThrow(
        `Account ${unknownAddress} not found`
      );
    });
  });

  describe('Transactions', () => {
    beforeEach(async () => {
      await mockWallet.connect();
    });

    it('should send transaction successfully', async () => {
      const txHash = await mockWallet.sendTransaction({
        to: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b2',
        value: '1000000000000000000' // 1 ETH
      });
      
      expect(txHash).toMatch(/^0x[a-fA-F0-9]{64}$/);
    });

    it('should emit transaction sent event', async () => {
      const txSentHandler = jest.fn();
      mockWallet.on('transactionSent', txSentHandler);
      
      await mockWallet.sendTransaction({
        to: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b2',
        value: '1000000000000000000'
      });
      
      expect(txSentHandler).toHaveBeenCalled();
    });

    it('should throw error when not connected', async () => {
      await mockWallet.disconnect();
      
      await expect(mockWallet.sendTransaction({
        to: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b2',
        value: '1000000000000000000'
      })).rejects.toThrow('Wallet not connected');
    });

    it('should get transaction by hash', async () => {
      const txHash = await mockWallet.sendTransaction({
        to: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b2',
        value: '1000000000000000000'
      });
      
      const transaction = await mockWallet.getTransaction(txHash);
      
      expect(transaction).toBeDefined();
      expect(transaction!.hash).toBe(txHash);
      expect(transaction!.status).toBe('pending');
    });

    it('should wait for transaction confirmation', async () => {
      const txHash = await mockWallet.sendTransaction({
        to: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b2',
        value: '1000000000000000000'
      });
      
      const confirmedTx = await mockWallet.waitForTransaction(txHash);
      
      expect(confirmedTx.status).toBe('confirmed');
      expect(confirmedTx.blockNumber).toBeDefined();
    });

    it('should simulate transaction failure', async () => {
      mockWallet.simulateTransactionFailure(true);
      
      const txHash = await mockWallet.sendTransaction({
        to: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b2',
        value: '1000000000000000000'
      });
      
      await expect(mockWallet.waitForTransaction(txHash)).rejects.toThrow(
        `Transaction ${txHash} failed`
      );
    });
  });

  describe('Network', () => {
    it('should switch chain successfully', async () => {
      const chainChangedHandler = jest.fn();
      mockWallet.on('chainChanged', chainChangedHandler);
      
      await mockWallet.switchChain(137); // Polygon
      
      expect(mockWallet.chainId).toBe(137);
      expect(chainChangedHandler).toHaveBeenCalledWith('0x89');
    });

    it('should reject unsupported chain', async () => {
      await expect(mockWallet.switchChain(999)).rejects.toThrow(
        'Unsupported chain ID: 999'
      );
    });

    it('should add new chain', async () => {
      const chainAddedHandler = jest.fn();
      mockWallet.on('chainAdded', chainAddedHandler);
      
      const chainConfig = {
        chainId: '0x89',
        chainName: 'Polygon',
        rpcUrls: ['https://polygon-rpc.com']
      };
      
      await mockWallet.addChain(chainConfig);
      
      expect(chainAddedHandler).toHaveBeenCalledWith(chainConfig);
    });
  });

  describe('Utility Methods', () => {
    it('should reset to initial state', async () => {
      await mockWallet.connect();
      await mockWallet.sendTransaction({
        to: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b2',
        value: '1000000000000000000'
      });
      
      mockWallet.reset();
      
      expect(mockWallet.isConnected).toBe(false);
      expect(mockWallet.selectedAddress).toBeNull();
      expect(mockWallet.chainId).toBe(1);
      expect(mockWallet.transactions).toHaveLength(0);
    });

    it('should set account balance', async () => {
      await mockWallet.connect();
      const address = mockWallet.selectedAddress!;
      
      mockWallet.setBalance(address, '2000000000000000000000'); // 2000 ETH
      
      const balance = await mockWallet.getBalance(address);
      expect(balance).toBe('2000000000000000000000');
    });

    it('should emit balance changed event', async () => {
      await mockWallet.connect();
      const balanceChangedHandler = jest.fn();
      mockWallet.on('balanceChanged', balanceChangedHandler);
      
      const address = mockWallet.selectedAddress!;
      mockWallet.setBalance(address, '2000000000000000000000');
      
      expect(balanceChangedHandler).toHaveBeenCalledWith({
        address,
        balance: '2000000000000000000000'
      });
    });

    it('should add new account', () => {
      const newAccount = {
        address: '0x1234567890123456789012345678901234567890',
        balance: '500000000000000000000'
      };
      
      mockWallet.addAccount(newAccount);
      
      expect(mockWallet.accounts).toHaveLength(4); // 3 default + 1 new
      expect(mockWallet.accounts[3].address).toBe(newAccount.address);
    });

    it('should remove account', () => {
      const addressToRemove = mockWallet.accounts[0].address;
      
      mockWallet.removeAccount(addressToRemove);
      
      expect(mockWallet.accounts).toHaveLength(2);
      expect(mockWallet.accounts.find(acc => acc.address === addressToRemove)).toBeUndefined();
    });

    it('should get transaction history', async () => {
      await mockWallet.connect();
      const address = mockWallet.selectedAddress!;
      
      await mockWallet.sendTransaction({
        to: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b2',
        value: '1000000000000000000'
      });
      
      const history = mockWallet.getTransactionHistory(address);
      
      expect(history).toHaveLength(1);
      expect(history[0].from).toBe(address);
    });

    it('should clear transaction history', async () => {
      await mockWallet.connect();
      
      await mockWallet.sendTransaction({
        to: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b2',
        value: '1000000000000000000'
      });
      
      expect(mockWallet.transactions).toHaveLength(1);
      
      mockWallet.clearTransactionHistory();
      
      expect(mockWallet.transactions).toHaveLength(0);
    });
  });
});