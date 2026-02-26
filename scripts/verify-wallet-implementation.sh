#!/bin/bash

# Wallet Service Implementation Verification Script
# This script verifies that all files are in place and tests pass

echo "🔍 Verifying Wallet Service Implementation..."
echo ""

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Error: package.json not found. Please run this script from the project root.${NC}"
    exit 1
fi

echo "📁 Checking file structure..."

# Array of required files
required_files=(
    "src/blockchain/types/wallet.ts"
    "src/blockchain/services/providers/FreighterProvider.ts"
    "src/blockchain/services/providers/AlbedoProvider.ts"
    "src/blockchain/services/WalletService.ts"
    "src/blockchain/services/__tests__/WalletService.test.ts"
    "src/blockchain/index.ts"
    "src/blockchain/examples/WalletConnectExample.tsx"
    "src/blockchain/README.md"
    "src/blockchain/QUICK_START.md"
    "jest.config.js"
    "jest.setup.js"
    "WALLET_IMPLEMENTATION_GUIDE.md"
    "IMPLEMENTATION_SUMMARY.md"
)

missing_files=0

for file in "${required_files[@]}"; do
    if [ -f "$file" ]; then
        echo -e "${GREEN}✓${NC} $file"
    else
        echo -e "${RED}✗${NC} $file (missing)"
        missing_files=$((missing_files + 1))
    fi
done

echo ""

if [ $missing_files -gt 0 ]; then
    echo -e "${RED}❌ $missing_files file(s) missing!${NC}"
    exit 1
else
    echo -e "${GREEN}✅ All required files present!${NC}"
fi

echo ""
echo "📦 Checking dependencies..."

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}⚠️  node_modules not found. Installing dependencies...${NC}"
    npm install
else
    echo -e "${GREEN}✓${NC} node_modules exists"
fi

# Check for Jest
if npm list jest &> /dev/null; then
    echo -e "${GREEN}✓${NC} Jest is installed"
else
    echo -e "${YELLOW}⚠️  Jest not found. Installing test dependencies...${NC}"
    npm install --save-dev @types/jest jest jest-environment-jsdom ts-jest
fi

echo ""
echo "🔨 Compiling TypeScript..."

# Check TypeScript compilation
if npx tsc --noEmit; then
    echo -e "${GREEN}✅ TypeScript compilation successful!${NC}"
else
    echo -e "${RED}❌ TypeScript compilation failed!${NC}"
    exit 1
fi

echo ""
echo "🧪 Running tests..."

# Run tests
if npm test -- --passWithNoTests; then
    echo -e "${GREEN}✅ All tests passed!${NC}"
else
    echo -e "${RED}❌ Tests failed!${NC}"
    exit 1
fi

echo ""
echo "📊 Generating test coverage..."

# Run coverage
npm run test:coverage -- --passWithNoTests

echo ""
echo "✨ Verification Summary:"
echo ""
echo -e "${GREEN}✅ File structure: Complete${NC}"
echo -e "${GREEN}✅ Dependencies: Installed${NC}"
echo -e "${GREEN}✅ TypeScript: Compiles${NC}"
echo -e "${GREEN}✅ Tests: Passing${NC}"
echo ""
echo -e "${GREEN}🎉 Wallet Service implementation verified successfully!${NC}"
echo ""
echo "Next steps:"
echo "1. Review the code"
echo "2. Run 'git add .' to stage changes"
echo "3. Run 'git commit -m \"feat: implement Stellar wallet service\"'"
echo "4. Run 'git push origin features/issue-1-wallet-service'"
echo "5. Create a pull request against the develop branch"
echo ""
