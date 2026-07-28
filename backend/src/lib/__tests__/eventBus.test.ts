import { eventBus, resetEventBus, JobProgressEvent } from '../eventBus';

describe('eventBus', () => {
  afterEach(() => {
    resetEventBus();
  });

  const sampleEvent: JobProgressEvent = {
    jobId: 'job-1',
    userId: 'user-1',
    type: 'ai_generation',
    status: 'processing',
    progress: 50,
  };

  it('delivers job progress events to listeners scoped to the user', () => {
    const listener = jest.fn();
    eventBus.onUserJob('user-1', listener);

    eventBus.emitJobProgress(sampleEvent);

    expect(listener).toHaveBeenCalledWith(sampleEvent);
  });

  it('does not deliver events to a different user', () => {
    const listener = jest.fn();
    eventBus.onUserJob('user-2', listener);

    eventBus.emitJobProgress(sampleEvent);

    expect(listener).not.toHaveBeenCalled();
  });

  it('also emits on the wildcard channel for monitoring', () => {
    const wildcardListener = jest.fn();
    eventBus.on('job:*', wildcardListener);

    eventBus.emitJobProgress(sampleEvent);

    expect(wildcardListener).toHaveBeenCalledWith(sampleEvent);
  });

  it('stops delivering events after offUserJob removes the listener', () => {
    const listener = jest.fn();
    eventBus.onUserJob('user-1', listener);
    eventBus.offUserJob('user-1', listener);

    eventBus.emitJobProgress(sampleEvent);

    expect(listener).not.toHaveBeenCalled();
  });

  it('reset removes all listeners', () => {
    const listener = jest.fn();
    eventBus.onUserJob('user-1', listener);

    resetEventBus();
    eventBus.emitJobProgress(sampleEvent);

    expect(listener).not.toHaveBeenCalled();
  });
});
