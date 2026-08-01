# Fix: org admin could grant/remove the owner role

## Problem

`backend/src/controllers/organization.ts`:

- `addMember()` only checked that the caller was `owner` **or** `admin`
  before creating a membership, but took the new member's `role` directly
  from the request body with no cap relative to the caller's own role. An
  admin could call the endpoint with `role: 'owner'` and grant themselves
  (via an alt account) or an accomplice owner-level access.
- `removeMember()` applied the same `owner`/`admin` check with no
  protection for the org's owner(s), so any admin could delete the sole
  owner and leave the organization without one.

## Fix

- `addMember()` now rejects (`403`) any request where `role === 'owner'`
  unless the caller's own role is already `owner`.
- `removeMember()` now looks up the target membership before deleting:
  - If the target is an `owner`, only another `owner` may remove them
    (`403 Only an owner can remove an owner` otherwise).
  - If the target is the organization's last remaining `owner`, the
    removal is rejected (`403 Cannot remove the last owner of an
    organization`) regardless of who's asking.

## Tests

Added to `backend/src/__tests__/organizationController.test.ts`:

- admin-role caller cannot add a member with `role=owner` (403, no create)
- owner-role caller can still add a member with `role=owner`
- sole owner of an org cannot be removed (403, no delete)
- an owner can be removed once another owner remains
- an admin-role caller cannot remove an owner (403, no delete)

Run: `npm test -- organizationController` (from `backend/`).
