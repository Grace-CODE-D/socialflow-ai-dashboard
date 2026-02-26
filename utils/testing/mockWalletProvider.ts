import { EventEmitter } from 'events';

export interface MockWalletAccount {
  address: string;
  balance: string;
  chainId: number;
  isConnected: boolean;
}

export interface MockWalletTransaction {
  hash: string;
  from: string;
  to: string;
  value: string;
  gasLimit: string;
  gasPrice: string;
  nonce: number;
  data?: string;
  status: 'pending' | 'confirmed' | 'failed';
  blockNumber?: number;
  timestamp: Date;
}

export interface MockWalletProvider extends EventEmitter {
  isConnected: boolean;
  selectedAddress: string | null;
  chainId: number;
  accounts: MockWalletAccount[];
  transactions: MockWalletTransaction[];
  
  // Connection methods
  connect(): Promise<string[]>;
  disconnect(): Promise<void>;
  
  // Account methods
  getAccounts(): Promise<string[]>;
  getBalance(address: string): Promise<string>;
  
  // Transaction methods
  sendTransaction(transaction: Partial<MockWalletTransaction>): Promise<string>;
  getTransaction(hash: string): Promise<MockWalletTransaction | null>;
  waitForTransaction(hash: string): Promise<MockWalletTransaction>;
  
  // Network methods
  switchChain(chainId: number): Promise<void>;
  addChain(chainConfig: any): Promise<void>;
  
  // Utility methods
  reset(): void;
  setBalance(address: string, balance: string): void;
  setChainId(chainId: number): void;
  simulateTransactionFailure(shouldFail: boolean): void;
}

class MockWalletProviderImpl extends EventEmitter implements MockWalletProvider {
  public isConnected = false;
  public selectedAddress: string | null = null;
  public chainId = 1; // Ethereum mainnet
  public accounts: MockWalletAccount[] = [];
  public transactions: MockWalletTransaction[] = [];
  
  private shouldFailTransactions = false;
  private transactionDelay = 1000; // 1 second default delay

  constructor() {
    super();
    this.initializeDefaultAccounts();
  }

  private initializeDefaultAccounts(): void {
    this.accounts = [
      {
        address: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b1',
        balance: '1000000000000000000000', // 1000 ETH in wei
        chainId: this.chainId,
        isConnected: false
      },
      {
        address: '0x8ba1f109551bD432803012645Hac136c22C4B4d8b2',
        balance: '500000000000000000000', // 500 ETH in wei
        chainId: this.chainId,
        isConnected: false
      },
      {
        address: '0x9ca2f209551bD432803012645Hac136c22C4B4d8b3',
        balance: '250000000000000000000', // 250 ETH in wei
        chainId: this.chainId,
        isConnected: false
      }
    ];
  }

  async connect(): Promise<string[]> {
    return new Promise((resolve) => {
      setTimeout(() => {
        this.isConnected = true;
        this.selectedAddress = this.accounts[0].address;
        this.accounts[0].isConnected = true;
        
        this.emit('connect', { chainId: this.chainId });
        this.emit('accountsChanged', [this.selectedAddress]);
        
        resolve([this.selectedAddress]);
      }, 500); // Simulate connection delay
    });
  }

