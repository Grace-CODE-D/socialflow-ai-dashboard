# Frequently Asked Questions (FAQ)

## General Questions

### What is SocialFlow?
SocialFlow is a decentralized social media management platform that integrates blockchain technology (Stellar) with AI-powered content creation. It enables creators to monetize content, manage campaigns, and build on-chain reputation.

### Is SocialFlow free to use?
Yes, the core features are free. You only pay Stellar network fees (typically 0.0001 XLM per transaction) and optional promotional campaign costs.

### Do I need cryptocurrency to use SocialFlow?
Yes, you need a small amount of XLM (Stellar Lumens) for transaction fees. For testing, use Testnet with free XLM from Friendbot.

### What's the difference between Testnet and Mainnet?
- **Testnet**: Free test environment with no real value. Perfect for learning and testing.
- **Mainnet**: Production network with real XLM that has monetary value.

### Is my data secure?
Yes. SocialFlow never stores your private keys. All blockchain transactions are signed locally in your wallet. Social media credentials use OAuth and are never stored.

## Wallet Questions

### Which wallets are supported?
- Freighter (browser extension) - Recommended
- Albedo (web-based wallet)

### How do I get a Stellar wallet?
1. Visit [freighter.app](https://freighter.app)
2. Install browser extension
3. Create new wallet or import existing
4. Securely backup your secret key

### What if I lose my secret key?
Your secret key cannot be recovered. Always backup your key securely. Consider:
- Writing it down on paper
- Using a hardware wallet
- Storing in a password manager
- Never taking screenshots

### How much XLM do I need?
- **Minimum**: 1 XLM (base reserve)
- **Recommended**: 2-5 XLM for active use
- **Per trustline**: +0.5 XLM
- **Transaction fees**: ~0.0001 XLM each

### Can I use multiple wallets?
Yes, you can connect different wallets, but only one can be active at a time. Switch wallets in Settings.

## Payment Questions

### How do I send a payment?
1. Click "Tip" or "Pay" button
2. Enter amount and select asset
3. Review transaction details
4. Sign with your wallet
5. Wait for confirmation (5-10 seconds)

### Are payments reversible?
No. Blockchain transactions are permanent and cannot be reversed. Always verify recipient address and amount before sending.

### What are transaction fees?
Stellar network fees are typically 0.00001-0.0001 XLM per transaction. SocialFlow doesn't charge additional fees for basic payments.

### Can I send tokens other than XLM?
Yes, you can send any Stellar asset (USDC, custom tokens) if you have established a trustline for that asset.

### What is a trustline?
A trustline is permission to hold a specific asset. It requires 0.5 XLM reserve and must be established before receiving that asset.

### How long do payments take?
Stellar transactions typically confirm in 5-10 seconds. If delayed, check network status at status.stellar.org.

## NFT Questions

### What can I mint as an NFT?
- Digital art (images)
- Videos
- Music
- Documents
- Any digital content you own

### How much does it cost to mint an NFT?
- Asset creation: 0.5 XLM (one-time reserve)
- Network fee: ~0.0001 XLM
- IPFS storage: Free (included)
- **Total**: ~0.5001 XLM per NFT

### Where is my NFT stored?
- **Content**: IPFS (decentralized storage)
- **Ownership**: Stellar blockchain
- **Metadata**: On-chain data entries

### Can I sell my NFTs?
Yes, you can transfer NFTs to other users. Marketplace features are coming soon.

### What happens if I burn an NFT?
Burning permanently destroys the NFT. The asset is removed from the blockchain and cannot be recovered. The 0.5 XLM reserve is returned to your account.

### Can I mint multiple editions?
Yes, you can create limited edition NFTs by specifying the total supply when minting.

## Campaign Questions

### What types of campaigns can I create?
- Engagement campaigns (likes, shares, comments)
- Referral campaigns
- Content promotion
- Milestone rewards

### How do smart contracts work?
Smart contracts automatically execute campaign rules. When users complete actions, rewards are distributed automatically without manual intervention.

### Can I modify a running campaign?
Yes, you can:
- Add more budget
- Pause/resume campaign
- Adjust reward amounts (for new claims)
- Extend duration

### What if my campaign budget runs out?
The campaign automatically pauses when budget is depleted. Add more funds to resume, or let it end naturally.

### How do I prevent fraud?
SocialFlow includes:
- Rate limiting
- Duplicate detection
- Bot filtering
- Manual review options
- On-chain verification

### Can I get a refund?
Unused campaign funds can be withdrawn by terminating the campaign early. Distributed rewards cannot be refunded.

## Verification Questions

### Why should I verify my identity?
Benefits include:
- Verified badge on profile
- Increased trust and credibility
- Access to premium features
- Higher engagement rates
- Fraud protection

### What information is stored on-chain?
Only your public Stellar address and social media usernames. No personal information, emails, or phone numbers are stored on-chain.

### How long does verification take?
Typically 1-2 minutes per social profile. The entire process can be completed in under 10 minutes.

### Do I need to reverify?
Yes, reverification is required every 90 days to ensure account ownership. You'll receive advance notification.

### Can I remove my verification?
Yes, you can revoke verification anytime. This removes your verified badge and updates on-chain data.

### Is verification required?
No, verification is optional but recommended for building trust and accessing premium features.

## Technical Questions

### What blockchain does SocialFlow use?
Stellar blockchain for fast, low-cost transactions and Soroban for smart contracts.

### What is IPFS?
InterPlanetary File System - decentralized storage for NFT content. Files are content-addressed and permanently available.

### Can I use SocialFlow on mobile?
Currently, SocialFlow is a desktop application. Mobile support is planned for future release.

### What browsers are supported?
- Chrome ✅
- Firefox ✅
- Edge ✅
- Brave ✅
- Safari ❌ (Freighter not available)

### Is the code open source?
Yes, SocialFlow is open source. View the code on [GitHub](https://github.com/socialflow).

### How can I contribute?
- Report bugs on GitHub
- Submit feature requests
- Contribute code via pull requests
- Join the Discord community
- Share feedback

## Troubleshooting Questions

### Why can't I connect my wallet?
Common causes:
- Wallet extension not installed
- Extension disabled
- Popup blocked
- Wallet locked

See [Wallet Troubleshooting](./wallet-issues.md) for solutions.

### Why did my transaction fail?
Common causes:
- Insufficient balance
- Invalid recipient address
- Network issues
- Trustline not established

See [Transaction Failures](./transaction-failures.md) for solutions.

### Why isn't my balance updating?
- Wait 5-10 seconds for blockchain sync
- Refresh the page
- Check you're on correct network (Testnet/Mainnet)
- Verify transaction completed on Stellar Expert

### How do I report a bug?
1. Check if it's a known issue
2. Gather error details
3. Submit on GitHub Issues
4. Or email support@socialflow.app

## Security Questions

### Is SocialFlow safe?
Yes. SocialFlow:
- Never stores private keys
- Uses secure OAuth for social media
- Open source code
- Audited smart contracts
- Non-custodial architecture

### What should I never share?
❌ Private/secret key
❌ Wallet password
❌ Recovery phrase
❌ 2FA codes

### What's safe to share?
✅ Public key/address
✅ Transaction hashes
✅ Public profile information
✅ Verification status

### How do I stay safe?
1. Never share private keys
2. Verify all transactions before signing
3. Use strong passwords
4. Enable 2FA on social accounts
5. Keep software updated
6. Be cautious of phishing
7. Use Testnet for learning

### What if I suspect fraud?
1. Don't sign suspicious transactions
2. Disconnect wallet immediately
3. Report to support@socialflow.app
4. Check transaction history
5. Consider creating new wallet if compromised

## Feature Questions

### Can I schedule posts?
Yes, schedule posts for future publication across multiple platforms.

### Does SocialFlow support all social media platforms?
Currently supported:
- Instagram
- Twitter/X
- Facebook
- LinkedIn
- TikTok

More platforms coming soon.

### Can I use AI to generate content?
Yes, SocialFlow integrates Gemini AI for:
- Caption generation
- Content suggestions
- Hashtag recommendations
- Reply automation

### Can I collaborate with team members?
Team features are planned for future release. Currently, SocialFlow is designed for individual creators.

### Is there an API?
Yes, developer API is available. See [API Documentation](../api/overview.md) for details.

## Pricing Questions

### What are the costs?
- **Platform**: Free
- **Network fees**: ~0.0001 XLM per transaction
- **NFT minting**: 0.5 XLM per NFT
- **Promotions**: 10-50 XLM depending on tier
- **Trustlines**: 0.5 XLM per asset

### Are there subscription plans?
Currently, no. All features are available with pay-per-use pricing via network fees.

### How do I get test XLM?
1. Navigate to Developer Tools
2. Enter your public key
3. Click "Fund via Friendbot"
4. Receive 10,000 test XLM instantly

### Where can I buy real XLM?
- Coinbase
- Binance
- Kraken
- Other major exchanges

Then withdraw to your Stellar address.

## Support Questions

### How do I get help?
1. Check this FAQ
2. Read [Troubleshooting Guides](./common-errors.md)
3. Search Discord community
4. Email support@socialflow.app
5. Submit GitHub issue

### What information should I include in support requests?
- Detailed description of issue
- Error messages (exact text)
- Transaction hash (if applicable)
- Public key (never private key!)
- Steps to reproduce
- Browser and OS version
- Screenshots (if helpful)

### How long does support take?
- Email: 24-48 hours
- Discord: Community support (varies)
- GitHub: Depends on issue complexity

### Is there a community?
Yes! Join us:
- Discord: SocialFlow Community
- Twitter: @SocialFlow
- GitHub: Discussions
- Telegram: SocialFlow Chat

## Roadmap Questions

### What features are coming next?
- Mobile app
- Marketplace for NFTs
- Team collaboration
- Advanced analytics
- More social platforms
- Hardware wallet support

### Can I request features?
Yes! Submit feature requests:
- GitHub Discussions
- Discord #feature-requests
- Email: features@socialflow.app

### When will [feature] be available?
Check the [public roadmap](https://github.com/socialflow/roadmap) for planned features and timelines.

## Still Have Questions?

### Contact Support
- **Email**: support@socialflow.app
- **Discord**: [SocialFlow Community](https://discord.gg/socialflow)
- **Twitter**: [@SocialFlowSupport](https://twitter.com/socialflowsupport)
- **GitHub**: [Issue Tracker](https://github.com/socialflow/issues)

### Documentation
- [User Guides](../user-guides/)
- [Troubleshooting](../troubleshooting/)
- [API Documentation](../api/)
- [Developer Docs](../technical/)
