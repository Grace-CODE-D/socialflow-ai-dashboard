import * as StellarSdk from '@stellar/stellar-sdk';
import { horizonPool } from './horizonConnectionPool';
import { cacheLayer } from './cacheLayer';

export interface Asset {
  code: string;
  issuer: string;
  balance: string;
  limit?: string;
}

class StellarService {
  async getAccountBalances(publicKey: string): Promise<Asset[]> {
    // Check cache first
    const cached = cacheLayer.getBalance(publicKey);
    if (cached) return cached;

    // Fetch from Horizon using connection pool
    const balances = await horizonPool.execute(async (server) => {
      const account = await server.loadAccount(publicKey);
      return account.balances.map((balance: any) => ({
        code: balance.asset_type === 'native' ? 'XLM' : balance.asset_code,
        issuer: balance.asset_type === 'native' ? '' : balance.asset_issuer,
        balance: balance.balance,
        limit: balance.limit
      }));
    });

    // Cache the result
    cacheLayer.setBalance(publicKey, balances);
    return balances;
  }

  async createTrustline(publicKey: string, assetCode: string, assetIssuer: string): Promise<string> {
    return horizonPool.execute(async (server) => {
      const account = await server.loadAccount(publicKey);
      const asset = new StellarSdk.Asset(assetCode, assetIssuer);
      
      const transaction = new StellarSdk.TransactionBuilder(account, {
        fee: StellarSdk.BASE_FEE,
        networkPassphrase: StellarSdk.Networks.TESTNET
      })
        .addOperation(StellarSdk.Operation.changeTrust({ asset }))
        .setTimeout(180)
        .build();

      return transaction.toXDR();
    });
  }

  async removeTrustline(publicKey: string, assetCode: string, assetIssuer: string): Promise<string> {
    return horizonPool.execute(async (server) => {
      const account = await server.loadAccount(publicKey);
      const asset = new StellarSdk.Asset(assetCode, assetIssuer);
      
      const transaction = new StellarSdk.TransactionBuilder(account, {
        fee: StellarSdk.BASE_FEE,
        networkPassphrase: StellarSdk.Networks.TESTNET
      })
        .addOperation(StellarSdk.Operation.changeTrust({ asset, limit: '0' }))
        .setTimeout(180)
        .build();

      return transaction.toXDR();
    });
  }

  async submitTransaction(signedXDR: string): Promise<any> {
    const result = await horizonPool.execute(async (server) => {
      const transaction = StellarSdk.TransactionBuilder.fromXDR(signedXDR, StellarSdk.Networks.TESTNET);
      return await server.submitTransaction(transaction as any);
    });

    // Invalidate cache on successful transaction
    if (result.successful) {
      const tx = StellarSdk.TransactionBuilder.fromXDR(signedXDR, StellarSdk.Networks.TESTNET);
      const source = (tx as any).source;
      cacheLayer.onBalanceChange(source);
    }

    return result;
  }

  getPoolStats() {
    return horizonPool.getStats();
  }

  getCacheStats() {
    return cacheLayer.getStats();
  }
}

export default new StellarService();
