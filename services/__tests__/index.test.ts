describe('services/index', () => {
  it('imports without throwing a module-not-found error', () => {
    expect(() => require('../index')).not.toThrow();
  });

  it('exposes the documented service exports', () => {
    const services = require('../index');

    expect(services.TwitterService).toBeDefined();
    expect(services.createTwitterService).toBeDefined();
    expect(services.TweetSchedulerService).toBeDefined();
    expect(services.createTweetSchedulerService).toBeDefined();
    expect(services.AIService).toBeDefined();
    expect(services.createAIService).toBeDefined();
    expect(services.StorageService).toBeDefined();
    expect(services.createStorageService).toBeDefined();
    expect(services.EmailService).toBeDefined();
    expect(services.createEmailService).toBeDefined();
    expect(services.EMAIL_TEMPLATES).toBeDefined();
  });
});
