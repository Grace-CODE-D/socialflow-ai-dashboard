class WalletService {
  private connectedWallet: string | null = null;

  async connectFreighter(): Promise<string> {
    if (typeof window === 'undefined' || !(window as any).freighter) {
      throw new Error('Freighter wallet not installed');
    }
    
    const publicKey = await (window as any).freighter.getPublicKey();
    this.connectedWallet = publicKey;
    return publicKey;
  }

  async signTransaction(xdr: string): Promise<string> {
    if (!this.connectedWallet) {
      throw new Error('No wallet connected');
    }

    if (typeof window === 'undefined' || !(window as any).freighter) {
      throw new Error('Freighter wallet not available');
    }

    const signedXDR = await (window as any).freighter.signTransaction(xdr, 'TESTNET');
    return signedXDR;
  }

  getConnectedWallet(): string | null {
    return this.connectedWallet;
  }

  disconnect(): void {
    this.connectedWallet = null;
  }
}

export default new WalletService();
