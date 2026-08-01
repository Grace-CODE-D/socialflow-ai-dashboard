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
    expect(services.generateCaption).toBeDefined();
    expect(services.generateReply).toBeDefined();
    expect(services.usageLogger).toBeDefined();
    expect(services.DEFAULT_PROMPT_TEMPLATES).toBeDefined();
    expect(services.StorageService).toBeDefined();
    expect(services.createStorageService).toBeDefined();
    expect(services.uploadImage).toBeDefined();
    expect(services.EmailService).toBeDefined();
    expect(services.createEmailService).toBeDefined();
    expect(services.EMAIL_TEMPLATES).toBeDefined();
  });

  it('asserts every named export on the module is defined, not undefined', () => {
    const services = require('../index');

    const exportNames = Object.keys(services);
    expect(exportNames.length).toBeGreaterThan(0);

    for (const name of exportNames) {
      expect(services[name]).not.toBeUndefined();
    }
  });
});
