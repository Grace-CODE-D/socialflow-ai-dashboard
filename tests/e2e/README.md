# E2E Test Suite - Campaign System

## Overview
Comprehensive end-to-end tests for the SocialFlow campaign management and reward distribution system.

## Test Coverage

### Requirements Coverage
- **13.1-13.7**: Campaign Management
  - Campaign creation and validation
  - Campaign lifecycle management
  - Participant management
  - Campaign statistics and reporting

- **19.1-19.8**: Reward Distribution
  - Reward distribution to participants
  - Reward processing and blockchain transactions
  - Reward claiming by recipients
  - Budget management and tracking

## Test Files

### 1. `campaign.e2e.test.ts`
Main E2E test suite covering:
- Campaign creation with validation
- Campaign management (start, pause, complete, delete)
- Participant management
- Reward distribution
- Reward processing
- Reward claiming
- Campaign statistics
- Complete end-to-end workflow

**Test Count**: 40+ tests

### 2. `campaign.integration.test.ts`
Integration and edge case tests covering:
- Concurrent operations
- Budget management edge cases
- State transition validation
- Reward processing failures
- Multi-campaign scenarios
- Performance and scalability
- Data consistency

**Test Count**: 20+ tests

### 3. `setup.ts`
Test utilities and helpers:
- Mock Stellar SDK
- Mock localStorage
- Test data generators
- Assertion helpers
- Setup/teardown hooks

### 4. `campaign.service.mock.ts`
Mock campaign service implementation:
- Campaign CRUD operations
- Participant management
- Reward distribution logic
- Reward processing simulation
- Statistics calculation

## Running Tests

### Run All E2E Tests
```bash
npm run test:e2e
```

### Run Specific Test File
```bash
npm run test tests/e2e/campaign.e2e.test.ts
```

### Run with Coverage
```bash
npm run test:coverage
```

### Run in Watch Mode
```bash
npm run test:watch
```

## Test Scenarios

### Campaign Creation
- ✅ Create campaign with valid data
- ✅ Validate required fields
- ✅ Validate budget constraints
- ✅ Create multiple campaigns
- ✅ Handle concurrent creation

### Campaign Management
- ✅ Retrieve campaign by ID
- ✅ Update campaign details
- ✅ Start/pause/complete campaigns
- ✅ Delete campaigns
- ✅ Enforce state transitions
- ✅ Prevent invalid operations

### Participant Management
- ✅ Add participants to active campaigns
- ✅ Prevent duplicate participants
- ✅ Validate participant data
- ✅ Handle large participant counts
- ✅ Multi-campaign participation

### Reward Distribution
- ✅ Distribute rewards to participants
- ✅ Validate budget sufficiency
- ✅ Track total distributed amount
- ✅ Handle batch distributions
- ✅ Prevent over-distribution
- ✅ Concurrent distributions

### Reward Processing
- ✅ Process pending rewards
- ✅ Simulate blockchain transactions
- ✅ Handle processing failures
- ✅ Maintain data integrity
- ✅ Retry failed transactions

### Reward Claiming
- ✅ Allow recipients to claim rewards
- ✅ Prevent unauthorized claims
- ✅ Prevent double claiming
- ✅ Update participant statistics
- ✅ Track claimed rewards

### Statistics & Reporting
- ✅ Calculate campaign statistics
- ✅ Track budget utilization
- ✅ Monitor reward statuses
- ✅ Real-time updates
- ✅ Data consistency

## Test Data

### Mock Campaign
```typescript
{
  id: 'campaign_123',
  name: 'Test Campaign',
  description: 'A test campaign',
  budget: 10000,
  rewardAmount: 100,
  status: 'active',
  participants: [],
  totalDistributed: 0
}
```

### Mock Participant
```typescript
{
  id: 'participant_123',
  publicKey: 'GTEST...',
  username: 'testuser',
  engagementScore: 85,
  rewardsClaimed: 0
}
```

### Mock Reward
```typescript
{
  id: 'reward_123',
  campaignId: 'campaign_123',
  recipientPublicKey: 'GTEST...',
  amount: 100,
  assetCode: 'SOCIAL',
  status: 'pending',
  transactionHash: null
}
```

## Assertions

### Campaign Validation
```typescript
assertCampaignValid(campaign)
// Checks: id, name, budget, rewardAmount, status
```

### Reward Validation
```typescript
assertRewardValid(reward)
// Checks: id, campaignId, recipientPublicKey, amount, status
```

### Transaction Validation
```typescript
assertTransactionSuccessful(transaction)
// Checks: hash, successful flag
```

## Performance Targets

- Campaign creation: < 100ms
- Participant addition: < 50ms
- Reward distribution (batch of 50): < 1s
- Reward processing: < 200ms
- Statistics calculation: < 100ms

## Error Handling

### Expected Errors
- Invalid campaign data
- Insufficient budget
- Duplicate participants
- Invalid state transitions
- Unauthorized operations
- Processing failures

### Error Messages
All errors include descriptive messages:
```typescript
throw new Error('Campaign name is required');
throw new Error('Insufficient budget for reward distribution');
throw new Error('Can only add participants to active campaigns');
```

## Continuous Integration

### GitHub Actions Workflow
```yaml
name: E2E Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: npm install
      - run: npm run test:e2e
```

## Test Reports

### Coverage Report
Generated in `coverage/` directory:
- HTML report: `coverage/index.html`
- JSON report: `coverage/coverage-final.json`
- LCOV report: `coverage/lcov.info`

### Test Results
Generated in `test-results/` directory:
- JUnit XML: `test-results/junit.xml`
- JSON report: `test-results/results.json`

## Debugging Tests

### Enable Debug Logging
```bash
DEBUG=* npm run test:e2e
```

### Run Single Test
```typescript
it.only('should create campaign', async () => {
  // Test code
});
```

### Skip Test
```typescript
it.skip('should handle edge case', async () => {
  // Test code
});
```

## Best Practices

1. **Isolation**: Each test is independent
2. **Cleanup**: Use beforeEach/afterEach hooks
3. **Assertions**: Use descriptive expect messages
4. **Mocking**: Mock external dependencies
5. **Performance**: Keep tests fast (< 5s each)
6. **Readability**: Clear test names and structure
7. **Coverage**: Aim for > 80% code coverage

## Troubleshooting

### Tests Failing Randomly
- Check for race conditions
- Ensure proper cleanup in afterEach
- Verify mock data consistency

### Slow Tests
- Reduce wait times in mocks
- Use concurrent test execution
- Optimize data generation

### Coverage Gaps
- Review uncovered branches
- Add edge case tests
- Test error paths

## Contributing

### Adding New Tests
1. Create test file in `tests/e2e/`
2. Import setup utilities
3. Follow naming conventions
4. Add documentation
5. Update this README

### Test Naming Convention
```typescript
describe('Feature Name', () => {
  describe('Specific Functionality', () => {
    it('should do something specific', async () => {
      // Test implementation
    });
  });
});
```

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Testing Best Practices](https://testingjavascript.com/)
- [Stellar SDK Documentation](https://stellar.github.io/js-stellar-sdk/)

## Support

For issues or questions:
- Open an issue on GitHub
- Contact the development team
- Check existing test examples
