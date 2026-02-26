# Test Suite Documentation

## Component Tests (601.3)

### Wallet UI Components (101.6)
- **File**: `components/__tests__/Settings.test.tsx`
- **Coverage**: Wallet connection UI, balance display, transaction history

### Portfolio Components (102.8)
- **File**: `components/__tests__/AccountPerformance.test.tsx`
- **Coverage**: Portfolio metrics, asset allocation, performance charts

### NFT Components (103.7, 104.6)
- **File**: `components/__tests__/NFTGallery.test.tsx`
- **Coverage**: NFT gallery, virtual scrolling, item rendering
- **File**: `components/__tests__/IPFSUploader.test.tsx`
- **Coverage**: File upload, IPFS integration, progress tracking

### Payment Components (105.6)
- **File**: `components/__tests__/TransactionHistory.test.tsx` (existing)
- **Coverage**: Payment UI, transaction display, filtering

### Campaign Components (106.7)
- **File**: `components/__tests__/PromotionManager.test.tsx`
- **Coverage**: Campaign creation, management, status display

### Identity Components (107.7)
- **File**: `components/__tests__/VerificationBadge.test.tsx`
- **Coverage**: Verification badges, platform-specific displays

### Settings Components (109.6)
- **File**: `components/__tests__/Settings.test.tsx`
- **Coverage**: Settings UI, toggles, preferences

### Analytics Components (501.10)
- **File**: `components/__tests__/Analytics.test.tsx`
- **Coverage**: Charts, metrics, data visualization

## Integration Tests (601.4)

### Wallet Connection Flow
- **File**: `tests/integration/walletConnection.test.ts`
- **Tests**:
  - Freighter wallet connection
  - Connection failure handling
  - Wallet disconnection
  - Balance retrieval

### Payment Processing Flow
- **File**: `tests/integration/paymentProcessing.test.ts`
- **Tests**:
  - XLM payment processing
  - USDC payment processing
  - Amount validation
  - Insufficient balance handling

### NFT Minting Flow
- **File**: `tests/integration/nftMinting.test.ts`
- **Tests**:
  - IPFS metadata upload
  - NFT minting on Stellar
  - Metadata validation
  - IPFS retrieval

### Campaign Creation Flow
- **File**: `tests/integration/campaignCreation.test.ts`
- **Tests**:
  - Contract deployment
  - Treasury funding
  - Parameter validation
  - Status retrieval
  - Reward distribution

### Identity Verification Flow
- **File**: `tests/integration/identityVerification.test.ts`
- **Tests**:
  - Verification initiation
  - Social proof verification
  - On-chain storage
  - Status retrieval
  - Verification revocation

## Running Tests

```bash
# Run all tests
npm test

# Run component tests only
npm test -- components/__tests__

# Run integration tests only
npm test -- tests/integration

# Run with coverage
npm run test:coverage

# Watch mode
npm run test:watch
```

## Test Coverage Goals

- **Global**: 80% across all metrics
- **Critical Services**: 100% coverage
- **Component Tests**: Focus on user interactions
- **Integration Tests**: Focus on complete workflows

## Test Utilities

Located in `tests/utils/testUtils.tsx`:
- Mock Stellar SDK
- Mock wallet connections
- Mock IPFS responses
- Custom render helpers
- Common test data

## Best Practices

1. **Isolation**: Each test is independent
2. **Mocking**: External services are mocked
3. **Assertions**: Clear, specific expectations
4. **Coverage**: All user paths tested
5. **Documentation**: Tests serve as documentation
