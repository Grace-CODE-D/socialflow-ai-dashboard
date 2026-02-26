# Test Coverage Configuration

## Overview

This document outlines the test coverage goals and configuration for the SocialFlow project.

## Coverage Goals

### Global Coverage Target: 80%

All code should maintain at least 80% coverage across:
- **Lines**: 80%
- **Statements**: 80%
- **Functions**: 80%
- **Branches**: 80%

### Critical Path Coverage: 100%

The following critical services require 100% test coverage:

1. **stellarService.ts** - Core blockchain integration
2. **paymentService.ts** - Payment processing
3. **walletService.ts** - Wallet management
4. **sorobanService.ts** - Smart contract interactions

## Running Tests

### Local Development

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage

# Generate coverage report with badges
npm run test:coverage:report
```

### CI/CD Integration

Tests run automatically on:
- Push to `develop` or `master` branches
- Pull requests to `develop` or `master` branches

The CI pipeline will:
1. Run all tests with coverage
2. Generate coverage reports
3. Upload to Codecov
4. Comment coverage on PRs
5. Fail if coverage thresholds are not met

## Coverage Reports

Coverage reports are generated in multiple formats:

- **HTML**: `coverage/lcov-report/index.html` - Interactive browser report
- **LCOV**: `coverage/lcov.info` - Standard coverage format
- **JSON**: `coverage/coverage-summary.json` - Machine-readable summary
- **Text**: Console output during test runs

## Coverage Badges

Coverage badges are automatically generated and saved to `COVERAGE.md`:

![lines coverage](https://img.shields.io/badge/lines-80%25-brightgreen)
![statements coverage](https://img.shields.io/badge/statements-80%25-brightgreen)
![functions coverage](https://img.shields.io/badge/functions-80%25-brightgreen)
![branches coverage](https://img.shields.io/badge/branches-80%25-brightgreen)

## Excluded from Coverage

The following are excluded from coverage requirements:

- Type definition files (`*.d.ts`)
- Test files (`__tests__/**`)
- Example files (`examples/**`)
- Node modules (`node_modules/**`)

## Best Practices

1. **Write tests first** - Follow TDD principles
2. **Test critical paths** - Ensure 100% coverage for critical services
3. **Mock external dependencies** - Use Jest mocks for Stellar SDK, APIs
4. **Test edge cases** - Include error handling and boundary conditions
5. **Keep tests isolated** - Each test should be independent
6. **Use descriptive names** - Test names should clearly describe what they test

## Viewing Coverage Reports

After running `npm run test:coverage`, open the HTML report:

```bash
# Linux/Mac
open coverage/lcov-report/index.html

# Windows
start coverage/lcov-report/index.html
```

## Troubleshooting

### Coverage Below Threshold

If coverage falls below 80%:

1. Identify uncovered code in the HTML report
2. Add tests for uncovered lines
3. Focus on critical paths first
4. Run `npm run test:coverage` to verify

### Critical Path Coverage Failures

If critical services don't have 100% coverage:

1. Check `coverage/lcov-report/index.html` for specific files
2. Review uncovered lines in the report
3. Add comprehensive tests for all code paths
4. Ensure error handling is tested

## Integration with Development Workflow

1. **Before committing**: Run `npm test` to ensure all tests pass
2. **Before PR**: Run `npm run test:coverage` to check coverage
3. **During PR review**: Check coverage report in PR comments
4. **After merge**: Monitor coverage trends in Codecov

## Configuration Files

- `jest.config.js` - Jest configuration with coverage thresholds
- `.github/workflows/test-coverage.yml` - CI/CD workflow
- `scripts/generate-badge.js` - Badge generation script

## Future Enhancements

- [ ] Integration tests for end-to-end workflows
- [ ] Performance benchmarking
- [ ] Visual regression testing
- [ ] Mutation testing for test quality
