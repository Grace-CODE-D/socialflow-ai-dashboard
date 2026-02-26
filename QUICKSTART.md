# Quick Start Guide - Soroban Contract Events & Templates

## Installation

The implementation is already integrated. Dependencies installed:
```bash
npm install @stellar/stellar-sdk
```

## Basic Usage

### 1. Import the Module

```typescript
import {
  smartContractService,
  CONTRACT_TEMPLATES,
  ContractEventType,
  getTemplateById
} from './src/blockchain';
```

### 2. Browse Contract Templates

```typescript
// View all available templates
console.log('Available templates:', CONTRACT_TEMPLATES.length);

CONTRACT_TEMPLATES.forEach(template => {
  console.log(`- ${template.name} (${template.type})`);
  console.log(`  WASM: ${template.wasmHash}`);
});

// Get specific template
const engagementTemplate = getTemplateById('engagement-rewards-v1');
console.log('Parameters:', engagementTemplate.parameters);
```

### 3. Process Transaction Events

```typescript
// When you receive a Stellar transaction
const events = await smartContractService.processTransaction(
  transactionHash,      // '0xabc...'
  transactionMeta,      // Base64 XDR from Stellar
  contractId,           // 'CCCC...'
  ledgerNumber          // 12345
);

console.log(`Extracted ${events.length} events`);
```

### 4. Query Stored Events

```typescript
// Get all events for a contract
const contractEvents = await smartContractService.getContractEvents(
  'CCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC'
);

// Get events by type
const rewards = await smartContractService.getEventsByType(
  ContractEventType.REWARD_DISTRIBUTED
);

// Get recent events
const recent = await smartContractService.getRecentEvents(20);
```

### 5. Parse Event Data

```typescript
// Parse reward events
const rewardData = smartContractService.parseRewardEvents(events);
rewardData.forEach(reward => {
  console.log(`${reward.recipient} received ${reward.amount} ${reward.token}`);
});

// Parse milestone events
const milestones = smartContractService.parseMilestoneEvents(events);
milestones.forEach(m => {
  console.log(`${m.user} reached milestone ${m.milestone}, reward: ${m.reward}`);
});

// Parse referral events
const referrals = smartContractService.parseReferralEvents(events);
referrals.forEach(r => {
  console.log(`${r.referrer} referred ${r.referee}, reward: ${r.reward}`);
});
```

### 6. Get Statistics

```typescript
const stats = await smartContractService.getEventStats();
console.log(`Total events: ${stats.total}`);
console.log('By type:', stats.byType);

// For specific contract
const contractStats = await smartContractService.getEventStats(contractId);
```

## Contract Templates

### Engagement Rewards
```typescript
const template = getTemplateById('engagement-rewards-v1');
// Use template.wasmHash for deployment
// Configure parameters:
// - reward_token: Token address
// - like_reward: 10 (default)
// - comment_reward: 25 (default)
// - share_reward: 50 (default)
// - max_rewards_per_user: 1000 (default)
```

### Referral Program
```typescript
const template = getTemplateById('referral-program-v1');
// Parameters:
// - reward_token: Token address
// - referrer_reward: 100 (default)
// - referee_reward: 50 (default)
// - min_engagement_threshold: 5 (default)
// - max_referrals_per_user: 50 (default)
```

### Milestone Bonus
```typescript
const template = getTemplateById('milestone-bonus-v1');
// Parameters:
// - reward_token: Token address
// - milestone_1k: 1000 (default)
// - milestone_10k: 10000 (default)
// - milestone_100k: 100000 (default)
// - milestone_1m: 1000000 (default)
// - auto_distribute: true (default)
```

## Event Types

```typescript
enum ContractEventType {
  REWARD_DISTRIBUTED = 'reward_distributed',
  CAMPAIGN_CREATED = 'campaign_created',
  CAMPAIGN_COMPLETED = 'campaign_completed',
  MILESTONE_REACHED = 'milestone_reached',
  REFERRAL_REGISTERED = 'referral_registered',
  ENGAGEMENT_RECORDED = 'engagement_recorded',
}
```

## Integration Example

```typescript
// In your Stellar transaction handler
async function handleStellarTransaction(tx) {
  // Extract transaction details
  const { hash, meta, contractId, ledger } = tx;
  
  // Process events
  const events = await smartContractService.processTransaction(
    hash,
    meta,
    contractId,
    ledger
  );
  
  // Handle specific event types
  const rewards = smartContractService.parseRewardEvents(events);
  
  // Update UI or trigger notifications
  rewards.forEach(reward => {
    notifyUser(reward.recipient, `You received ${reward.amount} tokens!`);
  });
}
```

## Testing

Run the example:
```bash
npx ts-node examples/contractEventsExample.ts
```

Run tests:
```bash
npm test src/blockchain/__tests__/contract.test.ts
```

## Storage

Events are automatically stored in IndexedDB:
- Database: `socialflow_blockchain`
- Store: `contract_events`
- Indexes: contractId, type, timestamp, transactionHash

## Next Steps

1. Connect to Stellar Horizon API for real transaction data
2. Set up WebSocket for real-time event monitoring
3. Create UI components to display events
4. Implement contract deployment from templates
5. Add push notifications for important events

## Support

See full documentation: `src/blockchain/README.md`
