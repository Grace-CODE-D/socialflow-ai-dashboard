# NFT Creation

Mint NFTs with IPFS storage and on-chain metadata.

## Create NFT

```typescript
const nft = await createNFT({
  name: 'My Artwork',
  description: 'Digital art piece',
  image: imageFile,
  attributes: [
    { trait_type: 'Color', value: 'Blue' },
    { trait_type: 'Rarity', value: 'Rare' }
  ]
})
```

## IPFS Storage

Content is stored on IPFS via Pinata:

```typescript
const ipfsHash = await uploadToIPFS(file)
const url = `ipfs://${ipfsHash}`
```

## Metadata Standard

```json
{
  "name": "NFT Name",
  "description": "Description",
  "image": "ipfs://...",
  "attributes": []
}
```

## Minting Process

1. Upload media to IPFS
2. Create metadata JSON
3. Upload metadata to IPFS
4. Mint NFT on Stellar
5. Transfer to recipient

## Best Practices

- Use high-quality media
- Include detailed metadata
- Pin content permanently
- Verify IPFS availability
