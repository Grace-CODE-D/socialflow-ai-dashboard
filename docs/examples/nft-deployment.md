# NFT Deployment Examples

Mint NFTs with IPFS storage and on-chain metadata.

## Basic NFT Creation

```typescript
// Upload image to IPFS
const imageFile = await readFile('./artwork.png')
const imageHash = await uploadToIPFS(imageFile)

// Create NFT metadata
const metadata = {
  name: 'Digital Artwork #1',
  description: 'Unique digital creation',
  image: `ipfs://${imageHash}`,
  attributes: [
    { trait_type: 'Artist', value: 'Creator Name' },
    { trait_type: 'Edition', value: '1/1' },
    { trait_type: 'Year', value: '2024' }
  ]
}

// Upload metadata
const metadataHash = await uploadToIPFS(JSON.stringify(metadata))

// Mint NFT
const nft = await stellar.mintNFT({
  metadataUri: `ipfs://${metadataHash}`,
  recipient: 'BUYER_ADDRESS'
})

console.log('NFT minted:', nft.id)
```

## NFT Collection

```typescript
// Create collection of 10 NFTs
const collection = []

for (let i = 1; i <= 10; i++) {
  const nft = await createNFT({
    name: `Collection Item #${i}`,
    description: `Part of limited collection`,
    image: await uploadImage(`./images/${i}.png`),
    attributes: [
      { trait_type: 'Number', value: i.toString() },
      { trait_type: 'Rarity', value: getRarity(i) }
    ]
  })
  
  collection.push(nft)
}

console.log('Collection created:', collection.length, 'NFTs')
```

## Dynamic NFT

```typescript
// NFT with updatable metadata
const dynamicNFT = await stellar.mintNFT({
  metadataUri: 'ipfs://initial-metadata',
  mutable: true
})

// Update metadata later
await stellar.updateNFTMetadata({
  nftId: dynamicNFT.id,
  newMetadataUri: 'ipfs://updated-metadata'
})
```

## NFT Marketplace Integration

```typescript
// List NFT for sale
await stellar.listNFT({
  nftId: 'NFT_ID',
  price: '100',
  asset: 'XLM'
})

// Purchase NFT
await stellar.purchaseNFT({
  nftId: 'NFT_ID',
  seller: 'SELLER_ADDRESS',
  price: '100'
})
```

## Batch Minting

```typescript
// Mint multiple NFTs efficiently
const nfts = await stellar.batchMintNFTs({
  collection: 'My Collection',
  items: [
    { name: 'NFT 1', image: 'ipfs://hash1' },
    { name: 'NFT 2', image: 'ipfs://hash2' },
    { name: 'NFT 3', image: 'ipfs://hash3' }
  ]
})

console.log('Batch minted:', nfts.length, 'NFTs')
```
