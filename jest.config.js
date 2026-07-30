/** @type {import('jest').Config} */
module.exports = {
  projects: [
    {
      displayName: 'frontend',
      preset: 'ts-jest',
      testEnvironment: 'jsdom',
      roots: ['<rootDir>/src'],
      testMatch: [
        '**/__tests__/**/*.test.ts',
        '**/__tests__/**/*.test.tsx',
        // #1249: WalletService tests live in blockchain/services/tests/
        '**/blockchain/services/tests/**/*.test.ts',
        // #1250: useJobStream test lives in src/hooks/
        '**/hooks/**/*.test.ts',
      ],
      setupFiles: ['<rootDir>/jest.setup.js'],
      transformIgnorePatterns: [
        'node_modules/(?!(@scure|@noble|@otplib|otplib)/)',
      ],
      transform: {
        '^.+\\.(ts|tsx|js)$': ['ts-jest', {
          diagnostics: false,
          tsconfig: {
            jsx: 'react',
            types: ['jest', 'node'],
            esModuleInterop: true,
            allowJs: true,
          },
        }],
      },
    },
    '<rootDir>/backend',
    {
      displayName: 'services',
      preset: 'ts-jest',
      testEnvironment: 'node',
      roots: ['<rootDir>/services'],
      testMatch: ['**/__tests__/**/*.test.ts'],
      transform: {
        '^.+\\.ts$': ['ts-jest', { tsconfig: { esModuleInterop: true } }],
      },
    },
  ],
};
