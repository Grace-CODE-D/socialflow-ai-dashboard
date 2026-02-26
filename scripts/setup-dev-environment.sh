#!/bin/bash

# SocialFlow Development Environment Setup Script
# This script sets up the complete development environment

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                                                            ║${NC}"
echo -e "${BLUE}║         SocialFlow Development Environment Setup          ║${NC}"
echo -e "${BLUE}║                                                            ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Function to print section headers
print_section() {
    echo ""
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}  $1${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
}

# Function to print success messages
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

# Function to print error messages
print_error() {
    echo -e "${RED}✗ $1${NC}"
}

# Function to print warning messages
print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

# Function to print info messages
print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

# Check if running in project root
cd "$PROJECT_ROOT"

# 1. Check Node.js version
print_section "Checking Prerequisites"

if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed"
    print_info "Please install Node.js 18+ from https://nodejs.org/"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    print_error "Node.js version must be 18 or higher (current: $(node -v))"
    exit 1
fi
print_success "Node.js $(node -v) detected"

# Check npm
if ! command -v npm &> /dev/null; then
    print_error "npm is not installed"
    exit 1
fi
print_success "npm $(npm -v) detected"

# 2. Install dependencies
print_section "Installing Dependencies"

print_info "Installing npm packages..."
npm install
print_success "Dependencies installed"

# 3. Setup environment files
print_section "Setting Up Environment Configuration"

if [ ! -f ".env.local" ]; then
    print_info "Creating .env.local from template..."
    cp .env.example .env.local
    print_success ".env.local created"
    print_warning "Please edit .env.local and add your API keys"
else
    print_warning ".env.local already exists, skipping..."
fi

# 4. Create necessary directories
print_section "Creating Project Directories"

directories=(
    "public"
    "dist"
    "coverage"
    "test-results"
    ".kiro/settings"
    ".kiro/specs"
    ".kiro/steering"
)

for dir in "${directories[@]}"; do
    if [ ! -d "$dir" ]; then
        mkdir -p "$dir"
        print_success "Created $dir/"
    else
        print_info "$dir/ already exists"
    fi
done

# 5. Setup Git hooks (optional)
print_section "Setting Up Git Hooks"

if [ -d ".git" ]; then
    print_info "Setting up pre-commit hook..."
    cat > .git/hooks/pre-commit << 'EOF'
#!/bin/bash
# Run linting before commit
npm run lint --silent
if [ $? -ne 0 ]; then
    echo "Linting failed. Please fix errors before committing."
    exit 1
fi
EOF
    chmod +x .git/hooks/pre-commit
    print_success "Git hooks configured"
else
    print_warning "Not a git repository, skipping git hooks"
fi

# 6. Generate test accounts
print_section "Generating Test Accounts"

print_info "Generating Stellar testnet accounts..."
node "$SCRIPT_DIR/generate-test-accounts.js"

# 7. Verify setup
print_section "Verifying Setup"

# Check if .env.local has required keys
if grep -q "your_gemini_api_key_here" .env.local; then
    print_warning "Gemini API key not configured in .env.local"
else
    print_success "Gemini API key configured"
fi

if grep -q "your_pinata_api_key_here" .env.local; then
    print_warning "Pinata API key not configured in .env.local"
else
    print_success "Pinata API key configured"
fi

# 8. Display next steps
print_section "Setup Complete!"

echo -e "${GREEN}Your development environment is ready!${NC}"
echo ""
echo -e "${BLUE}Next Steps:${NC}"
echo ""
echo "1. Configure API Keys:"
echo "   Edit .env.local and add your API keys:"
echo "   - Gemini API: https://makersuite.google.com/app/apikey"
echo "   - Pinata API: https://www.pinata.cloud/"
echo ""
echo "2. Start Development Server:"
echo "   ${GREEN}npm run dev${NC}"
echo ""
echo "3. Start Electron App:"
echo "   ${GREEN}npm run electron:dev${NC}"
echo ""
echo "4. Run Tests:"
echo "   ${GREEN}npm run test${NC}"
echo ""
echo "5. Generate Test Accounts:"
echo "   ${GREEN}npm run dev:generate-accounts${NC}"
echo ""
echo "6. Fund Test Accounts:"
echo "   ${GREEN}npm run dev:fund-accounts${NC}"
echo ""
echo -e "${BLUE}Documentation:${NC}"
echo "   - Setup Guide: docs/SETUP.md"
echo "   - Development Guide: docs/DEVELOPMENT.md"
echo "   - API Documentation: docs/API.md"
echo ""
echo -e "${YELLOW}⚠ Important:${NC}"
echo "   - Use testnet for all development"
echo "   - Never commit .env.local to version control"
echo "   - Keep your API keys secure"
echo ""
echo -e "${GREEN}Happy coding! 🚀${NC}"
echo ""
