# Common Errors and Solutions

## Overview
This guide covers the most common errors encountered in SocialFlow and their solutions.

## Wallet Connection Errors

### Error: "Wallet Not Detected"

**Symptoms:**
- "No wallet found" message
- Connect button not working
- Wallet extension not recognized

**Causes:**
- Freighter extension not installed
- Extension disabled
- Browser compatibility issue
- Extension not loaded

**Solutions:**

1. **Install Freighter**
   ```
   1. Visit freighter.app
   2. Install browser extension
   3. Create or import wallet
   4. Refresh SocialFlow page
   ```

2. **Enable Extension**
   ```
   1. Open browser extensions
   2. Find Freighter
   3. Toggle "Enabled"
   4. Refresh page
   ```

3. **Check Browser Compatibility**
   - Chrome: ✅ Supported
   - Firefox: ✅ Supported
   - Edge: ✅ Supported
   - Safari: ❌ Not supported
   - Brave: ✅ Supported

4. **Clear Cache**
   ```
   1. Open browser settings
   2. Clear browsing data
   3. Select "Cached images and files"
   4. Clear data
   5. Restart browser
   ```

### Error: "Connection Refused"

**Symptoms:**
- Wallet popup doesn't appear
- Connection times out
- "User rejected" message

**Causes:**
- Popup blocked
- Wallet locked
- Network mismatch
- Extension error

**Solutions:**

1. **Allow Popups**
   ```
   1. Check browser address bar for popup icon
   2. Click and allow popups for SocialFlow
   3. Retry connection
   ```

2. **Unlock Wallet**
   ```
   1. Click Freighter extension
   2. Enter password
   3. Unlock wallet
   4. Retry connection
   ```

3. **Verify Network**
   ```
   1. Check Freighter network setting
   2. Ensure matches SocialFlow (Testnet/Mainnet)
   3. Switch if needed
   4. Reconnect
   ```

### Error: "Invalid Public Key"

**Symptoms:**
- "Invalid address format" error
- Connection fails after approval
- Public key not displaying

**Causes:**
- Corrupted wallet data
- Wrong network
- Extension bug
- Cache issue

**Solutions:**

1. **Reconnect Wallet**
   ```
   1. Disconnect current wallet
   2. Clear site data
   3. Reconnect wallet
   4. Approve connection
   ```

2. **Verify Network**
   ```
   Testnet addresses start with: G
   Mainnet addresses start with: G
   Length: 56 characters
   ```

3. **Reinstall Extension**
   ```
   1. Backup secret key first!
   2. Remove Freighter extension
   3. Reinstall from freighter.app
   4. Import wallet
   5. Reconnect to SocialFlow
   ```

## Transaction Errors

### Error: "Insufficient Balance"

**Symptoms:**
- Transaction fails immediately
- "Not enough XLM" message
- Balance shows 0

**Causes:**
- Account balance too low
- Minimum reserve not met
- Fees exceed balance
- Wrong network

**Solutions:**

1. **Check Balance Requirements**
   ```
   Minimum Reserve: 1 XLM (base)
   + 0.5 XLM per trustline
   + 0.5 XLM per offer
   + Transaction fee: 0.0001 XLM
   ```

2. **Fund Account (Testnet)**
   ```
   1. Navigate to Developer Tools
   2. Enter your public key
   3. Click "Fund via Friendbot"
   4. Receive 10,000 test XLM
   ```

3. **Fund Account (Mainnet)**
   ```
   1. Purchase XLM from exchange
   2. Withdraw to your Stellar address
   3. Wait for confirmation
   4. Retry transaction
   ```

### Error: "Transaction Failed"

**Symptoms:**
- Transaction submitted but failed
- Error code displayed
- Balance unchanged

**Common Error Codes:**

#### `tx_failed` - General Failure
**Cause:** Transaction operations failed
**Solution:**
```
1. Check operation details
2. Verify all parameters
3. Ensure sufficient balance
4. Retry with correct data
```

#### `tx_bad_seq` - Bad Sequence Number
**Cause:** Sequence number mismatch
**Solution:**
```
1. Wait 5 seconds
2. Refresh page
3. Retry transaction
4. If persists, disconnect and reconnect wallet
```

#### `tx_insufficient_balance` - Not Enough XLM
**Cause:** Balance too low for operation
**Solution:**
```
1. Check required balance
2. Add more XLM
3. Reduce transaction amount
4. Retry
```

#### `tx_no_destination` - Invalid Destination
**Cause:** Recipient address doesn't exist
**Solution:**
```
1. Verify recipient address
2. Check address format (56 chars, starts with G)
3. Ensure recipient account is funded
4. For new accounts, send minimum 1 XLM
```

### Error: "Transaction Timeout"

**Symptoms:**
- Transaction pending indefinitely
- No confirmation received
- Stuck in "Processing" state

**Causes:**
- Network congestion
- Horizon server issues
- Connection problems
- Invalid transaction

**Solutions:**

1. **Check Transaction Status**
   ```
   1. Copy transaction hash
   2. Visit stellar.expert
   3. Search for transaction
   4. Check status
   ```

2. **Wait and Retry**
   ```
   1. Wait 30 seconds
   2. Refresh page
   3. Check if transaction completed
   4. If not, retry transaction
   ```

3. **Check Network Status**
   ```
   1. Visit status.stellar.org
   2. Check for outages
   3. Wait if issues reported
   4. Retry when resolved
   ```

## Payment Errors

### Error: "Trustline Required"

**Symptoms:**
- "Asset not trusted" message
- Payment fails for custom tokens
- USDC payment rejected

**Cause:**
- Trustline not established for asset

