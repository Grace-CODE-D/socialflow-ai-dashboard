"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventMonitorService = exports.BlockchainEventType = void 0;
const stellar_sdk_1 = require("@stellar/stellar-sdk");
var BlockchainEventType;
(function (BlockchainEventType) {
    BlockchainEventType["PAYMENT"] = "payment";
    BlockchainEventType["TOKEN_TRANSFER"] = "token_transfer";
    BlockchainEventType["NFT_TRANSFER"] = "nft_transfer";
    BlockchainEventType["CONTRACT_EXECUTION"] = "contract_execution";
    BlockchainEventType["ACCOUNT_CREATED"] = "account_created";
    BlockchainEventType["TRUSTLINE_CREATED"] = "trustline_created";
})(BlockchainEventType || (exports.BlockchainEventType = BlockchainEventType = {}));
class EventMonitorService {
    constructor(horizonUrl = 'https://horizon-testnet.stellar.org') {
        this.listeners = new Map();
        this.closeHandlers = [];
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 2000;
        this.server = new stellar_sdk_1.Horizon.Server(horizonUrl);
    }
    async startMonitoring(accountId) {
        this.monitorPayments(accountId);
        this.monitorOperations(accountId);
    }
    monitorPayments(accountId) {
        const closeHandler = this.server
            .payments()
            .forAccount(accountId)
            .cursor('now')
            .stream({
            onmessage: (payment) => this.handlePayment(payment, accountId),
            onerror: (error) => this.handleError(error, accountId),
        });
        this.closeHandlers.push(closeHandler);
    }
    monitorOperations(accountId) {
        const closeHandler = this.server
            .operations()
            .forAccount(accountId)
            .cursor('now')
            .stream({
            onmessage: (operation) => this.handleOperation(operation, accountId),
            onerror: (error) => this.handleError(error, accountId),
        });
        this.closeHandlers.push(closeHandler);
    }
    handlePayment(payment, accountId) {
        const event = {
            id: payment.id,
            type: BlockchainEventType.PAYMENT,
            timestamp: payment.created_at,
            account: accountId,
            data: {
                from: payment.from,
                to: payment.to,
                amount: payment.amount,
                asset: payment.asset_type === 'native' ? 'XLM' : payment.asset_code,
            },
        };
        this.emit(BlockchainEventType.PAYMENT, event);
    }
    handleOperation(operation, accountId) {
        const eventType = this.detectEventType(operation);
        if (!eventType)
            return;
        const event = {
            id: operation.id,
            type: eventType,
            timestamp: operation.created_at,
            account: accountId,
            data: this.extractOperationData(operation),
        };
        this.emit(eventType, event);
    }
    detectEventType(operation) {
        switch (operation.type) {
            case 'payment':
                return BlockchainEventType.PAYMENT;
            case 'path_payment_strict_receive':
            case 'path_payment_strict_send':
                return BlockchainEventType.TOKEN_TRANSFER;
            case 'create_account':
                return BlockchainEventType.ACCOUNT_CREATED;
            case 'change_trust':
                return BlockchainEventType.TRUSTLINE_CREATED;
            case 'invoke_host_function':
                return BlockchainEventType.CONTRACT_EXECUTION;
            case 'manage_buy_offer':
            case 'manage_sell_offer':
                const op = operation;
                if (op.buying_asset_type === 'credit_alphanum4' || op.selling_asset_type === 'credit_alphanum4') {
                    return BlockchainEventType.NFT_TRANSFER;
                }
                return null;
            default:
                return null;
        }
    }
    extractOperationData(operation) {
        const baseData = {
            type: operation.type,
            transactionHash: operation.transaction_hash,
        };
        switch (operation.type) {
            case 'payment':
                const payment = operation;
                return {
                    ...baseData,
                    from: payment.from,
                    to: payment.to,
                    amount: payment.amount,
                    asset: payment.asset_type === 'native' ? 'XLM' : payment.asset_code,
                };
            case 'create_account':
                const createAccount = operation;
                return {
                    ...baseData,
                    account: createAccount.account,
                    startingBalance: createAccount.starting_balance,
                };
            case 'change_trust':
                const changeTrust = operation;
                return {
                    ...baseData,
                    asset: changeTrust.asset_code,
                    limit: changeTrust.limit,
                };
            case 'invoke_host_function':
                return {
                    ...baseData,
                    function: 'contract_execution',
                };
            default:
                return baseData;
        }
    }
    handleError(error, accountId) {
        console.error(`Event stream error for ${accountId}:`, error);
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            setTimeout(() => {
                console.log(`Reconnecting... Attempt ${this.reconnectAttempts}`);
                this.startMonitoring(accountId);
            }, this.reconnectDelay * this.reconnectAttempts);
        }
    }
    on(eventType, callback) {
        if (!this.listeners.has(eventType)) {
            this.listeners.set(eventType, []);
        }
        this.listeners.get(eventType).push(callback);
    }
    off(eventType, callback) {
        const callbacks = this.listeners.get(eventType);
        if (callbacks) {
            const index = callbacks.indexOf(callback);
            if (index > -1) {
                callbacks.splice(index, 1);
            }
        }
    }
    emit(eventType, event) {
        const callbacks = this.listeners.get(eventType);
        if (callbacks) {
            callbacks.forEach((callback) => callback(event));
        }
    }
    stopMonitoring() {
        this.closeHandlers.forEach((close) => close());
        this.closeHandlers = [];
        this.listeners.clear();
        this.reconnectAttempts = 0;
    }
}
exports.EventMonitorService = EventMonitorService;
