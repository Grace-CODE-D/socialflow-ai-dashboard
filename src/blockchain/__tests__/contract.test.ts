import { describe, it, expect, beforeEach } from '@jest/globals';
import { 
  ContractEventParser,
  eventStorage,
  smartContractService,
  CONTRACT_TEMPLATES,
  getTemplateById,
  getTemplatesByType,
  ContractEventType,
  ContractEvent
} from '../src/blockchain';

describe('Contract Templates', () => {
  it('should have 3 pre-built templates', () => {
    expect(CONTRACT_TEMPLATES).toHaveLength(3);
  });

  it('should retrieve template by ID', () => {
    const template = getTemplateById('engagement-rewards-v1');
    expect(template).toBeDefined();
    expect(template?.name).toBe('Engagement Rewards');
    expect(template?.type).toBe('engagement_rewards');
  });

  it('should retrieve templates by type', () => {
    const referralTemplates = getTemplatesByType('referral_program');
    expect(referralTemplates).toHaveLength(1);
    expect(referralTemplates[0].name).toBe('Referral Program');
  });

  it('should have WASM hashes for all templates', () => {
    CONTRACT_TEMPLATES.forEach(template => {
      expect(template.wasmHash).toBeDefined();
      expect(template.wasmHash).toMatch(/^0x[a-f0-9]{64}$/);
    });
  });

  it('should have required parameters for engagement template', () => {
    const template = getTemplateById('engagement-rewards-v1');
    expect(template?.parameters).toHaveLength(5);
    
    const rewardToken = template?.parameters.find(p => p.name === 'reward_token');
    expect(rewardToken?.required).toBe(true);
    expect(rewardToken?.type).toBe('address');
  });
});

describe('Event Parser', () => {
  it('should extract event type from topics', () => {
    const mockEvent: ContractEvent = {
      id: 'test-1',
      contractId: 'CTEST',
      type: 'reward_distributed',
      topics: ['reward_distributed', 'recipient_address', 'token_address'],
      data: { amount: 100 },
      timestamp: Date.now(),
      transactionHash: '0xtest',
      ledger: 12345,
    };

    const filtered = ContractEventParser.filterEventsByType(
      [mockEvent],
      ContractEventType.REWARD_DISTRIBUTED
    );
    
    expect(filtered).toHaveLength(1);
    expect(filtered[0].type).toBe(ContractEventType.REWARD_DISTRIBUTED);
  });

  it('should parse reward event data', () => {
    const mockEvent: ContractEvent = {
      id: 'test-1',
      contractId: 'CTEST',
      type: ContractEventType.REWARD_DISTRIBUTED,
      topics: ['reward_distributed', 'GTEST123', 'USDC'],
      data: { recipient: 'GTEST123', amount: 100, token: 'USDC' },
      timestamp: Date.now(),
      transactionHash: '0xtest',
      ledger: 12345,
    };

    const parsed = ContractEventParser.parseRewardEvent(mockEvent);
    expect(parsed).toBeDefined();
    expect(parsed?.recipient).toBe('GTEST123');
    expect(parsed?.amount).toBe(100);
    expect(parsed?.token).toBe('USDC');
  });

  it('should parse milestone event data', () => {
    const mockEvent: ContractEvent = {
      id: 'test-1',
      contractId: 'CTEST',
      type: ContractEventType.MILESTONE_REACHED,
      topics: ['milestone_reached', 'GTEST123'],
      data: { user: 'GTEST123', milestone: 10000, reward: 1000 },
      timestamp: Date.now(),
      transactionHash: '0xtest',
      ledger: 12345,
    };

    const parsed = ContractEventParser.parseMilestoneEvent(mockEvent);
    expect(parsed).toBeDefined();
    expect(parsed?.user).toBe('GTEST123');
    expect(parsed?.milestone).toBe(10000);
    expect(parsed?.reward).toBe(1000);
  });

  it('should parse referral event data', () => {
    const mockEvent: ContractEvent = {
      id: 'test-1',
      contractId: 'CTEST',
      type: ContractEventType.REFERRAL_REGISTERED,
      topics: ['referral_registered', 'GREF123', 'GNEW456'],
      data: { referrer: 'GREF123', referee: 'GNEW456', reward: 100 },
      timestamp: Date.now(),
      transactionHash: '0xtest',
      ledger: 12345,
    };

    const parsed = ContractEventParser.parseReferralEvent(mockEvent);
    expect(parsed).toBeDefined();
    expect(parsed?.referrer).toBe('GREF123');
    expect(parsed?.referee).toBe('GNEW456');
    expect(parsed?.reward).toBe(100);
  });
});

