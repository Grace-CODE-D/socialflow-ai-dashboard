# E2E Tests - Quick Start Guide

## 🚀 Getting Started in 5 Minutes

### 1. Run All Tests
```bash
npm run test:e2e
```

### 2. Run with Coverage
```bash
npm run test:e2e:coverage
```

### 3. View Reports
```bash
# Generate reports
npm run test:e2e:report

# Open HTML report
open test-results/e2e-report.html

# Open coverage report
open coverage/index.html
```

---

## 📋 Common Commands

### Development
```bash
# Watch mode (auto-rerun on changes)
npm run test:e2e:watch

# Run specific test file
npm run test tests/e2e/campaign.e2e.test.ts

# Run specific test suite
npm run test tests/e2e/campaign.e2e.test.ts -t "Campaign Creation"

# Run single test
npm run test tests/e2e/campaign.e2e.test.ts -t "should create campaign"
```

### Debugging
```bash
# Run with debug output
DEBUG=* npm run test:e2e

# Run with verbose output
npm run test:e2e -- --reporter=verbose

# Run and keep terminal open
npm run test:e2e -- --no-coverage
```

### CI/CD
```bash
# Full automated suite
npm run test:e2e:full

# With exit code handling
./tests/e2e/run-e2e-tests.sh
```

---

## 📊 Understanding Test Results

### Console Output
```
✓ Campaign Creation (4 tests)
  ✓ should create campaign with valid data
  ✓ should fail without required fields
  ✓ should validate budget constraints
  ✓ should create multiple campaigns

Test Files  2 passed (2)
     Tests  60 passed (60)
  Duration  12.5s
```

### Coverage Report
```
Lines      : 85.5%
Statements : 87.2%
Functions  : 82.1%
Branches   : 78.9%
```

---

## 🔍 Test Structure

### Test Files
```
tests/e2e/
├── campaign.e2e.test.ts          # Core E2E tests (40+ tests)
├── campaign.integration.test.ts  # Integration tests (20+ tests)
├── setup.ts                      # Test utilities
└── campaign.service.mock.ts      # Mock service
```

### Test Categories
1. **Campaign Creation** - Create and validate campaigns
2. **Campaign Management** - CRUD operations
3. **Participant Management** - Add and manage participants
4. **Reward Distribution** - Distribute rewards
5. **Reward Processing** - Process blockchain transactions
6. **Reward Claiming** - Claim rewards
7. **Campaign Statistics** - Calculate metrics
8. **Integration Tests** - Edge cases and concurrency

---

## 🎯 What Each Test Does

### Campaign Creation Tests
- ✅ Creates campaigns with valid data
- ✅ Validates required fields
- ✅ Checks budget constraints
- ✅ Handles multiple campaigns

### Campaign Management Tests
- ✅ Retrieves campaigns by ID
- ✅ Updates campaign details
- ✅ Starts/pauses/completes campaigns
- ✅ Deletes campaigns
- ✅ Validates state transitions

### Reward Distribution Tests
- ✅ Distributes to multiple recipients
- ✅ Validates budget sufficiency
- ✅ Tracks distributed amounts
- ✅ Handles batch operations

### Reward Processing Tests
- ✅ Processes pending rewards
- ✅ Simulates blockchain transactions
- ✅ Handles processing failures

### Reward Claiming Tests
- ✅ Allows recipients to claim
- ✅ Prevents unauthorized claims
- ✅ Prevents double claiming

---

## 🐛 Troubleshooting

### Tests Failing?

#### Check Node Version
```bash
node --version  # Should be 18+
```

#### Clean Install
```bash
rm -rf node_modules package-lock.json
npm install
```

#### Clear Test Cache
```bash
npm run test:e2e -- --clearCache
```

### Slow Tests?

#### Run Specific Tests
```bash
npm run test tests/e2e/campaign.e2e.test.ts
```

#### Skip Coverage
```bash
npm run test:e2e -- --no-coverage
```

### Coverage Not Generated?

#### Install Coverage Tool
```bash
npm install --save-dev @vitest/coverage-v8
```

#### Run with Coverage Flag
```bash
npm run test:e2e:coverage
```

---

## 📝 Writing New Tests

### Basic Test Template
```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { setupE2ETest } from './setup';
import { mockCampaignService } from './campaign.service.mock';

describe('My New Feature', () => {
  setupE2ETest();

  beforeEach(() => {
    mockCampaignService.clear();
  });

  it('should do something', async () => {
    // Arrange
    const campaign = await mockCampaignService.createCampaign({
      name: 'Test',
      budget: 1000,
      rewardAmount: 10,
    });

    // Act
    const result = await mockCampaignService.startCampaign(campaign.id);

    // Assert
    expect(result.status).toBe('active');
  });
});
```

### Best Practices
1. Use descriptive test names
2. Follow Arrange-Act-Assert pattern
3. Clean up in beforeEach/afterEach
4. Use assertion helpers
5. Test one thing per test
6. Keep tests fast (< 200ms)

---

## 🔗 Quick Links

- [Full Documentation](./README.md)
- [Test Scenarios](./TEST_SCENARIOS.md)
- [PR Summary](../../PR_SUMMARY_E2E_TESTS.md)
- [Implementation Summary](../../E2E_TEST_IMPLEMENTATION_SUMMARY.md)

---

## 💡 Tips

### Speed Up Tests
- Run specific test files
- Skip coverage during development
- Use watch mode for TDD
- Run tests in parallel (future)

### Better Debugging
- Use `it.only()` to run single test
- Use `console.log()` in tests
- Check mock service state
- Review error messages

### Maintain Tests
- Update tests when features change
- Remove obsolete tests
- Refactor for clarity
- Add tests for bugs found

---

## 🎓 Learning Resources

### Vitest Documentation
- [Getting Started](https://vitest.dev/guide/)
- [API Reference](https://vitest.dev/api/)
- [Configuration](https://vitest.dev/config/)

### Testing Best Practices
- [Testing JavaScript](https://testingjavascript.com/)
- [Test Patterns](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

---

## ✅ Checklist for New Tests

- [ ] Test name is descriptive
- [ ] Test is isolated (no dependencies)
- [ ] Cleanup in beforeEach/afterEach
- [ ] Assertions are clear
- [ ] Error cases tested
- [ ] Documentation updated
- [ ] Test passes locally
- [ ] Coverage maintained

---

## 🆘 Need Help?

1. Check [README.md](./README.md) for detailed docs
2. Review [TEST_SCENARIOS.md](./TEST_SCENARIOS.md) for examples
3. Look at existing tests for patterns
4. Ask team for guidance

---

**Happy Testing! 🧪**
