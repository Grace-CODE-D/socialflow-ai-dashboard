import { RoleStore, ROLES } from '../Role';

describe('RoleStore', () => {
  it('assign sets the role for a user', () => {
    RoleStore.assign('user-1', 'editor');

    expect(RoleStore.getRoleName('user-1')).toBe('editor');
  });

  it('getRole returns the full role definition for an assigned user', () => {
    RoleStore.assign('user-2', 'admin');

    expect(RoleStore.getRole('user-2')).toEqual(ROLES.admin);
  });

  it('getRole returns undefined for a user with no assignment', () => {
    expect(RoleStore.getRole('never-assigned-user')).toBeUndefined();
  });

  it('hasPermission returns true when the assigned role includes the permission', () => {
    RoleStore.assign('user-3', 'editor');

    expect(RoleStore.hasPermission('user-3', 'posts:create')).toBe(true);
  });

  it('hasPermission returns false when the assigned role lacks the permission', () => {
    RoleStore.assign('user-4', 'viewer');

    expect(RoleStore.hasPermission('user-4', 'roles:manage')).toBe(false);
  });

  it('hasPermission returns false for a user with no role assigned', () => {
    expect(RoleStore.hasPermission('unknown-user', 'posts:read')).toBe(false);
  });

  it('re-assigning a user updates their role', () => {
    RoleStore.assign('user-5', 'viewer');
    RoleStore.assign('user-5', 'admin');

    expect(RoleStore.getRoleName('user-5')).toBe('admin');
  });

  it('persists role assignments across independent references to RoleStore', () => {
    // Regression test: role assignments must be visible through any reference
    // to RoleStore, not just the instance that performed the assignment —
    // guards against a per-instance (rather than module-level) store.
    RoleStore.assign('user-6', 'editor');

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { RoleStore: OtherReference } = require('../Role');

    expect(OtherReference.getRoleName('user-6')).toBe('editor');
    expect(OtherReference.hasPermission('user-6', 'posts:update')).toBe(true);
  });

  it('listAll reflects all assigned users', () => {
    RoleStore.assign('user-7', 'viewer');

    const all = RoleStore.listAll();

    expect(all).toEqual(
      expect.arrayContaining([{ userId: 'user-7', role: 'viewer' }]),
    );
  });
});