describe('Smart Contract Service', () => {
  beforeEach(async () => {
    await eventStorage.clearAllEvents();
  });

  it('should filter events by type', () => {
    const mockEvents: ContractEvent[] = [
      {
        id: 'test-1',
        contractId: 'CTEST',
        type: ContractEventType.REWARD_DISTRIBUTED,
        topics: [],
        data: {},
        timestamp: Date.now(),
        transactionHash: '0xtest1',
        ledger: 12345,
      },
      {
        id: 'test-2',
        contractId: 'CTEST',
        type: ContractEventType.MILESTONE_REACHED,
        topics: [],
        data: {},
        timestamp: Date.now(),
        transactionHash: '0xtest2',
        ledger: 12346,
      },
    ];

    const filtered = smartContractService.filterEvents(
      mockEvents,
      ContractEventType.REWARD_DISTRIBUTED
    );

    expect(filtered).toHaveLength(1);
    expect(filtered[0].type).toBe(ContractEventType.REWARD_DISTRIBUTED);
  });

  it('should parse multiple reward events', () => {
    const mockEvents: ContractEvent[] = [
      {
        id: 'test-1',
        contractId: 'CTEST',
        type: ContractEventType.REWARD_DISTRIBUTED,
        topics: [],
        data: { recipient: 'GTEST1', amount: 100, token: 'XLM' },
        timestamp: Date.now(),
        transactionHash: '0xtest1',
        ledger: 12345,
      },
      {
        id: 'test-2',
        contractId: 'CTEST',
        type: ContractEventType.REWARD_DISTRIBUTED,
        topics: [],
        data: { recipient: 'GTEST2', amount: 200, token: 'USDC' },
        timestamp: Date.now(),
        transactionHash: '0xtest2',
        ledger: 12346,
      },
    ];

    const parsed = smartContractService.parseRewardEvents(mockEvents);
    expect(parsed).toHaveLength(2);
    expect(parsed[0].amount).toBe(100);
    expect(parsed[1].amount).toBe(200);
  });
});

describe('Event Storage', () => {
  beforeEach(async () => {
    await eventStorage.init();
    await eventStorage.clearAllEvents();
  });

  it('should store and retrieve event', async () => {
    const mockEvent: ContractEvent = {
      id: 'test-1',
      contractId: 'CTEST',
      type: ContractEventType.REWARD_DISTRIBUTED,
      topics: ['reward'],
      data: { amount: 100 },
      timestamp: Date.now(),
      transactionHash: '0xtest',
      ledger: 12345,
    };

    await eventStorage.storeEvent(mockEvent);
    const events = await eventStorage.getEventsByContract('CTEST');
    
    expect(events).toHaveLength(1);
    expect(events[0].id).toBe('test-1');
  });

  it('should store multiple events', async () => {
    const mockEvents: ContractEvent[] = [
      {
        id: 'test-1',
        contractId: 'CTEST',
        type: ContractEventType.REWARD_DISTRIBUTED,
        topics: [],
        data: {},
        timestamp: Date.now(),
        transactionHash: '0xtest1',
        ledger: 12345,
      },
      {
        id: 'test-2',
        contractId: 'CTEST',
        type: ContractEventType.MILESTONE_REACHED,
        topics: [],
        data: {},
        timestamp: Date.now(),
        transactionHash: '0xtest2',
        ledger: 12346,
      },
    ];

    await eventStorage.storeEvents(mockEvents);
    const events = await eventStorage.getEventsByContract('CTEST');
    
    expect(events).toHaveLength(2);
  });

  it('should retrieve events by type', async () => {
    const mockEvents: ContractEvent[] = [
      {
        id: 'test-1',
        contractId: 'CTEST',
        type: ContractEventType.REWARD_DISTRIBUTED,
        topics: [],
        data: {},
        timestamp: Date.now(),
        transactionHash: '0xtest1',
        ledger: 12345,
      },
      {
        id: 'test-2',
        contractId: 'CTEST',
        type: ContractEventType.MILESTONE_REACHED,
        topics: [],
        data: {},
        timestamp: Date.now(),
        transactionHash: '0xtest2',
        ledger: 12346,
      },
    ];

    await eventStorage.storeEvents(mockEvents);
    const rewardEvents = await eventStorage.getEventsByType(
      ContractEventType.REWARD_DISTRIBUTED
    );
    
    expect(rewardEvents).toHaveLength(1);
    expect(rewardEvents[0].type).toBe(ContractEventType.REWARD_DISTRIBUTED);
  });
});
