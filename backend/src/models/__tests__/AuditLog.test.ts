import { AuditLogStore } from '../AuditLog';

describe('AuditLogStore', () => {
  it('append adds an entry with a generated id and createdAt timestamp', () => {
    const log = AuditLogStore.append({
      actorId: 'actor-1',
      action: 'auth:login',
    });

    expect(log.id).toBeDefined();
    expect(log.actorId).toBe('actor-1');
    expect(log.action).toBe('auth:login');
    expect(log.createdAt).toBeInstanceOf(Date);
  });

  it('append assigns increasing ids across calls', () => {
    const first = AuditLogStore.append({ actorId: 'actor-2', action: 'post:create' });
    const second = AuditLogStore.append({ actorId: 'actor-2', action: 'post:update' });

    expect(Number(second.id)).toBeGreaterThan(Number(first.id));
  });

  it('forActor returns only entries for the given actor, most recent first', () => {
    AuditLogStore.append({ actorId: 'actor-3', action: 'post:create' });
    AuditLogStore.append({ actorId: 'actor-3', action: 'post:update' });
    AuditLogStore.append({ actorId: 'other-actor', action: 'post:delete' });

    const entries = AuditLogStore.forActor('actor-3');

    expect(entries.every((e) => e.actorId === 'actor-3')).toBe(true);
    expect(entries[0].action).toBe('post:update');
  });

  it('forResource filters by resourceType and resourceId', () => {
    AuditLogStore.append({
      actorId: 'actor-4',
      action: 'post:update',
      resourceType: 'post',
      resourceId: 'post-123',
    });
    AuditLogStore.append({
      actorId: 'actor-4',
      action: 'post:update',
      resourceType: 'post',
      resourceId: 'post-999',
    });

    const entries = AuditLogStore.forResource('post', 'post-123');

    expect(entries).toHaveLength(1);
    expect(entries[0].resourceId).toBe('post-123');
  });

  it('recent respects the limit parameter', () => {
    for (let i = 0; i < 5; i++) {
      AuditLogStore.append({ actorId: 'actor-5', action: 'ai:generate' });
    }

    const entries = AuditLogStore.recent(2);

    expect(entries).toHaveLength(2);
  });
});
