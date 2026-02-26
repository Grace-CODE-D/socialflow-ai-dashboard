#!/bin/bash

# E2E Test Runner Script
# Executes the full E2E test suite and generates reports

set -e

echo "🚀 Starting E2E Test Suite..."
echo "================================"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Create directories for reports
mkdir -p test-results
mkdir -p coverage

# Run tests with coverage
echo -e "${YELLOW}Running E2E tests...${NC}"
npm run test:e2e -- --coverage --reporter=verbose --reporter=json --outputFile=test-results/results.json

# Check exit code
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ All E2E tests passed!${NC}"
else
    echo -e "${RED}❌ Some E2E tests failed!${NC}"
    exit 1
fi

# Generate coverage report
echo -e "${YELLOW}Generating coverage report...${NC}"
if [ -d "coverage" ]; then
    echo -e "${GREEN}✅ Coverage report generated in coverage/index.html${NC}"
else
    echo -e "${YELLOW}⚠️  No coverage data generated${NC}"
fi

# Display test summary
echo ""
echo "================================"
echo "📊 Test Summary"
echo "================================"

# Parse and display results (if jq is available)
if command -v jq &> /dev/null; then
    if [ -f "test-results/results.json" ]; then
        TOTAL=$(jq '.numTotalTests' test-results/results.json)
        PASSED=$(jq '.numPassedTests' test-results/results.json)
        FAILED=$(jq '.numFailedTests' test-results/results.json)
        
        echo "Total Tests: $TOTAL"
        echo -e "${GREEN}Passed: $PASSED${NC}"
        if [ "$FAILED" -gt 0 ]; then
            echo -e "${RED}Failed: $FAILED${NC}"
        else
            echo "Failed: $FAILED"
        fi
    fi
else
    echo "Install jq for detailed test summary"
fi

echo ""
echo "================================"
echo "📁 Reports Generated:"
echo "  - Test Results: test-results/results.json"
echo "  - Coverage HTML: coverage/index.html"
echo "  - Coverage JSON: coverage/coverage-final.json"
echo "================================"

echo -e "${GREEN}✨ E2E Test Suite Complete!${NC}"
