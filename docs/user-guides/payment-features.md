# Payment Features Guide

## Overview
SocialFlow enables seamless cryptocurrency payments on the Stellar network for content monetization, tips, and promotional campaigns.

## Payment Types

### 1. Content Tips
Send XLM or custom tokens to content creators.

### 2. Pay-Per-View Content
Access premium content with one-time payments.

### 3. Promotional Payments
Fund post promotions with tiered pricing.

### 4. Subscription Payments
Recurring payments for exclusive content access.

## Sending Payments

### Quick Tip Payment

1. **Navigate to Content**
   - Browse posts in Dashboard
   - Find content to support

2. **Initiate Payment**
   - Click "Tip" button on post
   - Payment modal opens

3. **Configure Payment**
   - Enter amount (minimum 0.1 XLM)
   - Select asset (XLM, USDC, or custom token)
   - Add optional memo message
   - Review recipient address

4. **Confirm Transaction**
   - Click "Send Payment"
   - Wallet popup appears
   - Review transaction details
   - Sign with wallet
   - Wait for confirmation

5. **Verification**
   - Success notification appears
   - Transaction hash displayed
   - View on Stellar Expert

### Promotional Campaign Payment

1. **Create Post**
   - Navigate to Create Post
   - Add content and media
   - Configure platforms

2. **Enable Promotion**
   - Click "Promote Post" button
   - Select promotion tier:
     - **Basic**: 10 XLM (24h, 1K-5K reach)
     - **Premium**: 25 XLM (72h, 5K-15K reach)
     - **Enterprise**: 50 XLM (168h, 15K+ reach)

3. **Complete Payment**
   - Review promotion details
   - Click "Pay & Promote"
   - Sign transaction
   - Promotion activates immediately

4. **Track Campaign**
   - View promotion status in post
   - Monitor reach and engagement
   - Access analytics dashboard

## Receiving Payments

### Setup Payment Receiving

1. **Connect Wallet**
   - Ensure wallet is connected
   - Verify public key is visible

2. **Enable Monetization**
   - Navigate to Settings
   - Select "Monetization" tab
   - Toggle "Enable Tips"
   - Configure payment preferences

3. **Set Payment Options**
   - Choose accepted assets
   - Set minimum tip amount
   - Configure payment notifications

### Payment Notifications

- Real-time notifications for received payments
- Desktop alerts (if enabled)
- Transaction history in Portfolio view
- Email notifications (optional)

## Payment Assets

### Native XLM
- Default Stellar asset
- Lowest transaction fees
- Instant settlement
- Universal acceptance

### USDC (Stellar)
- USD-pegged stablecoin
- Issued by Circle
- Requires trustline
- Stable value

### Custom Tokens
- Brand tokens
- Community tokens
- Requires trustline establishment
- Variable value

## Transaction Fees

### Network Fees
- **Base Fee**: 0.00001 XLM per operation
- **Typical Transaction**: 0.0001 XLM
- **Complex Transactions**: Up to 0.001 XLM

### Platform Fees
- **Tips**: No platform fee
- **Promotions**: Included in tier price
- **NFT Sales**: 2.5% platform fee

## Payment Security

### Transaction Verification
✅ Always verify recipient address
✅ Check amount and asset type
✅ Review memo field
✅ Confirm network (Testnet/Mainnet)

### Fraud Prevention
- Transactions are irreversible
- Double-check all details
- Use Testnet for practice
- Start with small amounts

### Best Practices
1. Test with small amounts first
2. Verify recipient identity
3. Keep transaction records
4. Monitor account activity
5. Report suspicious activity

## Payment History

### Viewing Transactions

1. **Access Transaction History**
   - Click wallet icon
   - Select "Transaction History"
   - View all payments

2. **Filter Transactions**
   - By date range
   - By transaction type
   - By asset
   - By status

3. **Transaction Details**
   - Transaction hash
   - Amount and asset
   - Sender/Recipient
   - Timestamp
   - Status (Success/Failed)
   - Network fee

### Export History
- Export to CSV
- Export to PDF
- Date range selection
- Include/exclude fees

## Troubleshooting Payments

### Payment Failed
**Causes:**
- Insufficient balance
- Network congestion
- Invalid recipient address
- Trustline not established

**Solutions:**
- Check XLM balance (need minimum 1 XLM reserve)
- Wait and retry
- Verify address format
- Establish trustline for custom assets

### Payment Pending
- Wait 5-10 seconds for confirmation
- Check network status
- View transaction on Stellar Expert
- Contact support if delayed >1 minute

### Wrong Amount Sent
- Transactions are irreversible
- Contact recipient for refund
- Double-check amounts in future
- Use Testnet for practice

## Advanced Features

### Batch Payments
- Send to multiple recipients
- CSV upload support
- Scheduled payments
- Coming soon

### Payment Requests
- Generate payment QR codes
- Share payment links
- Set expiration times
- Track payment status

### Recurring Payments
- Set up subscriptions
- Automatic renewals
- Cancel anytime
- Payment reminders

## API Integration

For developers integrating payments:

```javascript
// Example: Send payment
const payment = await stellarService.sendPayment({
  destination: 'GXXX...XXX',
  amount: '10',
  asset: 'XLM',
  memo: 'Tip for great content'
});
```

See [API Documentation](../api/payments.md) for details.

## Limits and Restrictions

### Transaction Limits
- **Minimum**: 0.0000001 XLM
- **Maximum**: No limit (subject to balance)
- **Daily Limit**: None (network-based)

### Account Requirements
- Minimum balance: 1 XLM (base reserve)
- Additional 0.5 XLM per trustline
- Additional 0.5 XLM per offer

## Support
- [Troubleshooting Guide](../troubleshooting/transaction-failures.md)
- [Wallet Connection Guide](./wallet-connection.md)
- [Stellar Payment Documentation](https://developers.stellar.org/docs/glossary/payments)
