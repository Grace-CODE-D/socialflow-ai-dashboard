import {
  rpc,
  Networks,
  TransactionBuilder,
  BASE_FEE,
  Contract,
  Keypair,
  Operation,
  xdr,
  StrKey,
} from '@stellar/stellar-sdk';

export interface SimulationResult {
  success: boolean;
  cpuInstructions: number;
  memoryBytes: number;
  gasFee: string;
  error?: string;
}

export interface DeploymentResult {
  success: boolean;
  contractId?: string;
  transactionHash?: string;
  error?: string;
}

export class SorobanService {
  private server: rpc.Server;
  private networkPassphrase: string;

  constructor(rpcUrl: string = 'https://soroban-testnet.stellar.org', isTestnet: boolean = true) {
    this.server = new rpc.Server(rpcUrl);
    this.networkPassphrase = isTestnet ? Networks.TESTNET : Networks.PUBLIC;
  }

  async simulateContract(
    contractId: string,
    method: string,
    params: xdr.ScVal[],
    sourceAccount: string
  ): Promise<SimulationResult> {
    try {
      const account = await this.server.getAccount(sourceAccount);
      const contract = new Contract(contractId);
      
      const transaction = new TransactionBuilder(account, {
        fee: BASE_FEE,
        networkPassphrase: this.networkPassphrase,
      })
        .addOperation(contract.call(method, ...params))
        .setTimeout(30)
        .build();

      const simulation = await this.server.simulateTransaction(transaction);

      if (rpc.Api.isSimulationSuccess(simulation)) {
        const cost = (simulation as any).cost || {};
        return {
          success: true,
          cpuInstructions: Number(cost.cpuInsns || 0),
          memoryBytes: Number(cost.memBytes || 0),
          gasFee: simulation.minResourceFee || '0',
        };
      }

      return {
        success: false,
        cpuInstructions: 0,
        memoryBytes: 0,
        gasFee: '0',
        error: simulation.error || 'Simulation failed',
      };
    } catch (error) {
      return {
        success: false,
        cpuInstructions: 0,
        memoryBytes: 0,
        gasFee: '0',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async deployContract(
    wasmHash: string,
    initParams: xdr.ScVal[],
    sourceKeypair: Keypair
  ): Promise<DeploymentResult> {
    try {
      const account = await this.server.getAccount(sourceKeypair.publicKey());
      
      const deployOp = Operation.invokeHostFunction({
        func: xdr.HostFunction.hostFunctionTypeUploadContractWasm(
          Buffer.from(wasmHash, 'hex')
        ),
        auth: [],
      });

      let transaction = new TransactionBuilder(account, {
        fee: BASE_FEE,
        networkPassphrase: this.networkPassphrase,
      })
        .addOperation(deployOp)
        .setTimeout(30)
        .build();

      const simulation = await this.server.simulateTransaction(transaction);

      if (!rpc.Api.isSimulationSuccess(simulation)) {
        return {
          success: false,
          error: simulation.error || 'Deployment simulation failed',
        };
      }

      transaction = rpc.assembleTransaction(
        transaction,
        simulation
      ).build();

      transaction.sign(sourceKeypair);

      const response = await this.server.sendTransaction(transaction);

      if (response.status === 'PENDING') {
        const hash = response.hash;
        let getResponse = await this.server.getTransaction(hash);
        
        while (getResponse.status === rpc.Api.GetTransactionStatus.NOT_FOUND) {
          await new Promise(resolve => setTimeout(resolve, 1000));
          getResponse = await this.server.getTransaction(hash);
        }

        if (getResponse.status === rpc.Api.GetTransactionStatus.SUCCESS) {
          const contractId = this.extractContractId(getResponse);
          return {
            success: true,
            contractId,
            transactionHash: hash,
          };
        }

        return {
          success: false,
          error: 'Transaction failed',
        };
      }

      return {
        success: false,
        error: response.errorResult?.toString() || 'Transaction submission failed',
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown deployment error',
      };
    }
  }

  private extractContractId(response: rpc.Api.GetSuccessfulTransactionResponse): string | undefined {
    if (!response.returnValue) return undefined;
    
    try {
      const scVal = response.returnValue;
      if (scVal.switch().name === 'scvAddress') {
        return StrKey.encodeContract(
          scVal.address().contractId()
        );
      }
    } catch (error) {
      console.error('Failed to extract contract ID:', error);
    }
    
    return undefined;
  }
}
