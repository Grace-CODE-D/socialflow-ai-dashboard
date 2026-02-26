# Test Coverage

![lines coverage](https://img.shields.io/badge/lines-pending-lightgrey) ![statements coverage](https://img.shields.io/badge/statements-pending-lightgrey) ![functions coverage](https://img.shields.io/badge/functions-pending-lightgrey) ![branches coverage](https://img.shields.io/badge/branches-pending-lightgrey)

## Coverage Summary

Run `npm run test:coverage:report` to generate coverage metrics.

## Coverage Goals

- **Global Target**: 80% across all metrics
- **Critical Paths**: 100% coverage for:
  - stellarService.ts
  - paymentService.ts
  - walletService.ts
  - sorobanService.ts

## Quick Start

```bash
# Run tests with coverage
npm run test:coverage

# Generate coverage report and badges
npm run test:coverage:report

# View HTML report
open coverage/lcov-report/index.html
```

See [docs/TEST_COVERAGE.md](docs/TEST_COVERAGE.md) for detailed documentation.

*Coverage badges will be automatically updated after running tests.*
