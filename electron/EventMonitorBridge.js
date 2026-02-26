"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventMonitorBridge = void 0;
const electron_1 = require("electron");
const EventMonitorService_1 = require("../src/blockchain/services/EventMonitorService");
const NotificationService_1 = require("./NotificationService");
class EventMonitorBridge {
    constructor(horizonUrl) {
        this.mainWindow = null;
        this.eventBatch = [];
        this.batchInterval = null;
        this.batchSize = 10;
        this.batchTimeout = 1000;
        this.eventMonitor = new EventMonitorService_1.EventMonitorService(horizonUrl);
        this.notificationService = new NotificationService_1.NotificationService();
        this.setupIpcHandlers();
    }
    setMainWindow(window) {
        this.mainWindow = window;
    }
    setupIpcHandlers() {
        electron_1.ipcMain.handle('blockchain:start-monitoring', async (_, accountId) => {
            try {
                this.setupEventListeners();
                await this.eventMonitor.startMonitoring(accountId);
                this.startBatching();
                return { success: true };
            }
            catch (error) {
                return { success: false, error: error.message };
            }
        });
        electron_1.ipcMain.handle('blockchain:stop-monitoring', () => {
            try {
                this.eventMonitor.stopMonitoring();
                this.stopBatching();
                return { success: true };
            }
            catch (error) {
                return { success: false, error: error.message };
            }
        });
        electron_1.ipcMain.handle('notifications:get-preferences', () => {
            return this.notificationService.getPreferences();
        });
        electron_1.ipcMain.handle('notifications:set-preferences', (_, prefs) => {
            this.notificationService.setPreferences(prefs);
            return { success: true };
        });
        electron_1.ipcMain.handle('notifications:get-history', () => {
            return this.notificationService.getHistory();
        });
        electron_1.ipcMain.handle('notifications:clear-history', () => {
            this.notificationService.clearHistory();
            return { success: true };
        });
    }
    setupEventListeners() {
        Object.values(EventMonitorService_1.BlockchainEventType).forEach((eventType) => {
            this.eventMonitor.on(eventType, (event) => {
                this.addEventToBatch(event);
            });
        });
    }
    addEventToBatch(event) {
        this.eventBatch.push(event);
        this.notificationService.notify(event);
        if (this.eventBatch.length >= this.batchSize) {
            this.flushBatch();
        }
    }
    startBatching() {
        if (this.batchInterval)
            return;
        this.batchInterval = setInterval(() => {
            if (this.eventBatch.length > 0) {
                this.flushBatch();
            }
        }, this.batchTimeout);
    }
    stopBatching() {
        if (this.batchInterval) {
            clearInterval(this.batchInterval);
            this.batchInterval = null;
        }
        this.flushBatch();
    }
    flushBatch() {
        if (!this.mainWindow || this.eventBatch.length === 0)
            return;
        try {
            this.mainWindow.webContents.send('blockchain:events', this.eventBatch);
            this.eventBatch = [];
        }
        catch (error) {
            console.error('Failed to send events to renderer:', error);
        }
    }
    cleanup() {
        this.eventMonitor.stopMonitoring();
        this.stopBatching();
        electron_1.ipcMain.removeHandler('blockchain:start-monitoring');
        electron_1.ipcMain.removeHandler('blockchain:stop-monitoring');
        electron_1.ipcMain.removeHandler('notifications:get-preferences');
        electron_1.ipcMain.removeHandler('notifications:set-preferences');
        electron_1.ipcMain.removeHandler('notifications:get-history');
        electron_1.ipcMain.removeHandler('notifications:clear-history');
    }
}
exports.EventMonitorBridge = EventMonitorBridge;