**Solution:**

1. **Add Trustline**
   ```
   1. Navigate to Portfolio
   2. Click "Add Trustline"
   3. Enter asset code and issuer
   4. Sign transaction
   5. Retry payment
   ```

2. **Common Assets**
   ```
   USDC:
   Code: USDC
   Issuer: GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN
   
   Reserve: 0.5 XLM per trustline
   ```

### Error: "Payment Path Not Found"

**Symptoms:**
- Path payment fails
- "No path available" error
- Cross-asset payment rejected

**Causes:**
- No liquidity path
- Asset not tradeable
- Slippage too high
- DEX unavailable

**Solutions:**

1. **Use Direct Payment**
   ```
   1. Convert to XLM first
   2. Send XLM directly
   3. Recipient converts if needed
   ```

2. **Check DEX Liquidity**
   ```
   1. Visit stellarx.com
   2. Check asset liquidity
   3. Verify trading pairs exist
   4. Try alternative path
   ```

## NFT Errors

### Error: "Upload Failed"

**Symptoms:**
- File upload doesn't complete
- "Upload error" message
- IPFS connection failed

**Causes:**
- File too large
- Unsupported format
- Network issues
- IPFS unavailable

**Solutions:**

1. **Check File Requirements**
   ```
   Images: Max 10MB (JPG, PNG, GIF, SVG)
   Videos: Max 50MB (MP4, WEBM)
   Documents: Max 5MB (PDF)
   ```

2. **Compress File**
   ```
   1. Use image compression tool
   2. Reduce resolution if needed
   3. Convert to supported format
   4. Retry upload
   ```

3. **Check Connection**
   ```
   1. Test internet speed
   2. Disable VPN temporarily
   3. Try different network
   4. Retry upload
   ```

### Error: "Minting Failed"

**Symptoms:**
- NFT creation fails
- Transaction rejected
- Asset not created

**Causes:**
- Insufficient balance
- Invalid metadata
- Asset code taken
- Network error

**Solutions:**

1. **Verify Balance**
   ```
   Required: 0.5 XLM + fees
   Check balance: Portfolio view
   Add funds if needed
   ```

2. **Fix Metadata**
   ```
   1. Check all required fields
   2. Verify JSON format
   3. Ensure valid IPFS hash
   4. Remove special characters
   ```

3. **Try Different Asset Code**
   ```
   1. Asset codes must be unique
   2. Try adding numbers/letters
   3. Check existing assets
   4. Retry with new code
   ```

## Campaign Errors

### Error: "Contract Deployment Failed"

**Symptoms:**
- Smart contract won't deploy
- Deployment transaction fails
- Contract address not generated

**Causes:**
- Insufficient XLM
- Invalid contract code
- Network issues
- Soroban unavailable

**Solutions:**

1. **Check Balance**
   ```
   Required: 1 XLM minimum
   Recommended: 2 XLM for safety
   Add funds if needed
   ```

2. **Verify Contract Parameters**
   ```
   1. Review all campaign settings
   2. Check budget allocation
   3. Verify reward amounts
   4. Ensure valid dates
   ```

3. **Retry Deployment**
   ```
   1. Wait 30 seconds
   2. Refresh page
   3. Reconfigure if needed
   4. Deploy again
   ```

### Error: "Reward Distribution Failed"

**Symptoms:**
- Users can't claim rewards
- Distribution transaction fails
- Contract balance shows 0

**Causes:**
- Contract not funded
- Eligibility not met
- Contract expired
- Budget depleted

**Solutions:**

1. **Fund Contract**
   ```
   1. Check contract balance
   2. Send XLM to contract address
   3. Verify transaction
   4. Retry distribution
   ```

2. **Check Eligibility**
   ```
   1. Verify user completed action
   2. Check claim limits
   3. Ensure not duplicate
   4. Review fraud filters
   ```

## General Errors

### Error: "Network Error"

**Symptoms:**
- "Connection failed" message
- Features not loading
- Timeout errors

**Solutions:**

1. **Check Internet Connection**
   ```
   1. Test other websites
   2. Restart router
   3. Try different network
   4. Disable VPN
   ```

2. **Check Stellar Network**
   ```
   Visit: status.stellar.org
   Check: Horizon API status
   Wait: If outage reported
   ```

3. **Clear Cache**
   ```
   1. Browser settings
   2. Clear cache and cookies
   3. Restart browser
   4. Retry
   ```

### Error: "Session Expired"

**Symptoms:**
- Logged out unexpectedly
- "Please reconnect" message
- Features require reauth

**Solutions:**

1. **Reconnect Wallet**
   ```
   1. Click "Connect Wallet"
   2. Approve connection
   3. Session restored
   ```

2. **Adjust Session Settings**
   ```
   1. Settings → Security
   2. Increase session timeout
   3. Enable "Remember me"
   4. Save changes
   ```

## Getting Help

### Before Contacting Support

1. ✅ Check this troubleshooting guide
2. ✅ Search FAQ section
3. ✅ Check network status
4. ✅ Try on different browser
5. ✅ Clear cache and retry

### When Contacting Support

**Include:**
- Error message (exact text)
- Transaction hash (if applicable)
- Public key (never private key!)
- Steps to reproduce
- Browser and OS version
- Screenshots (if helpful)

### Support Channels
- Email: support@socialflow.app
- Discord: SocialFlow Community
- Twitter: @SocialFlowSupport
- GitHub: Issue tracker

## Related Guides
- [Network Troubleshooting](./network-issues.md)
- [Wallet Troubleshooting](./wallet-issues.md)
- [Transaction Failures](./transaction-failures.md)
- [FAQ](./faq.md)
