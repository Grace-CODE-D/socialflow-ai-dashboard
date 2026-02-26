import { useEffect, useCallback } from 'react';
import { BlockchainEventType } from '../src/blockchain/services/EventMonitorService';

interface BlockchainEvent {
  id: string;
  type: BlockchainEventType;
  timestamp: string;
  account: string;
  data: any;
}

interface UIUpdateCallbacks {
  onPayment?: (event: BlockchainEvent) => void;
  onTokenTransfer?: (event: BlockchainEvent) => void;
  onNFTTransfer?: (event: BlockchainEvent) => void;
  onContractExecution?: (event: BlockchainEvent) => void;
  onAccountCreated?: (event: BlockchainEvent) => void;
  onTrustlineCreated?: (event: BlockchainEvent) => void;
}

export function useBlockchainUpdates(callbacks: UIUpdateCallbacks) {
  const handleEvents = useCallback((events: BlockchainEvent[]) => {
    events.forEach((event) => {
      switch (event.type) {
        case BlockchainEventType.PAYMENT:
          callbacks.onPayment?.(event);
          break;
        case BlockchainEventType.TOKEN_TRANSFER:
          callbacks.onTokenTransfer?.(event);
          break;
        case BlockchainEventType.NFT_TRANSFER:
          callbacks.onNFTTransfer?.(event);
          break;
        case BlockchainEventType.CONTRACT_EXECUTION:
          callbacks.onContractExecution?.(event);
          break;
        case BlockchainEventType.ACCOUNT_CREATED:
          callbacks.onAccountCreated?.(event);
          break;
        case BlockchainEventType.TRUSTLINE_CREATED:
          callbacks.onTrustlineCreated?.(event);
          break;
      }
    });
  }, [callbacks]);

  useEffect(() => {
    if (!window.electronAPI?.blockchain) return;

    const unsubscribe = window.electronAPI.blockchain.onEvents(handleEvents);
    return unsubscribe;
  }, [handleEvents]);
}
