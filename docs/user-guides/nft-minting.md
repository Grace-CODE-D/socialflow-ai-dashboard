# NFT Minting Guide

## Overview
Create and mint NFTs (Non-Fungible Tokens) on the Stellar blockchain to tokenize your digital content with permanent on-chain provenance.

## What are NFTs?

NFTs are unique digital assets stored on the blockchain that represent:
- Digital art and media
- Content ownership
- Collectibles
- Proof of authenticity
- Access rights

## Prerequisites

- Connected Stellar wallet
- Minimum 2 XLM balance (for fees and reserves)
- Digital content file (image, video, or document)
- IPFS storage (handled automatically)

## Minting Your First NFT

### Step 1: Prepare Content

1. **Supported Formats**
   - Images: JPG, PNG, GIF, SVG (max 10MB)
   - Videos: MP4, WEBM (max 50MB)
   - Documents: PDF (max 5MB)

2. **Content Guidelines**
   - High resolution recommended
   - Original content only
   - Appropriate file size
   - Clear ownership rights

### Step 2: Access NFT Minter

1. Navigate to **Create Post** or **Media Library**
2. Click **"Mint as NFT"** button
3. NFT minting interface opens

### Step 3: Upload Content

1. **Upload File**
   - Click "Upload" or drag-and-drop
   - File uploads to IPFS automatically
   - IPFS hash generated
   - Preview displays

2. **Verify Upload**
   - Check preview rendering
   - Confirm file integrity
   - Note IPFS hash (CID)

### Step 4: Configure NFT Metadata

1. **Basic Information**
   - **Name**: NFT title (required)
   - **Description**: Detailed description (optional)
   - **Creator**: Auto-filled with your address
   - **Edition**: 1 of 1 (unique) or specify supply

2. **Advanced Metadata**
   - **Attributes**: Key-value pairs (e.g., "Color: Blue")
   - **External URL**: Link to additional content
   - **Royalties**: Set creator royalty percentage (0-10%)
   - **Collection**: Group related NFTs

3. **Example Metadata**
   ```json
   {
     "name": "Sunset Over Ocean",
     "description": "Original digital photograph",
     "image": "ipfs://QmXXX...XXX",
     "attributes": [
       {"trait_type": "Category", "value": "Photography"},
       {"trait_type": "Location", "value": "California"},
       {"trait_type": "Year", "value": "2026"}
     ],
     "creator": "GXXX...XXX",
     "royalty": 5
   }
   ```

### Step 5: Review and Mint

1. **Review Details**
   - Verify all metadata
   - Check IPFS links
   - Confirm asset details
   - Review estimated fees

2. **Estimated Costs**
   - Network fee: ~0.0001 XLM
   - Asset creation: 0.5 XLM (one-time reserve)
   - IPFS pinning: Free (included)
   - Total: ~0.5001 XLM

3. **Mint NFT**
   - Click "Mint NFT"
   - Wallet popup appears
   - Review transaction
   - Sign with wallet
   - Wait for confirmation (5-10 seconds)

### Step 6: Confirmation

1. **Success Notification**
   - NFT minted successfully
   - Asset code displayed
   - Transaction hash provided
   - IPFS metadata link

2. **View NFT**
   - Navigate to NFT Gallery
   - Find your minted NFT
   - View on Stellar Expert
   - Share with community

## NFT Management

### Viewing Your NFTs

1. **NFT Gallery**
   - Navigate to Portfolio → NFTs
   - Grid view of all owned NFTs
   - Filter by collection
   - Sort by date/name

2. **NFT Details**
   - Click NFT to view details
   - See metadata and attributes
   - View transaction history
   - Check current holder

### Transferring NFTs

1. **Initiate Transfer**
   - Open NFT details
   - Click "Transfer"
   - Enter recipient address
   - Add optional memo

2. **Complete Transfer**
   - Review recipient
   - Sign transaction
   - Confirm transfer
   - NFT moves to new owner

### Burning NFTs

1. **Permanent Deletion**
   - Open NFT details
   - Click "Burn NFT"
   - Confirm action (irreversible)
   - Sign transaction
   - NFT permanently destroyed

## Advanced Features

### NFT Collections

