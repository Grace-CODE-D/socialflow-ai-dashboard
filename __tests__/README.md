# Testing Documentation

## Overview

This directory contains the testing infrastructure for the SocialFlow AI Dashboard application.

## Test Structure

```
__tests__/
├── services/           # Service layer tests
│   └── geminiService.test.ts (requires @google/genai mock setup)
└── utils/              # Test utilities
    ├── testHelpers.tsx
    └── mockData.ts
```

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run tests in CI mode
npm run test:ci
```

## Test Coverage

The test suite aims for 70% coverage across:
- Branches
- Functions
- Lines
- Statements

## Testing Infrastructure Setup

### ✅ Completed

1. **Jest Configuration** (`jest.config.js`)
   - TypeScript support via ts-jest
   - jsdom test environment for React components
   - Coverage thresholds set to 70%
   - CSS module mocking
   - Transform ignore patterns for ESM modules

2. **Test Environment** (`.env.test`)
   - API_KEY for testing
   - NODE_ENV set to 'test'

3. **Test Setup** (`jest.setup.js`)
   - @testing-library/jest-dom integration
   - Console mock configuration
   - Environment variable setup

4. **Test Utilities** (`__tests__/utils/`)
   - `testHelpers.tsx`: Custom render functions, async helpers, mock utilities
   - `mockData.ts`: Mock data generators for posts, analytics, messages, media, users, API responses

5. **Package Scripts**
   - `npm test`: Run all tests
   - `npm run test:watch`: Watch mode
   - `npm run test:coverage`: Generate coverage report
   - `npm run test:ci`: CI-optimized test run

### Dependencies Installed

- jest
- ts-jest
- @testing-library/react
- @testing-library/jest-dom
- @testing-library/user-event
- @types/jest
- jest-environment-jsdom

## Writing Tests

### Example Test Structure

```typescript
import { ServiceName } from '../../services/ServiceName';

describe('ServiceName', () => {
  let service: ServiceName;

  beforeEach(() => {
    service = new ServiceName();
  });

  describe('methodName', () => {
    it('should perform expected behavior', async () => {
      // Arrange
      const input = 'test';
      
      // Act
      const result = await service.methodName(input);
      
      // Assert
      expect(result).toBeDefined();
    });
  });
});
```

## Test Utilities

### testHelpers.tsx

Provides utilities for:
- Custom render functions with providers
- Async operation helpers
- Mock fetch helpers
- Mock reset utilities

### mockData.ts

Provides mock data generators for:
- Posts
- Analytics
- Messages
- Media
- Users
- API responses
- API errors

## Environment Variables

Test environment variables are configured in `.env.test`:
- `API_KEY`: Test API key for services
- `NODE_ENV`: Set to 'test'

## Mocking

### External Dependencies

External dependencies can be mocked using Jest:

```typescript
jest.mock('@external/package');
```

### Console Methods

Console methods are mocked globally to reduce test noise while still being testable.

## Best Practices

1. **Isolation**: Each test should be independent
2. **Cleanup**: Use `beforeEach` and `afterEach` for setup/teardown
3. **Descriptive Names**: Test names should clearly describe what they test
4. **AAA Pattern**: Arrange, Act, Assert
5. **Edge Cases**: Test both happy paths and error conditions
6. **Async/Await**: Use async/await for asynchronous operations

## Notes

- The geminiService test requires proper mocking of the @google/genai ESM module
- Additional service tests can be added following the same pattern
- Coverage reports are generated in the `coverage/` directory
