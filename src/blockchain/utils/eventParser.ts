import { ContractEvent, ContractEventType, ParsedEventData } from '../types/contract';
import { scValToNative, xdr } from '@stellar/stellar-sdk';

export class ContractEventParser {
  /**
   * Parse contract events from transaction meta
   */
  static parseEventsFromMeta(transactionMeta: string, contractId: string): ContractEvent[] {
    try {
      const meta = xdr.TransactionMeta.fromXDR(transactionMeta, 'base64');
      const events: ContractEvent[] = [];

      if (meta.switch() === 3) {
        const v3 = meta.v3();
        const sorobanMeta = v3.sorobanMeta();
        
        if (sorobanMeta) {
          const contractEvents = sorobanMeta.events();
          
          contractEvents.forEach((event, index) => {
            const parsedEvent = this.parseEvent(event, contractId, index);
            if (parsedEvent) {
              events.push(parsedEvent);
            }
          });
        }
      }

      return events;
    } catch (error) {
      console.error('Error parsing transaction meta:', error);
      return [];
    }
  }

  /**
   * Parse individual contract event
   */
  private static parseEvent(
    event: xdr.ContractEvent,
    contractId: string,
    index: number
  ): ContractEvent | null {
    try {
      const topics = event.body().v0().topics().map(topic => {
        return scValToNative(topic);
      });

      const data = scValToNative(event.body().v0().data());

      return {
        id: `${contractId}-${index}-${Date.now()}`,
        contractId,
        type: this.extractEventType(topics),
        topics: topics.map(t => String(t)),
        data: this.normalizeEventData(data),
        timestamp: Date.now(),
        transactionHash: '',
        ledger: 0,
      };
    } catch (error) {
      console.error('Error parsing event:', error);
      return null;
    }
  }

  /**
   * Extract event type from topics
   */
  private static extractEventType(topics: any[]): string {
    if (topics.length === 0) return 'unknown';
    
    const firstTopic = String(topics[0]).toLowerCase();
    
    if (firstTopic.includes('reward')) return ContractEventType.REWARD_DISTRIBUTED;
    if (firstTopic.includes('campaign_created')) return ContractEventType.CAMPAIGN_CREATED;
    if (firstTopic.includes('campaign_completed')) return ContractEventType.CAMPAIGN_COMPLETED;
    if (firstTopic.includes('milestone')) return ContractEventType.MILESTONE_REACHED;
    if (firstTopic.includes('referral')) return ContractEventType.REFERRAL_REGISTERED;
    if (firstTopic.includes('engagement')) return ContractEventType.ENGAGEMENT_RECORDED;
    
    return firstTopic;
  }

  /**
   * Normalize event data to typed structure
   */
  private static normalizeEventData(data: any): Record<string, any> {
    if (typeof data === 'object' && data !== null) {
      return data;
    }
    return { value: data };
  }

  /**
   * Filter events by type
   */
  static filterEventsByType(events: ContractEvent[], eventType: ContractEventType): ContractEvent[] {
    return events.filter(event => event.type === eventType);
  }

  /**
   * Map event to typed structure
   */
  static mapToTypedEvent(event: ContractEvent): ParsedEventData {
    return {
      eventType: event.type as ContractEventType,
      payload: event.data,
      metadata: {
        contractId: event.contractId,
        transactionHash: event.transactionHash,
        ledger: event.ledger,
        timestamp: event.timestamp,
      },
    };
  }

  /**
   * Extract specific data from event
   */
  static extractEventData<T = any>(event: ContractEvent, key: string): T | null {
    return event.data[key] ?? null;
  }

  /**
   * Parse reward distributed event
   */
  static parseRewardEvent(event: ContractEvent): {
    recipient: string;
    amount: number;
    token: string;
  } | null {
    if (event.type !== ContractEventType.REWARD_DISTRIBUTED) return null;

    return {
      recipient: event.data.recipient || event.topics[1] || '',
      amount: Number(event.data.amount || 0),
      token: event.data.token || event.topics[2] || '',
    };
  }

  /**
   * Parse milestone event
   */
  static parseMilestoneEvent(event: ContractEvent): {
    user: string;
    milestone: number;
    reward: number;
  } | null {
    if (event.type !== ContractEventType.MILESTONE_REACHED) return null;

    return {
      user: event.data.user || event.topics[1] || '',
      milestone: Number(event.data.milestone || 0),
      reward: Number(event.data.reward || 0),
    };
  }

  /**
   * Parse referral event
   */
  static parseReferralEvent(event: ContractEvent): {
    referrer: string;
    referee: string;
    reward: number;
  } | null {
    if (event.type !== ContractEventType.REFERRAL_REGISTERED) return null;

    return {
      referrer: event.data.referrer || event.topics[1] || '',
      referee: event.data.referee || event.topics[2] || '',
      reward: Number(event.data.reward || 0),
    };
  }
}
