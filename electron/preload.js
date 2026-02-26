const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  sendMessage: (channel, data) => {
    let validChannels = ["toMain"];
    if (validChannels.includes(channel)) {
      ipcRenderer.send(channel, data);
    }
  },

  // Blockchain monitoring API
  blockchain: {
    // Start monitoring an account
    startMonitoring: (publicKey) => {
      ipcRenderer.send('blockchain:start-monitoring', { publicKey });
    },

    // Stop monitoring an account
    stopMonitoring: (publicKey) => {
      ipcRenderer.send('blockchain:stop-monitoring', { publicKey });
    },

    // Get list of monitored accounts
    getMonitoredAccounts: () => {
      return ipcRenderer.invoke('blockchain:get-monitored-accounts');
    },

    // Get active streams count
    getActiveStreams: () => {
      return ipcRenderer.invoke('blockchain:get-active-streams');
    },

    // Listen for payment events
    onPayment: (callback) => {
      const listener = (event, data) => callback(data);
      ipcRenderer.on('blockchain:payment', listener);
      
      // Return cleanup function
      return () => {
        ipcRenderer.removeListener('blockchain:payment', listener);
      };
    },

    // Listen for operation events
    onOperation: (callback) => {
      const listener = (event, data) => callback(data);
      ipcRenderer.on('blockchain:operation', listener);
      
      return () => {
        ipcRenderer.removeListener('blockchain:operation', listener);
      };
    },

    // Listen for balance update notifications
    onBalanceUpdateNeeded: (callback) => {
      const listener = (event, data) => callback(data);
      ipcRenderer.on('blockchain:balance-update-needed', listener);
      
      return () => {
        ipcRenderer.removeListener('blockchain:balance-update-needed', listener);
      };
    },

    // Listen for errors
    onError: (callback) => {
      const listener = (event, data) => callback(data);
      ipcRenderer.on('blockchain:error', listener);
      
      return () => {
        ipcRenderer.removeListener('blockchain:error', listener);
      };
    }
  }
});