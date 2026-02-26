# Campaign Management Guide

## Overview
Create and manage promotional campaigns using Stellar smart contracts to automate engagement rewards and track performance transparently.

## Campaign Types

### 1. Engagement Campaigns
Reward users for likes, shares, and comments.

### 2. Referral Campaigns
Incentivize user acquisition and growth.

### 3. Content Campaigns
Promote specific posts with budget allocation.

### 4. Milestone Campaigns
Reward achievement of specific goals.

## Creating a Campaign

### Step 1: Access Campaign Manager

1. Navigate to **Promotion** section
2. Click **"Create Campaign"**
3. Campaign wizard opens

### Step 2: Choose Campaign Type

**Engagement Campaign**
- Reward social interactions
- Automated distribution
- Performance tracking

**Referral Campaign**
- Track referral links
- Reward successful conversions
- Multi-tier rewards

**Content Promotion**
- Boost post visibility
- Targeted reach
- Analytics dashboard

### Step 3: Configure Campaign Details

#### Basic Information
```
Campaign Name: Summer Promotion 2026
Description: Reward community engagement
Duration: 7 days
Start Date: 2026-03-01
End Date: 2026-03-08
```

#### Budget Allocation
- **Total Budget**: 1000 XLM
- **Per-Action Reward**: 0.5 XLM
- **Maximum Claims**: 2000
- **Reserve**: 10 XLM (for fees)

#### Reward Structure
| Action | Reward | Limit |
|--------|--------|-------|
| Like | 0.1 XLM | 1 per user |
| Share | 0.5 XLM | 3 per user |
| Comment | 0.3 XLM | 5 per user |
| Referral | 1.0 XLM | Unlimited |

### Step 4: Set Campaign Rules

#### Eligibility Criteria
- Minimum account age: 7 days
- Verified accounts only: Yes/No
- Geographic restrictions: None
- Previous participation: Allowed

#### Action Requirements
- **Like**: Single click
- **Share**: Must be public
- **Comment**: Minimum 10 characters
- **Referral**: New user signup

#### Fraud Prevention
- Rate limiting: 10 actions per hour
- Duplicate detection: Enabled
- Bot filtering: Enabled
- Manual review: For high-value claims

### Step 5: Deploy Smart Contract

1. **Review Contract Terms**
   - Budget allocation
   - Reward distribution logic
   - Claim conditions
   - Expiration rules

2. **Contract Deployment**
   - Click "Deploy Contract"
   - Review transaction
   - Sign with wallet
   - Wait for confirmation

3. **Contract Address**
   - Unique contract ID generated
   - Funds locked in contract
   - Transparent on-chain
   - Auditable by anyone

### Step 6: Fund Campaign

1. **Transfer Budget**
   - Send XLM to contract address
   - Include reserve for fees
   - Confirm transaction
   - Budget shows as "Funded"

2. **Budget Verification**
   - Check contract balance
   - Verify on Stellar Expert
   - Monitor remaining funds
   - Top up if needed

### Step 7: Launch Campaign

1. **Pre-Launch Checklist**
   - ✅ Contract deployed
   - ✅ Budget funded
   - ✅ Rules configured
   - ✅ Start date set
   - ✅ Tracking enabled

2. **Activate Campaign**
   - Click "Launch Campaign"
   - Campaign goes live
   - Users can start claiming
   - Analytics begin tracking

## Managing Active Campaigns

### Campaign Dashboard

#### Overview Metrics
- **Total Budget**: 1000 XLM
- **Spent**: 234.5 XLM (23.5%)
- **Remaining**: 765.5 XLM
- **Claims**: 469 / 2000
- **Participants**: 156 unique users
- **Days Remaining**: 4

#### Performance Metrics
- **Engagement Rate**: 12.3%
- **Average Reward**: 0.5 XLM
- **ROI**: 3.2x
- **Reach**: 15,234 users
- **Conversion**: 8.7%

### Real-Time Monitoring

1. **Live Activity Feed**
   - Recent claims
   - User actions
   - Reward distributions
   - Fraud alerts

2. **Analytics Charts**
   - Participation over time
   - Budget consumption rate
   - Action breakdown
   - Geographic distribution

### Adjusting Campaigns

#### Modify Budget
1. Navigate to campaign settings
2. Click "Add Funds"
3. Enter additional amount
4. Sign transaction
5. Budget updated

#### Update Rules
- Pause campaign
- Modify reward amounts
- Adjust eligibility
- Change duration
- Resume campaign

#### Emergency Actions
- **Pause**: Stop new claims
- **Resume**: Restart campaign
- **Terminate**: End early and refund
- **Extend**: Add more time

## Reward Distribution

### Automatic Distribution

1. **User Claims Reward**
   - Completes required action
   - Clicks "Claim Reward"
   - Smart contract verifies eligibility
   - Reward sent automatically

