import { nftService } from '../../services/nftService';
import { ipfsService } from '../../services/ipfsService';
import { stellarService } from '../../services/stellarService';

jest.mock('../../services/ipfsService');
jest.mock('../../services/stellarService');

describe('NFT Minting Flow', () => {
  const mockMetadata = {
    name: 'Test NFT',
    description: 'Test Description',
    image: 'test.png'
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('uploads metadata to IPFS', async () => {
    const mockCID = 'QmTest123';
    (ipfsService.uploadJSON as jest.Mock).mockResolvedValue(mockCID);

    const cid = await ipfsService.uploadJSON(mockMetadata);
    expect(cid).toBe(mockCID);
  });

  it('mints NFT on Stellar', async () => {
    const mockCID = 'QmTest123';
    const mockTxHash = 'nft_tx_hash';
    
    (ipfsService.uploadJSON as jest.Mock).mockResolvedValue(mockCID);
    (stellarService.mintNFT as jest.Mock).mockResolvedValue(mockTxHash);

    const result = await nftService.mint({
      creator: 'GCREATOR123',
      metadata: mockMetadata
    });

    expect(result.txHash).toBe(mockTxHash);
    expect(result.metadataCID).toBe(mockCID);
  });

  it('handles IPFS upload failure', async () => {
    (ipfsService.uploadJSON as jest.Mock).mockRejectedValue(new Error('IPFS upload failed'));

    await expect(
      nftService.mint({
        creator: 'GCREATOR123',
        metadata: mockMetadata
      })
    ).rejects.toThrow('IPFS upload failed');
  });

  it('validates NFT metadata', async () => {
    await expect(
      nftService.mint({
        creator: 'GCREATOR123',
        metadata: { name: '' }
      })
    ).rejects.toThrow();
  });

  it('retrieves NFT metadata from IPFS', async () => {
    const mockCID = 'QmTest123';
    (ipfsService.getJSON as jest.Mock).mockResolvedValue(mockMetadata);

    const metadata = await nftService.getMetadata(mockCID);
    expect(metadata).toEqual(mockMetadata);
  });
});
