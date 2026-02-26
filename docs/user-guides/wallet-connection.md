# Wallet Connection Guide

## Overview
SocialFlow supports multiple Stellar wallet providers for secure blockchain interactions. This guide covers connecting and managing your wallet.

## Supported Wallets
- **Freighter** - Browser extension wallet (Recommended)
- **Albedo** - Web-based wallet

## Prerequisites
- A Stellar wallet (Freighter or Albedo)
- Testnet XLM for testing (use Friendbot)
- Modern web browser (Chrome, Firefox, Edge)

## Connecting Your Wallet

### Method 1: Freighter Wallet

1. **Install Freighter**
   - Visit [freighter.app](https://freighter.app)
   - Install browser extension
   - Create or import wallet

2. **Connect to SocialFlow**
   - Open SocialFlow application
   - Click "Connect Wallet" button
   - Select "Freighter" from wallet options
   - Approve connection in Freighter popup
   - Your public key will display in header

3. **Verify Connection**
   - Check wallet icon shows "Connected"
   - View your XLM balance in header
   - Green indicator confirms active connection

### Method 2: Albedo Wallet

1. **Connect to SocialFlow**
   - Click "Connect Wallet" button
   - Select "Albedo" from wallet options
   - Albedo popup opens automatically
   - Approve connection request
   - Connection confirmed

2. **Session Management**
   - Albedo uses session-based authentication
   - Sessions expire after inactivity
   - Reconnect when prompted

## Managing Your Connection

### Viewing Account Details
- Click wallet icon in header
- View public key, balance, and network
- Access portfolio view for detailed assets

### Switching Networks
1. Navigate to Settings
2. Select "Network" tab
3. Choose Testnet or Mainnet
4. Reconnect wallet after switching

### Disconnecting Wallet
1. Click wallet icon
2. Select "Disconnect"
3. Confirm disconnection
4. Wallet data cleared from session

## Troubleshooting

### Wallet Not Detected
- Ensure Freighter extension is installed and enabled
- Refresh the page
- Check browser console for errors

### Connection Failed
- Verify wallet is unlocked
- Check network connection
- Try different wallet provider
- Clear browser cache and retry

### Balance Not Showing
- Wait 5-10 seconds for blockchain sync
- Refresh connection
- Verify correct network (Testnet/Mainnet)

### Transaction Signing Issues
- Ensure wallet popup is not blocked
- Check wallet has sufficient XLM for fees
- Verify transaction details before signing

## Security Best Practices

### Do's
✅ Always verify transaction details before signing
✅ Keep your secret key secure and private
✅ Use Testnet for testing and learning
✅ Regularly backup your wallet
✅ Enable browser security features

### Don'ts
❌ Never share your secret key
❌ Don't approve suspicious transactions
❌ Avoid using public computers for wallet access
❌ Don't store large amounts on Testnet
❌ Never screenshot your secret key

## Network Information

### Testnet
- **Purpose**: Testing and development
- **Horizon URL**: https://horizon-testnet.stellar.org
- **Friendbot**: Free test XLM available
- **Network Passphrase**: Test SDF Network ; September 2015

### Mainnet
- **Purpose**: Production transactions
- **Horizon URL**: https://horizon.stellar.org
- **Real Value**: Actual XLM with monetary value
- **Network Passphrase**: Public Global Stellar Network ; September 2015

## Getting Test XLM

1. **Using Developer Tools**
   - Navigate to Developer Tools
   - Enter your public key
   - Click "Fund via Friendbot"
   - Wait for confirmation

2. **Direct Friendbot**
   - Visit https://friendbot.stellar.org
   - Enter your public key
   - Submit request
   - Receive 10,000 test XLM

## Advanced Features

### Multi-Account Support
- Connect different wallets for different purposes
- Switch between accounts in Settings
- Each account maintains separate session

### Hardware Wallet Integration
- Currently not supported
- Planned for future release
- Use Freighter with hardware wallet as workaround

## Support
- Check [Troubleshooting Guide](../troubleshooting/common-errors.md)
- Visit [Stellar Documentation](https://developers.stellar.org)
- Contact support for wallet-specific issues