2. **Verification Process**
   - Action validated on-chain
   - Duplicate check performed
   - Eligibility confirmed
   - Transaction executed

3. **Confirmation**
   - User receives notification
   - Transaction hash provided
   - Balance updated
   - Claim recorded

### Manual Distribution

1. **Review Claims**
   - Access pending claims
   - Verify user actions
   - Approve/Reject claims
   - Batch processing available

2. **Bulk Approval**
   - Select multiple claims
   - Click "Approve Selected"
   - Sign batch transaction
   - All rewards distributed

## Campaign Analytics

### Performance Reports

#### Engagement Metrics
- Total interactions
- Unique participants
- Action breakdown
- Time-based trends
- Peak activity periods

#### Financial Metrics
- Total spent
- Average cost per action
- ROI calculation
- Budget efficiency
- Remaining allocation

#### User Metrics
- New vs returning users
- Geographic distribution
- Device breakdown
- Referral sources
- Retention rate

### Export Reports

1. **Generate Report**
   - Select date range
   - Choose metrics
   - Select format (CSV/PDF)
   - Click "Export"

2. **Report Contents**
   - Campaign summary
   - Detailed transactions
   - User analytics
   - Performance charts
   - Recommendations

## Campaign Templates

### Pre-Built Templates

#### Growth Campaign
- Focus: User acquisition
- Budget: 500 XLM
- Duration: 14 days
- Rewards: Referral-based

#### Engagement Boost
- Focus: Content interaction
- Budget: 200 XLM
- Duration: 7 days
- Rewards: Action-based

#### Launch Campaign
- Focus: Product launch
- Budget: 1000 XLM
- Duration: 30 days
- Rewards: Milestone-based

### Custom Templates

1. **Create Template**
   - Configure campaign
   - Save as template
   - Name and describe
   - Reuse for future campaigns

2. **Template Library**
   - Browse saved templates
   - Clone and modify
   - Share with team
   - Version control

## Smart Contract Features

### Automated Execution
- No manual intervention needed
- Trustless reward distribution
- Transparent rules
- Immutable logic

### Budget Management
- Locked funds in contract
- Automatic refunds
- Overflow protection
- Fee optimization

### Fraud Prevention
- On-chain verification
- Rate limiting
- Duplicate detection
- Sybil resistance

### Audit Trail
- All actions recorded
- Public verification
- Transaction history
- Dispute resolution

## Best Practices

### Campaign Planning
✅ Set clear objectives
✅ Define target audience
✅ Calculate realistic budget
✅ Test on Testnet first
✅ Plan for contingencies

### Budget Management
✅ Start with conservative budget
✅ Monitor spending rate
✅ Keep reserve for fees
✅ Plan for extensions
✅ Track ROI continuously

### Engagement Optimization
✅ Offer meaningful rewards
✅ Make actions simple
✅ Provide clear instructions
✅ Respond to feedback
✅ Iterate based on data

### Security
✅ Audit smart contracts
✅ Test thoroughly
✅ Monitor for fraud
✅ Have emergency plan
✅ Keep funds secure

## Troubleshooting

### Campaign Not Starting
**Causes:**
- Insufficient funds
- Contract not deployed
- Invalid start date
- Configuration errors

**Solutions:**
- Fund contract fully
- Redeploy if needed
- Check date settings
- Review all settings

### Rewards Not Distributing
**Causes:**
- Contract balance depleted
- Eligibility not met
- Network congestion
- Smart contract error

**Solutions:**
- Add more funds
- Verify user eligibility
- Wait and retry
- Check contract status

### Low Participation
**Causes:**
- Unclear instructions
- Low reward value
- Poor visibility
- Complex requirements

**Solutions:**
- Simplify instructions
- Increase rewards
- Promote campaign
- Reduce friction

## Advanced Features

### Multi-Tier Rewards
```
Tier 1: 1-10 actions = 0.5 XLM each
Tier 2: 11-50 actions = 0.7 XLM each
Tier 3: 51+ actions = 1.0 XLM each
```

### Time-Based Bonuses
- Early bird bonus: +50% first 24h
- Weekend bonus: +25% Sat-Sun
- Final hour: +100% last hour

### Leaderboard Campaigns
- Top 10 participants
- Bonus rewards for leaders
- Real-time rankings
- Competitive engagement

## API Integration

For developers:

```javascript
// Create campaign
const campaign = await campaignService.create({
  name: 'Summer Promo',
  budget: '1000',
  duration: 7,
  rewards: {
    like: '0.1',
    share: '0.5'
  }
});

// Monitor campaign
const stats = await campaign.getStats();
```

See [API Documentation](../api/campaigns.md) for details.

## Support
- [Smart Contract Documentation](../technical/smart-contracts.md)
- [Troubleshooting Guide](../troubleshooting/campaign-issues.md)
- [Soroban Documentation](https://soroban.stellar.org)