1. **Create Collection**
   - Group related NFTs
   - Set collection metadata
   - Define collection attributes
   - Mint multiple NFTs in series

2. **Collection Benefits**
   - Organized portfolio
   - Batch operations
   - Collection-level royalties
   - Enhanced discoverability

### Royalty Configuration

1. **Set Royalties**
   - Percentage: 0-10%
   - Recipient: Creator address
   - Automatic distribution
   - Secondary sale tracking

2. **How Royalties Work**
   - Applied on secondary sales
   - Paid to original creator
   - Enforced on-chain
   - Transparent tracking

### Limited Editions

1. **Create Series**
   - Set total supply (e.g., 100)
   - Mint sequentially
   - Track edition numbers
   - Scarcity value

2. **Edition Numbering**
   - Format: "1 of 100"
   - Unique identifiers
   - Verifiable on-chain
   - Collector appeal

## IPFS Integration

### What is IPFS?
- InterPlanetary File System
- Decentralized storage
- Content-addressed
- Permanent availability

### How SocialFlow Uses IPFS

1. **Automatic Upload**
   - Files uploaded to IPFS
   - Pinned for permanence
   - CID generated
   - Metadata stored

2. **Content Addressing**
   - Each file has unique CID
   - Immutable references
   - Verifiable integrity
   - Global accessibility

3. **Pinning Service**
   - SocialFlow pins your content
   - Ensures availability
   - Redundant storage
   - No additional cost

## NFT Standards

### Stellar NFT Format
```json
{
  "name": "Asset Name",
  "description": "Asset description",
  "image": "ipfs://QmXXX",
  "properties": {
    "creator": "GXXX...XXX",
    "created_at": "2026-02-26T00:00:00Z"
  }
}
```

### Metadata Standards
- Compatible with OpenSea
- Follows ERC-721 metadata
- Stellar-specific extensions
- Cross-platform support

## Best Practices

### Content Quality
✅ Use high-resolution files
✅ Optimize file sizes
✅ Test preview rendering
✅ Verify IPFS upload
✅ Keep backup copies

### Metadata
✅ Descriptive names
✅ Detailed descriptions
✅ Relevant attributes
✅ Accurate information
✅ Proper categorization

### Security
✅ Verify recipient addresses
✅ Keep transaction records
✅ Backup metadata
✅ Test on Testnet first
✅ Understand irreversibility

## Troubleshooting

### Upload Failed
**Causes:**
- File too large
- Unsupported format
- Network issues
- IPFS unavailable

**Solutions:**
- Compress file
- Convert format
- Check connection
- Retry upload

### Minting Failed
**Causes:**
- Insufficient balance
- Invalid metadata
- Network congestion
- Wallet disconnected

**Solutions:**
- Add XLM to wallet
- Fix metadata errors
- Wait and retry
- Reconnect wallet

### NFT Not Showing
**Causes:**
- Blockchain sync delay
- Cache issues
- Trustline not established
- Wrong network

**Solutions:**
- Wait 30 seconds
- Refresh page
- Check trustlines
- Verify network

## Costs Breakdown

| Operation | Cost | Description |
|-----------|------|-------------|
| Asset Creation | 0.5 XLM | One-time reserve |
| Network Fee | 0.0001 XLM | Per transaction |
| IPFS Upload | Free | Included |
| Metadata Storage | Free | On-chain |
| **Total** | **~0.5001 XLM** | Per NFT |

## Use Cases

### Digital Art
- Sell original artwork
- Prove authenticity
- Track provenance
- Earn royalties

### Content Monetization
- Exclusive content access
- Limited edition releases
- Fan engagement
- Community rewards

### Collectibles
- Trading cards
- Virtual items
- Event tickets
- Membership passes

## API Integration

For developers:

```javascript
// Mint NFT
const nft = await nftService.mint({
  file: fileBlob,
  metadata: {
    name: 'My NFT',
    description: 'Description',
    attributes: []
  }
});
```

See [API Documentation](../api/nft.md) for details.

## Support
- [IPFS Documentation](https://docs.ipfs.io)
- [Stellar Asset Documentation](https://developers.stellar.org/docs/issuing-assets)
- [Troubleshooting Guide](../troubleshooting/nft-issues.md)
