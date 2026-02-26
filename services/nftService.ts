interface NFTMetadata {
  title: string;
  description: string;
  quantity: number;
}

interface MintResult {
  assetId: string;
  transactionHash: string;
  ipfsHash: string;
}

interface ProgressCallback {
  (step: 'ipfs' | 'minting', progress: number): void;
}

export class NFTService {
  private static instance: NFTService;

  public static getInstance(): NFTService {
    if (!NFTService.instance) {
      NFTService.instance = new NFTService();
    }
    return NFTService.instance;
  }

  /**
   * Upload file to IPFS
   */
  private async uploadToIPFS(file: File, onProgress?: ProgressCallback): Promise<string> {
    // Simulate IPFS upload with progress
    return new Promise((resolve) => {
      let progress = 0;
      const interval = setInterval(() => {
        progress += 10;
        onProgress?.('ipfs', progress);
        
        if (progress >= 100) {
          clearInterval(interval);
          // Return mock IPFS hash
          const mockHash = `Qm${Math.random().toString(36).substr(2, 44)}`;
          resolve(mockHash);
        }
      }, 100);
    });
  }

  /**
   * Upload metadata to IPFS
   */
  private async uploadMetadataToIPFS(metadata: NFTMetadata & { imageHash: string }): Promise<string> {
    // Simulate metadata upload
    await new Promise(resolve => setTimeout(resolve, 500));
    return `Qm${Math.random().toString(36).substr(2, 44)}`;
  }

  /**
   * Upload any data to IPFS (public method for general use)
   */
  public async uploadDataToIPFS(data: string): Promise<string> {
    // Simulate IPFS upload
    await new Promise(resolve => setTimeout(resolve, 300));
    return `Qm${Math.random().toString(36).substr(2, 44)}`;
  }

  /**
   * Mint NFT on blockchain
   */
  private async mintOnChain(
    metadataHash: string, 
    quantity: number,
    onProgress?: ProgressCallback
  ): Promise<{ assetId: string; transactionHash: string }> {
    // Simulate blockchain minting with progress
    return new Promise((resolve) => {
      let progress = 0;
      const interval = setInterval(() => {
        progress += 20;
        onProgress?.('minting', progress);
        
        if (progress >= 100) {
          clearInterval(interval);
          resolve({
            assetId: `NFT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            transactionHash: `0x${Math.random().toString(16).substr(2, 64)}`
          });
        }
      }, 200);
    });
  }

  /**
   * Main mint function - orchestrates the entire NFT minting process
   */
  public async mint(
    file: File,
    metadata: NFTMetadata,
    onProgress?: ProgressCallback
  ): Promise<MintResult> {
    try {
      // Step 1: Upload image to IPFS
      const imageHash = await this.uploadToIPFS(file, onProgress);

      // Step 2: Upload metadata to IPFS
      const metadataWithImage = {
        ...metadata,
        imageHash,
        image: `ipfs://${imageHash}`,
        createdAt: new Date().toISOString()
      };
      
      const metadataHash = await this.uploadMetadataToIPFS(metadataWithImage);

      // Step 3: Mint on blockchain
      const { assetId, transactionHash } = await this.mintOnChain(
        metadataHash,
        metadata.quantity,
        onProgress
      );

      return {
        assetId,
        transactionHash,
        ipfsHash: imageHash
      };
    } catch (error) {
      console.error('NFT minting failed:', error);
      throw new Error('Failed to mint NFT. Please try again.');
    }
  }

  /**
   * Get NFT details by asset ID
   */
  public async getNFTDetails(assetId: string): Promise<any> {
    // Mock implementation - in real app, this would query the blockchain
    return {
      assetId,
      owner: '0x1234...5678',
      metadata: {
        title: 'Sample NFT',
        description: 'A sample NFT description',
        image: 'ipfs://QmSample...'
      },
      mintedAt: new Date().toISOString()
    };
  }

  /**
   * Check if user has permission to mint NFTs
   */
  public async canMint(): Promise<boolean> {
    // Mock implementation - in real app, this would check wallet connection and permissions
    return true;
  }
}

// Export singleton instance
export const nftService = NFTService.getInstance();

// Export helper function for uploading to IPFS
export const uploadToIPFS = async (data: string): Promise<string> => {
  return nftService.uploadDataToIPFS(data);
};