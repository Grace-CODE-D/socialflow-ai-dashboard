import { 
  smartContractService, 
  CONTRACT_TEMPLATES, 
  getTemplateById,
  getTemplatesByType,
  ContractEventType,
  eventStorage
} from '../src/blockchain';

/**
 * Example usage of contract event parsing and templates
 */

// Example 1: Get all contract templates
console.log('=== Available Contract Templates ===');
CONTRACT_TEMPLATES.forEach(template => {
  console.log(`${template.name} (${template.type})`);
  console.log(`  Description: ${template.description}`);
  console.log(`  WASM Hash: ${template.wasmHash}`);
  console.log(`  Parameters: ${template.parameters.length}`);
  console.log('');
});

// Example 2: Get specific template by ID
const engagementTemplate = getTemplateById('engagement-rewards-v1');
if (engagementTemplate) {
  console.log('=== Engagement Rewards Template ===');
  console.log('Parameters:');
  engagementTemplate.parameters.forEach(param => {
    console.log(`  - ${param.name} (${param.type}): ${param.description}`);
    if (param.defaultValue !== undefined) {
      console.log(`    Default: ${param.defaultValue}`);
    }
  });
  console.log('');
}

// Example 3: Get templates by type
const referralTemplates = getTemplatesByType('referral_program');
console.log(`=== Referral Program Templates (${referralTemplates.length}) ===`);
referralTemplates.forEach(t => console.log(`  - ${t.name}`));
console.log('');

// Example 4: Process a transaction and extract events
async function processTransactionExample() {
  console.log('=== Processing Transaction Events ===');
  
  // Mock transaction data (in real usage, this comes from Stellar network)
  const mockTransactionHash = '0xabcdef1234567890';
  const mockContractId = 'CCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC';
  const mockLedger = 12345;
  
  // Mock transaction meta (base64 encoded XDR)
  // In production, this would be actual Stellar transaction meta
  const mockTransactionMeta = 'AAAAAwAAAAAAAAACAAAAAwABhqAAAAAAAAAAAGptPoxXmWrW...';
  
  try {
    const events = await smartContractService.processTransaction(
      mockTransactionHash,
      mockTransactionMeta,
      mockContractId,
      mockLedger
    );
    
    console.log(`Extracted ${events.length} events from transaction`);
    events.forEach(event => {
      console.log(`  Event: ${event.type}`);
      console.log(`    Contract: ${event.contractId}`);
      console.log(`    Topics: ${event.topics.join(', ')}`);
      console.log(`    Data:`, event.data);
    });
  } catch (error) {
    console.log('Note: Mock transaction meta - in production use real Stellar data');
  }
  console.log('');
}

// Example 5: Filter events by type
async function filterEventsExample() {
  console.log('=== Filtering Events by Type ===');
  
  try {
    const rewardEvents = await smartContractService.getEventsByType(
      ContractEventType.REWARD_DISTRIBUTED
    );
    console.log(`Found ${rewardEvents.length} reward distribution events`);
    
    const milestoneEvents = await smartContractService.getEventsByType(
      ContractEventType.MILESTONE_REACHED
    );
    console.log(`Found ${milestoneEvents.length} milestone events`);
  } catch (error) {
    console.log('No events in database yet');
  }
  console.log('');
}

// Example 6: Get event statistics
async function getStatsExample() {
  console.log('=== Event Statistics ===');
  
  try {
    const stats = await smartContractService.getEventStats();
    console.log(`Total events: ${stats.total}`);
    console.log('Events by type:');
    Object.entries(stats.byType).forEach(([type, count]) => {
      console.log(`  ${type}: ${count}`);
    });
  } catch (error) {
    console.log('No statistics available yet');
  }
  console.log('');
}

// Example 7: Parse specific event types
async function parseSpecificEventsExample() {
  console.log('=== Parsing Specific Event Types ===');
  
  try {
    const recentEvents = await smartContractService.getRecentEvents(10);
    
    // Parse reward events
    const rewards = smartContractService.parseRewardEvents(recentEvents);
    console.log(`Parsed ${rewards.length} reward events:`);
    rewards.forEach(reward => {
      console.log(`  Recipient: ${reward.recipient}`);
      console.log(`  Amount: ${reward.amount}`);
      console.log(`  Token: ${reward.token}`);
    });
    
    // Parse milestone events
    const milestones = smartContractService.parseMilestoneEvents(recentEvents);
    console.log(`Parsed ${milestones.length} milestone events:`);
    milestones.forEach(milestone => {
      console.log(`  User: ${milestone.user}`);
      console.log(`  Milestone: ${milestone.milestone}`);
      console.log(`  Reward: ${milestone.reward}`);
    });
  } catch (error) {
    console.log('No events to parse yet');
  }
  console.log('');
}

// Run examples
(async () => {
  await processTransactionExample();
  await filterEventsExample();
  await getStatsExample();
  await parseSpecificEventsExample();
})();
