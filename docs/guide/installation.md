# Installation

Detailed installation instructions for SocialFlow across different platforms.

## System Requirements

- **Operating System**: Windows 10+, macOS 10.15+, or Linux (Ubuntu 20.04+)
- **Node.js**: Version 18.0.0 or higher
- **RAM**: Minimum 4GB (8GB recommended)
- **Storage**: 500MB free space

## Step-by-Step Installation

### 1. Install Node.js

Download and install Node.js from [nodejs.org](https://nodejs.org/)

Verify installation:
```bash
node --version
npm --version
```

### 2. Clone Repository

```bash
git clone https://github.com/hman38705/socialflow-ai-dashboard.git
cd socialflow-ai-dashboard
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Environment Configuration

Create `.env.local` file:

```env
# Gemini AI Configuration
VITE_GEMINI_API_KEY=your_gemini_api_key

# IPFS/Pinata Configuration
VITE_PINATA_API_KEY=your_pinata_api_key
VITE_PINATA_SECRET_KEY=your_pinata_secret_key

# Stellar Network (optional)
VITE_STELLAR_NETWORK=testnet
```

### 5. Install Wallet Extension

Install one of the supported wallets:
- [Freighter Wallet](https://www.freighter.app/)
- [Albedo Wallet](https://albedo.link/)

## Running the Application

### Development Mode

```bash
npm run electron:dev
```

The application will start on `http://localhost:5173` and launch Electron.

### Production Build

```bash
npm run electron:build
```

Built application will be in `dist-electron/` directory.

## Troubleshooting

### Port Already in Use

If port 5173 is occupied:
```bash
# Kill the process using the port
npx kill-port 5173
```

### Electron Not Starting

Clear cache and reinstall:
```bash
rm -rf node_modules package-lock.json
npm install
```

### Wallet Connection Issues

1. Ensure wallet extension is installed and unlocked
2. Check browser console for errors
3. Try refreshing the application

## Next Steps

- [Quick Start Guide](/guide/quick-start)
- [Architecture Overview](/guide/architecture)
- [API Reference](/api/overview)
