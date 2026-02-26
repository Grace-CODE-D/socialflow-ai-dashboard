# Quick Start

Get up and running with SocialFlow in minutes.

## Prerequisites

- Node.js 18+ installed
- Git installed
- A Stellar wallet (Freighter or Albedo)
- Gemini API key (optional, for AI features)

## Installation

```bash
# Clone the repository
git clone https://github.com/hman38705/socialflow-ai-dashboard.git
cd socialflow-ai-dashboard

# Install dependencies
npm install
```

## Configuration

Create a `.env.local` file in the root directory:

```env
VITE_GEMINI_API_KEY=your_gemini_api_key_here
VITE_PINATA_API_KEY=your_pinata_api_key_here
VITE_PINATA_SECRET_KEY=your_pinata_secret_key_here
```

## Running the Application

### Development Mode

```bash
# Start the development server
npm run electron:dev
```

### Production Build

```bash
# Build the application
npm run electron:build
```

## First Steps

1. **Connect Your Wallet**: Click the wallet icon and connect Freighter or Albedo
2. **Set Up Your Profile**: Navigate to Settings and configure your social accounts
3. **Create Your First Post**: Use the AI-powered content generator to create engaging content
4. **Explore Features**: Try minting a token or creating an NFT

## What's Next?

- Learn about [Architecture](/guide/architecture)
- Explore [AI Integration](/guide/ai-integration)
- Understand [Stellar Network](/guide/stellar-network)
- Try [Code Examples](/examples/getting-started)
