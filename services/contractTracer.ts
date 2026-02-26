import { ContractExecution, ContractLog } from '../types';

type ContractExecutionListener = (execution: ContractExecution) => void;

class ContractTracer {
  private listeners: ContractExecutionListener[] = [];
  private executions: ContractExecution[] = [];
  private isTracing = false;
  private intervalId?: number;

  subscribe(listener: ContractExecutionListener): () => void {
    this.listeners.push(listener);
    
    if (!this.isTracing) {
      this.startTracing();
    }

    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
      if (this.listeners.length === 0) {
        this.stopTracing();
      }
    };
  }

  getExecutions(): ContractExecution[] {
    return [...this.executions];
  }

  clearExecutions(): void {
    this.executions = [];
  }

  traceExecution(contractAddress: string, method: string, parameters: any[]): Promise<ContractExecution> {
    return new Promise((resolve) => {
      const execution: ContractExecution = {
        id: `exec_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
        contractAddress,
        method,
        parameters,
        gasUsed: Math.floor(Math.random() * 100000) + 21000,
        gasLimit: 200000,
        status: 'pending',
        timestamp: new Date(),
        logs: []
      };

      this.addExecution(execution);

      // Simulate execution time
      setTimeout(() => {
        const success = Math.random() > 0.1; // 90% success rate
        
        execution.status = success ? 'success' : 'failed';
        execution.transactionHash = success ? `0x${Math.random().toString(16).substring(2, 66)}` : undefined;
        execution.blockNumber = success ? Math.floor(Math.random() * 1000000) + 15000000 : undefined;
        
        if (!success) {
          execution.error = this.generateRandomError();
        } else {
          execution.logs = this.generateRandomLogs(execution.id);
        }

        this.updateExecution(execution);
        resolve(execution);
      }, Math.random() * 3000 + 1000);
    });
  }

  private startTracing(): void {
    this.isTracing = true;
    
    // Simulate random contract executions
    this.intervalId = window.setInterval(() => {
      if (Math.random() > 0.8) {
        const contracts = [
          '0x1234567890123456789012345678901234567890',
          '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
          '0x9876543210987654321098765432109876543210'
        ];
        
        const methods = ['transfer', 'approve', 'mint', 'burn', 'swap', 'stake', 'unstake'];
        
        const contract = contracts[Math.floor(Math.random() * contracts.length)];
        const method = methods[Math.floor(Math.random() * methods.length)];
        const params = this.generateRandomParameters(method);
        
        this.traceExecution(contract, method, params);
      }
    }, 8000);
  }

  private stopTracing(): void {
    this.isTracing = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
    }
  }

  private generateRandomParameters(method: string): any[] {
    switch (method) {
      case 'transfer':
        return [`0x${Math.random().toString(16).substring(2, 42)}`, Math.floor(Math.random() * 1000000)];
      case 'approve':
        return [`0x${Math.random().toString(16).substring(2, 42)}`, Math.floor(Math.random() * 1000000)];
      case 'mint':
        return [`0x${Math.random().toString(16).substring(2, 42)}`, Math.floor(Math.random() * 100000)];
      case 'burn':
        return [Math.floor(Math.random() * 100000)];
      case 'swap':
        return [Math.floor(Math.random() * 1000), Math.floor(Math.random() * 1000), `0x${Math.random().toString(16).substring(2, 42)}`];
      case 'stake':
        return [Math.floor(Math.random() * 100000)];
      case 'unstake':
        return [Math.floor(Math.random() * 100000)];
      default:
        return [];
    }
  }

  private generateRandomError(): string {
    const errors = [
      'Insufficient balance',
      'Gas limit exceeded',
      'Revert: Transfer amount exceeds allowance',
      'Revert: ERC20: transfer to the zero address',
      'Revert: Ownable: caller is not the owner',
      'Revert: Pausable: paused',
      'Execution reverted'
    ];
    
    return errors[Math.floor(Math.random() * errors.length)];
  }

  private generateRandomLogs(executionId: string): ContractLog[] {
    const logCount = Math.floor(Math.random() * 3) + 1;
    const logs: ContractLog[] = [];
    
    for (let i = 0; i < logCount; i++) {
      logs.push({
        id: `log_${executionId}_${i}`,
        address: `0x${Math.random().toString(16).substring(2, 42)}`,
        topics: [
          `0x${Math.random().toString(16).substring(2, 66)}`,
          `0x${Math.random().toString(16).substring(2, 66)}`
        ],
        data: `0x${Math.random().toString(16).substring(2, 130)}`,
        blockNumber: Math.floor(Math.random() * 1000000) + 15000000,
        transactionHash: `0x${Math.random().toString(16).substring(2, 66)}`,
        logIndex: i
      });
    }
    
    return logs;
  }

  private addExecution(execution: ContractExecution): void {
    this.executions.unshift(execution);
    
    // Keep only last 50 executions
    if (this.executions.length > 50) {
      this.executions = this.executions.slice(0, 50);
    }
    
    this.notifyListeners(execution);
  }

  private updateExecution(execution: ContractExecution): void {
    const index = this.executions.findIndex(e => e.id === execution.id);
    if (index !== -1) {
      this.executions[index] = execution;
      this.notifyListeners(execution);
    }
  }

  private notifyListeners(execution: ContractExecution): void {
    this.listeners.forEach(listener => listener(execution));
  }
}

export const contractTracer = new ContractTracer();