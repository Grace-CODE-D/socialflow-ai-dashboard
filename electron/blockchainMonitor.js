/**
 * Blockchain Event Monitor
 * 
 * Monitors Stellar blockchain for real-time events:
 * - Payment transactions
 * - Account balance changes
 * - Trust line operations
 * 
 * Sends IPC messages to renderer process for UI updates
 */

const StellarSdk = require('@stellar/stellar-sdk');

class BlockchainMonitor {
  constructor() {
    this.server = new StellarSdk.Horizon.Server('https://horizon-testnet.stellar.org');
    this.activeStreams = new Map();
    this.mainWindow = null;
  }

  /**
   * Set the main window reference for IPC communication
   */
  setMainWindow(window) {
    this.mainWindow = window;
  }

  /**
   * Start monitoring payments for an account
   */
  startPaymentMonitoring(publicKey) {
    // Stop existing stream if any
    this.stopPaymentMonitoring(publicKey);

    console.log(`[BlockchainMonitor] Starting payment monitoring for ${publicKey}`);

    // Create payment stream
    const paymentStream = this.server
      .payments()
      .forAccount(publicKey)
      .cursor('now') // Start from current time
      .stream({
        onmessage: (payment) => {
          this.handlePaymentEvent(payment, publicKey);
        },
        onerror: (error) => {
          console.error('[BlockchainMonitor] Payment stream error:', error);
          this.sendToRenderer('blockchain:error', {
            type: 'payment_stream',
            error: error.message,
            publicKey
          });
        }
      });

    this.activeStreams.set(`payment:${publicKey}`, paymentStream);
  }

  /**
   * Stop monitoring payments for an account
   */
  stopPaymentMonitoring(publicKey) {
    const streamKey = `payment:${publicKey}`;
    const stream = this.activeStreams.get(streamKey);
    
    if (stream) {
      console.log(`[BlockchainMonitor] Stopping payment monitoring for ${publicKey}`);
      stream();
      this.activeStreams.delete(streamKey);
    }
  }

  /**
   * Start monitoring all operations for an account
   */
  startOperationMonitoring(publicKey) {
    // Stop existing stream if any
    this.stopOperationMonitoring(publicKey);

    console.log(`[BlockchainMonitor] Starting operation monitoring for ${publicKey}`);

    // Create operation stream
    const operationStream = this.server
      .operations()
      .forAccount(publicKey)
      .cursor('now')
      .stream({
        onmessage: (operation) => {
          this.handleOperationEvent(operation, publicKey);
        },
        onerror: (error) => {
          console.error('[BlockchainMonitor] Operation stream error:', error);
          this.sendToRenderer('blockchain:error', {
            type: 'operation_stream',
            error: error.message,
            publicKey
          });
        }
      });

    this.activeStreams.set(`operation:${publicKey}`, operationStream);
  }

  /**
   * Stop monitoring operations for an account
   */
  stopOperationMonitoring(publicKey) {
    const streamKey = `operation:${publicKey}`;
    const stream = this.activeStreams.get(streamKey);
    
    if (stream) {
      console.log(`[BlockchainMonitor] Stopping operation monitoring for ${publicKey}`);
      stream();
      this.activeStreams.delete(streamKey);
    }
  }

  /**
   * Handle payment event
   */
  async handlePaymentEvent(payment, accountPublicKey) {
    try {
      console.log('[BlockchainMonitor] Payment event received:', payment.type);

      // Load transaction details to get more information
      const transaction = await payment.transaction();
      
      // Determine if this is incoming or outgoing
      const isIncoming = payment.to === accountPublicKey;
      const isOutgoing = payment.from === accountPublicKey;

      // Parse payment details
      const paymentData = {
        id: payment.id,
        type: payment.type,
        amount: payment.amount,
        asset: payment.asset_type === 'native' ? 'XLM' : payment.asset_code,
        from: payment.from,
        to: payment.to,
        isIncoming,
        isOutgoing,
        transactionHash: payment.transaction_hash,
        createdAt: payment.created_at,
        memo: transaction.memo,
        memoType: transaction.memo_type
      };

      console.log('[BlockchainMonitor] Processed payment:', paymentData);

      // Send to renderer
      this.sendToRenderer('blockchain:payment', paymentData);

      // Trigger balance refresh
      this.sendToRenderer('blockchain:balance-update-needed', {
        publicKey: accountPublicKey
      });

    } catch (error) {
      console.error('[BlockchainMonitor] Error handling payment event:', error);
    }
  }

  /**
   * Handle operation event
   */
  async handleOperationEvent(operation, accountPublicKey) {
    try {
      console.log('[BlockchainMonitor] Operation event received:', operation.type);

      const operationData = {
        id: operation.id,
        type: operation.type,
        transactionHash: operation.transaction_hash,
        createdAt: operation.created_at,
        sourceAccount: operation.source_account
      };

      // Add type-specific data
      switch (operation.type) {
        case 'create_account':
          operationData.startingBalance = operation.starting_balance;
          operationData.account = operation.account;
          break;
        
        case 'payment':
          operationData.amount = operation.amount;
          operationData.asset = operation.asset_type === 'native' ? 'XLM' : operation.asset_code;
          operationData.from = operation.from;
          operationData.to = operation.to;
          break;
        
        case 'change_trust':
          operationData.asset = operation.asset_code;
          operationData.assetIssuer = operation.asset_issuer;
          operationData.limit = operation.limit;
          break;
        
        case 'manage_sell_offer':
        case 'manage_buy_offer':
          operationData.amount = operation.amount;
          operationData.price = operation.price;
          break;
      }

      // Send to renderer
      this.sendToRenderer('blockchain:operation', operationData);

      // Trigger balance refresh for relevant operations
      if (['payment', 'create_account', 'change_trust'].includes(operation.type)) {
        this.sendToRenderer('blockchain:balance-update-needed', {
          publicKey: accountPublicKey
        });
      }

    } catch (error) {
      console.error('[BlockchainMonitor] Error handling operation event:', error);
    }
  }

  /**
   * Send message to renderer process
   */
  sendToRenderer(channel, data) {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send(channel, data);
    } else {
      console.warn('[BlockchainMonitor] Cannot send to renderer - window not available');
    }
  }

  /**
   * Stop all monitoring
   */
  stopAll() {
    console.log('[BlockchainMonitor] Stopping all streams');
    
    for (const [key, stream] of this.activeStreams.entries()) {
      console.log(`[BlockchainMonitor] Stopping stream: ${key}`);
      stream();
    }
    
    this.activeStreams.clear();
  }

  /**
   * Get active streams count
   */
  getActiveStreamsCount() {
    return this.activeStreams.size;
  }

  /**
   * Get list of monitored accounts
   */
  getMonitoredAccounts() {
    const accounts = new Set();
    
    for (const key of this.activeStreams.keys()) {
      const publicKey = key.split(':')[1];
      if (publicKey) {
        accounts.add(publicKey);
      }
    }
    
    return Array.from(accounts);
  }
}

module.exports = new BlockchainMonitor();
