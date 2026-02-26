describe('IPC Communication', () => {
  let mockElectronAPI: any;

  beforeEach(() => {
    mockElectronAPI = {
      sendMessage: jest.fn(),
      sendNotification: jest.fn()
    };

    (global as any).window = {
      electronAPI: mockElectronAPI
    };
  });

  afterEach(() => {
    delete (global as any).window;
  });

  describe('Notification IPC', () => {
    test('should send notification through IPC', () => {
      const notificationData = {
        title: 'Test Alert',
        body: 'This is a test notification',
        severity: 'critical' as const
      };

      window.electronAPI?.sendNotification(notificationData);

      expect(mockElectronAPI.sendNotification).toHaveBeenCalledWith(notificationData);
      expect(mockElectronAPI.sendNotification).toHaveBeenCalledTimes(1);
    });

    test('should handle missing electronAPI gracefully', () => {
      delete (global as any).window.electronAPI;

      expect(() => {
        window.electronAPI?.sendNotification({
          title: 'Test',
          body: 'Test',
          severity: 'warning'
        });
      }).not.toThrow();
    });

    test('should send different severity levels', () => {
      const severities: Array<'warning' | 'critical'> = ['warning', 'critical'];

      severities.forEach(severity => {
        window.electronAPI?.sendNotification({
          title: `${severity} Alert`,
          body: `This is a ${severity} notification`,
          severity
        });
      });

      expect(mockElectronAPI.sendNotification).toHaveBeenCalledTimes(2);
    });
  });

  describe('Message IPC', () => {
    test('should send messages through IPC', () => {
      const channel = 'toMain';
      const data = { type: 'test', payload: 'data' };

      window.electronAPI?.sendMessage(channel, data);

      expect(mockElectronAPI.sendMessage).toHaveBeenCalledWith(channel, data);
    });

    test('should handle various data types', () => {
      const testCases = [
        { channel: 'toMain', data: 'string' },
        { channel: 'toMain', data: 123 },
        { channel: 'toMain', data: { complex: 'object' } },
        { channel: 'toMain', data: ['array', 'data'] }
      ];

      testCases.forEach(({ channel, data }) => {
        window.electronAPI?.sendMessage(channel, data);
      });

      expect(mockElectronAPI.sendMessage).toHaveBeenCalledTimes(testCases.length);
    });
  });
});
