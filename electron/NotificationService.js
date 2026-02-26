"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationService = void 0;
const electron_1 = require("electron");
const EventMonitorService_1 = require("../src/blockchain/services/EventMonitorService");
class NotificationService {
    constructor() {
        this.preferences = {
            enabled: true,
            sound: true,
            payment: true,
            tokenTransfer: true,
            nftTransfer: true,
            contractExecution: true,
            accountCreated: true,
            trustlineCreated: true,
            throttleMs: 3000,
        };
        this.history = [];
        this.lastNotificationTime = new Map();
        this.maxHistorySize = 100;
    }
    setPreferences(prefs) {
        this.preferences = { ...this.preferences, ...prefs };
    }
    getPreferences() {
        return { ...this.preferences };
    }
    getHistory() {
        return [...this.history];
    }
    clearHistory() {
        this.history = [];
    }
    notify(event) {
        if (!this.preferences.enabled || !this.shouldNotify(event.type))
            return;
        const now = Date.now();
        const lastTime = this.lastNotificationTime.get(event.type) || 0;
        if (now - lastTime < this.preferences.throttleMs)
            return;
        const { title, body } = this.getNotificationContent(event);
        const notification = new electron_1.Notification({
            title,
            body,
            silent: !this.preferences.sound,
            urgency: this.getUrgency(event.type),
        });
        notification.show();
        this.addToHistory({
            id: event.id,
            title,
            body,
            timestamp: now,
            eventType: event.type,
        });
        this.lastNotificationTime.set(event.type, now);
    }
    shouldNotify(type) {
        switch (type) {
            case EventMonitorService_1.BlockchainEventType.PAYMENT:
                return this.preferences.payment;
            case EventMonitorService_1.BlockchainEventType.TOKEN_TRANSFER:
                return this.preferences.tokenTransfer;
            case EventMonitorService_1.BlockchainEventType.NFT_TRANSFER:
                return this.preferences.nftTransfer;
            case EventMonitorService_1.BlockchainEventType.CONTRACT_EXECUTION:
                return this.preferences.contractExecution;
            case EventMonitorService_1.BlockchainEventType.ACCOUNT_CREATED:
                return this.preferences.accountCreated;
            case EventMonitorService_1.BlockchainEventType.TRUSTLINE_CREATED:
                return this.preferences.trustlineCreated;
            default:
                return false;
        }
    }
    getNotificationContent(event) {
        switch (event.type) {
            case EventMonitorService_1.BlockchainEventType.PAYMENT:
                return {
                    title: '💰 Payment Received',
                    body: `${event.data.amount} ${event.data.asset} from ${event.data.from.slice(0, 8)}...`,
                };
            case EventMonitorService_1.BlockchainEventType.TOKEN_TRANSFER:
                return {
                    title: '🪙 Token Transfer',
                    body: `Token transfer detected`,
                };
            case EventMonitorService_1.BlockchainEventType.NFT_TRANSFER:
                return {
                    title: '🖼️ NFT Transfer',
                    body: `NFT transfer detected`,
                };
            case EventMonitorService_1.BlockchainEventType.CONTRACT_EXECUTION:
                return {
                    title: '⚙️ Contract Executed',
                    body: `Smart contract execution completed`,
                };
            case EventMonitorService_1.BlockchainEventType.ACCOUNT_CREATED:
                return {
                    title: '✨ Account Created',
                    body: `New account: ${event.data.account.slice(0, 8)}...`,
                };
            case EventMonitorService_1.BlockchainEventType.TRUSTLINE_CREATED:
                return {
                    title: '🔗 Trustline Created',
                    body: `Trustline for ${event.data.asset}`,
                };
            default:
                return {
                    title: '🔔 Blockchain Event',
                    body: `Event type: ${event.type}`,
                };
        }
    }
    getUrgency(type) {
        switch (type) {
            case EventMonitorService_1.BlockchainEventType.PAYMENT:
            case EventMonitorService_1.BlockchainEventType.NFT_TRANSFER:
                return 'normal';
            case EventMonitorService_1.BlockchainEventType.CONTRACT_EXECUTION:
                return 'critical';
            default:
                return 'low';
        }
    }
    addToHistory(item) {
        this.history.unshift(item);
        if (this.history.length > this.maxHistorySize) {
            this.history = this.history.slice(0, this.maxHistorySize);
        }
    }
}
exports.NotificationService = NotificationService;
