# Verification Scripts

This directory contains scripts to verify the Wallet Service implementation.

## Usage

### Linux/macOS

```bash
./scripts/verify-wallet-implementation.sh
```

### Windows

```cmd
scripts\verify-wallet-implementation.bat
```

## What the Script Does

1. ✅ Checks that all required files are present
2. ✅ Verifies dependencies are installed
3. ✅ Compiles TypeScript to check for errors
4. ✅ Runs the test suite
5. ✅ Generates test coverage report

## Expected Output

If everything is correct, you should see:

```
✅ File structure: Complete
✅ Dependencies: Installed
✅ TypeScript: Compiles
✅ Tests: Passing
```

## Troubleshooting

### Script won't run (Linux/macOS)

Make the script executable:
```bash
chmod +x scripts/verify-wallet-implementation.sh
```

### Dependencies missing

The script will automatically install missing dependencies. If this fails, run manually:
```bash
npm install
```

### TypeScript errors

Check the error output and fix any type errors in the code.

### Tests failing

Run tests with verbose output:
```bash
npm test -- --verbose
```

## Manual Verification

If you prefer to run checks manually:

```bash
# Check TypeScript compilation
npx tsc --noEmit

# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Build project
npm run build
```
