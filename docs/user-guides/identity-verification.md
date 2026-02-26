# Identity Verification Guide

## Overview
Verify your identity on the Stellar blockchain to build trust, unlock features, and establish on-chain reputation.

## What is Identity Verification?

Identity verification creates a cryptographic link between your Stellar address and social media profiles, stored permanently on-chain as verifiable attestations.

### Benefits
- ✅ Verified badge on profile
- ✅ Increased trust and credibility
- ✅ Access to premium features
- ✅ Higher engagement rates
- ✅ Fraud protection
- ✅ On-chain reputation

## Verification Process

### Step 1: Prerequisites

**Requirements:**
- Connected Stellar wallet
- Minimum 1 XLM balance
- Active social media accounts
- Valid email address

**Supported Platforms:**
- Twitter/X
- Instagram
- LinkedIn
- Facebook
- TikTok

### Step 2: Initiate Verification

1. **Navigate to Settings**
   - Click profile icon
   - Select "Settings"
   - Go to "Verification" tab

2. **Start Process**
   - Click "Verify Identity"
   - Verification wizard opens
   - Review requirements

### Step 3: Link Social Profiles

#### Twitter/X Verification

1. **Connect Account**
   - Click "Connect Twitter"
   - OAuth popup opens
   - Authorize SocialFlow
   - Account linked

2. **Post Verification Tweet**
   - Copy verification code
   - Tweet code from your account
   - Format: "Verifying my Stellar address GXXX...XXX on @SocialFlow #StellarVerified [CODE]"
   - Click "I've Posted"

3. **Verification**
   - System checks tweet
   - Validates account ownership
   - Confirms within 30 seconds

#### Instagram Verification

1. **Connect Account**
   - Click "Connect Instagram"
   - Login to Instagram
   - Authorize access

2. **Bio Verification**
   - Add verification code to bio
   - Format: "Stellar: GXXX...XXX | Verified on SocialFlow"
   - Save bio changes
   - Click "Verify Bio"

3. **Confirmation**
   - System scrapes bio
   - Validates code
   - Marks as verified

#### LinkedIn Verification

1. **Connect Account**
   - Click "Connect LinkedIn"
   - OAuth authorization
   - Grant permissions

2. **Profile Update**
   - Add Stellar address to "About" section
   - Include verification code
   - Update profile
   - Click "Check Profile"

3. **Validation**
   - System verifies update
   - Confirms ownership
   - Links account

### Step 4: Create On-Chain Attestation

1. **Review Linked Accounts**
   - Twitter: @username ✓
   - Instagram: @username ✓
   - LinkedIn: Name ✓

2. **Generate Attestation**
   - Click "Create Attestation"
   - System prepares transaction
   - Includes all linked profiles

3. **Transaction Details**
   ```
   Operation: Manage Data
   Key: "social_verification"
   Value: {
     "twitter": "@username",
     "instagram": "@username",
     "linkedin": "profile_id",
     "verified_at": "2026-02-26T00:00:00Z",
     "signature": "..."
   }
   ```

4. **Sign Transaction**
   - Wallet popup appears
   - Review attestation data
   - Confirm transaction
   - Sign with wallet
   - Fee: ~0.0001 XLM

### Step 5: Verification Complete

1. **Success Confirmation**
   - ✅ Identity verified
   - ✅ Attestation on-chain
   - ✅ Verified badge active
   - ✅ Transaction hash provided

2. **View Attestation**
   - Click "View on Stellar Expert"
   - See on-chain data
   - Verify transaction
   - Share verification

## Verification Levels

### Level 1: Basic
- **Requirements**: 1 social profile
- **Badge**: Bronze verified badge
- **Features**: Basic trust indicator

### Level 2: Standard
- **Requirements**: 2+ social profiles
- **Badge**: Silver verified badge
- **Features**: Enhanced visibility

### Level 3: Premium
- **Requirements**: 3+ social profiles + email
- **Badge**: Gold verified badge
- **Features**: All premium features

### Level 4: Enterprise
- **Requirements**: Full verification + KYC
- **Badge**: Diamond verified badge
- **Features**: Business features

## Managing Verification

### Update Linked Accounts

1. **Add New Profile**
   - Go to Verification settings
   - Click "Add Profile"
   - Follow verification steps
   - Update attestation

2. **Remove Profile**
   - Select profile to remove
   - Click "Unlink"
   - Confirm action
   - Update on-chain data

### Reverify Accounts

