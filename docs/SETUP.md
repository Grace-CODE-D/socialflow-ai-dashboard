# SocialFlow Development Setup Guide

## 📋 Table of Contents
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Detailed Setup](#detailed-setup)
- [Configuration](#configuration)
- [Test Accounts](#test-accounts)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Software
- **Node.js**: Version 18.0.0 or higher
- **npm**: Version 9.0.0 or higher
- **Git**: Latest version

### Recommended Tools
- **VS Code**: With recommended extensions
- **Freighter Wallet**: Browser extension for Stellar
- **Postman**: For API testing (optional)

### System Requirements
- **OS**: Windows 10+, macOS 10.15+, or Linux
- **RAM**: 8GB minimum, 16GB recommended
- **Disk Space**: 2GB free space

---

## Quick Start

### Automated Setup (Recommended)

```bash
# 1. Clone the repository
git clone https://github.com/your-org/socialflow.git
cd socialflow

# 2. Run automated setup
npm run dev:setup

# 3. Configure API keys in .env.local
# Edit .env.local and add your keys

# 4. Start development server
npm run dev
```

That's it! Your development environment is ready.

---

## Detailed Setup

### Step 1: Clone Repository

```bash
git clone https://github.com/your-org/socialflow.git
cd socialflow
```

### Step 2: Install Dependencies

```bash
npm install
```

This will install all required packages including:
- React & React DOM
- Electron
- Stellar SDK
- Vite
- TypeScript
- Testing libraries

### Step 3: Environment Configuration

#### Create Environment File
```bash
cp .env.example .env.local
```

#### Configure Required Keys

Edit `.env.local` and add your API keys:

**Gemini AI API Key** (Required for AI features)
```env
API_KEY=your_gemini_api_key_here
```
Get your key at: https://makersuite.google.com/app/apikey

**Pinata API Keys** (Required for NFT storage)
```env
PINATA_API_KEY=your_pinata_api_key_here
PINATA_SECRET_API_KEY=your_pinata_secret_key_here
PINATA_JWT=your_pinata_jwt_here
```
Get your keys at: https://www.pinata.cloud/

**Stellar Network Configuration**
```env
STELLAR_NETWORK=testnet
STELLAR_HORIZON_URL_TESTNET=https://horizon-testnet.stellar.org
```

### Step 4: Generate Test Accounts

```bash
npm run dev:generate-accounts
```

This will:
- Generate 3 Stellar testnet accounts
- Fund them with 10,000 XLM each
- Save keys to `.env.local`
- Create `test-accounts.json` for reference

### Step 5: Verify Setup

```bash
# Check if everything is configured correctly
npm run dev:check

# Run tests to verify installation
npm run test
```

### Step 6: Start Development

```bash
# Start web development server
npm run dev

# OR start Electron app
npm run electron:dev
```

---

## Configuration

### Environment Variables

#### Required Variables
| Variable | Description | Where to Get |
|----------|-------------|--------------|
| `API_KEY` | Gemini AI API key | [Google AI Studio](https://makersuite.google.com/app/apikey) |
| `PINATA_API_KEY` | Pinata API key | [Pinata Cloud](https://www.pinata.cloud/) |
| `PINATA_SECRET_API_KEY` | Pinata secret key | [Pinata Cloud](https://www.pinata.cloud/) |

#### Optional Variables
| Variable | Description | Default |
|----------|-------------|---------|
| `STELLAR_NETWORK` | Stellar network (testnet/public) | `testnet` |
| `DEBUG` | Enable debug mode | `false` |
| `USE_MOCK_DATA` | Use mock data instead of blockchain | `false` |

### Network Configuration

#### Testnet (Development)
```env
STELLAR_NETWORK=testnet
STELLAR_HORIZON_URL_TESTNET=https://horizon-testnet.stellar.org
STELLAR_FRIENDBOT_URL=https://friendbot.stellar.org
```

#### Mainnet (Production)
```env
STELLAR_NETWORK=public
STELLAR_HORIZON_URL_PUBLIC=https://horizon.stellar.org
```

⚠️ **Warning**: Never use testnet keys on mainnet!

---

## Test Accounts

### Generating Test Accounts

```bash
# Generate new test accounts
npm run dev:generate-accounts
```

This creates 3 test accounts:
1. **Account 1**: Main developer account
2. **Account 2**: Secondary test account
3. **Account 3**: Campaign test account

### Funding Test Accounts

```bash
# Fund all test accounts
npm run dev:fund-accounts

# Check account balances
npm run dev:check-balances
```

### Manual Funding

If automatic funding fails, use Stellar Laboratory:
1. Go to https://laboratory.stellar.org/#account-creator?network=test
2. Paste your public key
3. Click "Get test network lumens"

### Account Management

#### View Account Details
```bash
# View account information
npm run dev:account-info <PUBLIC_KEY>
```

#### Export Account Keys
Account keys are stored in:
- `.env.local` (environment variables)
- `test-accounts.json` (JSON format)

⚠️ **Security**: Never commit these files to version control!

---

## Development Workflow

### Daily Development

```bash
# 1. Pull latest changes
git pull origin develop

# 2. Install any new dependencies
npm install

# 3. Start development server
npm run dev

# 4. Make changes and test
npm run test

# 5. Commit changes
git add .
git commit -m "feat: your feature description"
git push
```

### Running Tests

```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run E2E tests
npm run test:e2e

# Run with coverage
npm run test:coverage
```

### Building for Production

```bash
# Build web app
npm run build

# Build Electron app
npm run electron:build
```

---

## Troubleshooting

### Common Issues

#### Issue: "Node version too old"
**Solution**: Install Node.js 18+ from https://nodejs.org/

#### Issue: "npm install fails"
**Solution**:
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and package-lock.json
rm -rf node_modules package-lock.json

# Reinstall
npm install
```

#### Issue: "API key not working"
**Solution**:
1. Verify key is correct in `.env.local`
2. Check key has proper permissions
3. Ensure no extra spaces in key
4. Restart development server

#### Issue: "Test accounts not funded"
**Solution**:
```bash
# Try funding again
npm run dev:fund-accounts

# Or fund manually at:
# https://laboratory.stellar.org/#account-creator?network=test
```

#### Issue: "Stellar connection timeout"
**Solution**:
1. Check internet connection
2. Verify Horizon URL is correct
3. Try switching to different Horizon server
4. Check if testnet is operational: https://status.stellar.org/

#### Issue: "Electron app won't start"
**Solution**:
```bash
# Rebuild Electron
npm run electron:build

# Clear Electron cache
rm -rf ~/.electron

# Reinstall Electron
npm install electron --save-dev
```

### Getting Help

#### Documentation
- [Development Guide](./DEVELOPMENT.md)
- [API Documentation](./API.md)
- [Architecture Overview](./ARCHITECTURE.md)

#### Community
- GitHub Issues: Report bugs and request features
- Discord: Join our community chat
- Stack Overflow: Tag questions with `socialflow`

#### Support
- Email: dev@socialflow.io
- Documentation: https://docs.socialflow.io
- Status Page: https://status.socialflow.io

---

## Next Steps

After completing setup:

1. **Read Development Guide**: [DEVELOPMENT.md](./DEVELOPMENT.md)
2. **Explore Codebase**: Start with `App.tsx`
3. **Run Examples**: Check `examples/` directory
4. **Join Community**: Connect with other developers
5. **Start Building**: Create your first feature!

---

## Security Best Practices

### Environment Files
- ✅ Never commit `.env.local` to git
- ✅ Use different keys for dev/staging/prod
- ✅ Rotate API keys regularly
- ✅ Keep test accounts separate from production

### Test Accounts
- ✅ Only use testnet for development
- ✅ Never use test keys on mainnet
- ✅ Generate new test accounts regularly
- ✅ Don't share secret keys

### API Keys
- ✅ Store keys securely
- ✅ Use environment variables
- ✅ Enable key restrictions when possible
- ✅ Monitor key usage

---

## Additional Resources

### Stellar Development
- [Stellar Documentation](https://developers.stellar.org/)
- [Stellar Laboratory](https://laboratory.stellar.org/)
- [Stellar Expert](https://stellar.expert/)

### React & Electron
- [React Documentation](https://react.dev/)
- [Electron Documentation](https://www.electronjs.org/docs)
- [Vite Documentation](https://vitejs.dev/)

### Testing
- [Vitest Documentation](https://vitest.dev/)
- [Testing Library](https://testing-library.com/)

---

**Happy Coding! 🚀**