  async disconnect(): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(() => {
        this.isConnected = false;
        this.selectedAddress = null;
        this.accounts.forEach(account => account.isConnected = false);
        
        this.emit('disconnect');
        this.emit('accountsChanged', []);
        
        resolve();
      }, 200);
    });
  }

  async getAccounts(): Promise<string[]> {
    if (!this.isConnected) {
      return [];
    }
    return this.accounts
      .filter(account => account.isConnected)
      .map(account => account.address);
  }

  async getBalance(address: string): Promise<string> {
    const account = this.accounts.find(acc => acc.address.toLowerCase() === address.toLowerCase());
    if (!account) {
      throw new Error(`Account ${address} not found`);
    }
    return account.balance;
  }

  async sendTransaction(transaction: Partial<MockWalletTransaction>): Promise<string> {
    if (!this.isConnected || !this.selectedAddress) {
      throw new Error('Wallet not connected');
    }

    const hash = `0x${Math.random().toString(16).substring(2, 66)}`;
    const mockTransaction: MockWalletTransaction = {
      hash,
      from: transaction.from || this.selectedAddress,
      to: transaction.to || '0x0000000000000000000000000000000000000000',
      value: transaction.value || '0',
      gasLimit: transaction.gasLimit || '21000',
      gasPrice: transaction.gasPrice || '20000000000', // 20 gwei
      nonce: transaction.nonce || this.transactions.length,
      data: transaction.data,
      status: 'pending',
      timestamp: new Date()
    };

    this.transactions.push(mockTransaction);
    this.emit('transactionSent', mockTransaction);

    // Simulate transaction processing
    setTimeout(() => {
      const tx = this.transactions.find(t => t.hash === hash);
      if (tx) {
        if (this.shouldFailTransactions) {
          tx.status = 'failed';
          this.emit('transactionFailed', tx);
        } else {
          tx.status = 'confirmed';
          tx.blockNumber = Math.floor(Math.random() * 1000000) + 15000000;
          this.emit('transactionConfirmed', tx);
          
          // Update balances if it's a transfer
          if (tx.to && tx.value !== '0') {
            this.updateBalancesAfterTransaction(tx);
          }
        }
      }
    }, this.transactionDelay);

    return hash;
  }

  async getTransaction(hash: string): Promise<MockWalletTransaction | null> {
    return this.transactions.find(tx => tx.hash === hash) || null;
  }

  async waitForTransaction(hash: string): Promise<MockWalletTransaction> {
    return new Promise((resolve, reject) => {
      const checkTransaction = () => {
        const tx = this.transactions.find(t => t.hash === hash);
        if (tx && tx.status !== 'pending') {
          if (tx.status === 'confirmed') {
            resolve(tx);
          } else {
            reject(new Error(`Transaction ${hash} failed`));
          }
        } else {
          setTimeout(checkTransaction, 100);
        }
      };
      checkTransaction();
    });
  }

  async switchChain(chainId: number): Promise<void> {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if ([1, 3, 4, 5, 42, 137, 80001].includes(chainId)) {
          this.chainId = chainId;
          this.accounts.forEach(account => account.chainId = chainId);
          this.emit('chainChanged', `0x${chainId.toString(16)}`);
          resolve();
        } else {
          reject(new Error(`Unsupported chain ID: ${chainId}`));
        }
      }, 300);
    });
  }

  async addChain(chainConfig: any): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(() => {
        // Mock adding a new chain
        this.emit('chainAdded', chainConfig);
        resolve();
      }, 500);
    });
  }

  reset(): void {
    this.isConnected = false;
    this.selectedAddress = null;
    this.chainId = 1;
    this.transactions = [];
    this.shouldFailTransactions = false;
    this.transactionDelay = 1000;
    this.initializeDefaultAccounts();
    this.removeAllListeners();
  }

  setBalance(address: string, balance: string): void {
    const account = this.accounts.find(acc => acc.address.toLowerCase() === address.toLowerCase());
    if (account) {
      account.balance = balance;
      this.emit('balanceChanged', { address, balance });
    }
  }

  setChainId(chainId: number): void {
    this.chainId = chainId;
    this.accounts.forEach(account => account.chainId = chainId);
    this.emit('chainChanged', `0x${chainId.toString(16)}`);
  }

  simulateTransactionFailure(shouldFail: boolean): void {
    this.shouldFailTransactions = shouldFail;
  }

  setTransactionDelay(delay: number): void {
    this.transactionDelay = delay;
  }

  private updateBalancesAfterTransaction(tx: MockWalletTransaction): void {
    const fromAccount = this.accounts.find(acc => acc.address.toLowerCase() === tx.from.toLowerCase());
    const toAccount = this.accounts.find(acc => acc.address.toLowerCase() === tx.to.toLowerCase());
    
    if (fromAccount) {
      const currentBalance = BigInt(fromAccount.balance);
      const transferAmount = BigInt(tx.value);
      const gasUsed = BigInt(tx.gasLimit) * BigInt(tx.gasPrice);
      
      if (currentBalance >= transferAmount + gasUsed) {
        fromAccount.balance = (currentBalance - transferAmount - gasUsed).toString();
        this.emit('balanceChanged', { address: fromAccount.address, balance: fromAccount.balance });
      }
    }
    
    if (toAccount) {
      const currentBalance = BigInt(toAccount.balance);
      const transferAmount = BigInt(tx.value);
      toAccount.balance = (currentBalance + transferAmount).toString();
      this.emit('balanceChanged', { address: toAccount.address, balance: toAccount.balance });
    }
  }

  // Additional utility methods for testing
  addAccount(account: Partial<MockWalletAccount>): void {
    const newAccount: MockWalletAccount = {
      address: account.address || `0x${Math.random().toString(16).substring(2, 42)}`,
      balance: account.balance || '0',
      chainId: account.chainId || this.chainId,
      isConnected: account.isConnected || false
    };
    this.accounts.push(newAccount);
  }

  removeAccount(address: string): void {
    this.accounts = this.accounts.filter(acc => acc.address.toLowerCase() !== address.toLowerCase());
  }

  getTransactionHistory(address?: string): MockWalletTransaction[] {
    if (address) {
      return this.transactions.filter(tx => 
        tx.from.toLowerCase() === address.toLowerCase() || 
        tx.to.toLowerCase() === address.toLowerCase()
      );
    }
    return [...this.transactions];
  }

  clearTransactionHistory(): void {
    this.transactions = [];
  }
}

// Factory function to create mock wallet provider
export function createMockWalletProvider(): MockWalletProvider {
  return new MockWalletProviderImpl();
}

// Global mock for testing
export const mockWalletProvider = createMockWalletProvider();