1. **Periodic Reverification**
   - Required every 90 days
   - Notification sent in advance
   - Quick reverification process
   - Maintains verified status

2. **Reverification Steps**
   - Click "Reverify"
   - Confirm account access
   - Update attestation
   - Badge remains active

### Revoke Verification

1. **Permanent Removal**
   - Go to Verification settings
   - Click "Revoke Verification"
   - Confirm action (irreversible)
   - Sign transaction

2. **Effects**
   - Verified badge removed
   - On-chain data updated
   - Can reverify later
   - History preserved

## Verified Badge Display

### Profile Badge
- Appears next to username
- Blue checkmark icon
- Hover shows verification details
- Links to attestation

### Badge Tooltip
```
✓ Verified Identity
Stellar Address: GXXX...XXX
Verified Accounts:
  • Twitter: @username
  • Instagram: @username
Verified: Feb 26, 2026
View Attestation →
```

### Public Verification

Anyone can verify your identity:
1. Click your verified badge
2. View linked accounts
3. Check on-chain attestation
4. Verify transaction hash

## Security & Privacy

### What's Stored On-Chain
✅ Stellar public address
✅ Social media usernames
✅ Verification timestamp
✅ Cryptographic signature

### What's NOT Stored
❌ Private keys
❌ Personal information
❌ Email addresses
❌ Phone numbers
❌ Location data

### Privacy Controls

1. **Public Visibility**
   - Choose which profiles to display
   - Hide specific accounts
   - Control badge visibility
   - Manage attestation access

2. **Data Management**
   - Update information anytime
   - Remove profiles
   - Revoke verification
   - Export verification data

## Verification Benefits

### Trust & Credibility
- Verified badge increases trust
- Higher engagement rates
- Reduced spam/fraud
- Professional appearance

### Feature Access
- Premium campaign features
- Higher reward limits
- Priority support
- Advanced analytics

### Community Benefits
- Verified-only channels
- Exclusive events
- Governance participation
- Reputation building

## Troubleshooting

### Verification Failed

**Twitter Verification Failed**
- Ensure tweet is public
- Check verification code accuracy
- Wait 5 minutes and retry
- Verify account is not suspended

**Instagram Verification Failed**
- Make profile public temporarily
- Ensure bio is saved
- Clear cache and retry
- Check character limits

**Transaction Failed**
- Insufficient XLM balance
- Network congestion
- Wallet disconnected
- Invalid data format

### Badge Not Showing

**Causes:**
- Blockchain sync delay
- Cache issues
- Verification incomplete
- Network switched

**Solutions:**
- Wait 30 seconds
- Refresh page
- Check verification status
- Verify correct network

### Account Linking Issues

**OAuth Errors:**
- Clear browser cookies
- Try different browser
- Check popup blockers
- Verify account credentials

**Permission Denied:**
- Grant required permissions
- Reauthorize application
- Check account settings
- Contact platform support

## Best Practices

### Verification Strategy
✅ Verify all active profiles
✅ Keep information current
✅ Reverify promptly
✅ Maintain account security
✅ Monitor verification status

### Security
✅ Use strong passwords
✅ Enable 2FA on social accounts
✅ Never share private keys
✅ Verify transaction details
✅ Keep wallet secure

### Privacy
✅ Review what's shared
✅ Control visibility settings
✅ Understand on-chain data
✅ Regular privacy audits
✅ Update as needed

## Advanced Features

### Multi-Signature Verification
- Require multiple signatures
- Team account verification
- Enhanced security
- Business accounts

### Delegated Verification
- Authorize verification agents
- Third-party verification
- KYC integration
- Compliance support

### Verification API
```javascript
// Check verification status
const status = await identityService.getVerificationStatus(publicKey);

// Verify identity
const result = await identityService.initiateVerification({
  userId: 'user123',
  socialProfiles: [
    { platform: 'twitter', username: 'user' }
  ]
});
```

## Verification Costs

| Operation | Cost | Description |
|-----------|------|-------------|
| Initial Verification | 0.0001 XLM | Network fee |
| Update Attestation | 0.0001 XLM | Per update |
| Reverification | Free | Every 90 days |
| Revocation | 0.0001 XLM | Remove verification |

## Support

### Resources
- [Stellar Identity Documentation](https://developers.stellar.org)
- [Troubleshooting Guide](../troubleshooting/verification-issues.md)
- [Privacy Policy](../legal/privacy.md)

### Contact
- Email: support@socialflow.app
- Discord: SocialFlow Community
- Twitter: @SocialFlowSupport
