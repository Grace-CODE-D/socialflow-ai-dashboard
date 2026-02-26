# Security Hardening - Test Plan

## Test Suite 1: Session Management

### Test 1.1: Session Start
**Objective**: Verify session starts correctly

**Steps:**
1. Call `sessionService.startSession()`
2. Check session state

**Expected:**
- [ ] `isActive` is true
- [ ] `lastActivity` is set to current time
- [ ] `sessionStarted` is set to current time
- [ ] Activity listeners are attached
- [ ] Timeout timers are set

**Status**: ⬜ Not Tested | ✅ Passed | ❌ Failed

---

### Test 1.2: Activity Tracking
**Objective**: Verify user activity resets timeout

**Steps:**
1. Start session
2. Wait 5 seconds
3. Perform mouse click
4. Check `lastActivity` timestamp

**Expected:**
- [ ] `lastActivity` updates on activity
- [ ] Timeout timer resets
- [ ] Warning timer resets

**Status**: ⬜ Not Tested | ✅ Passed | ❌ Failed

---

### Test 1.3: Timeout Warning
**Objective**: Verify warning appears before timeout

**Steps:**
1. Start session
2. Wait 28 minutes (or adjust timeout for testing)
3. Observe warning callback

**Expected:**
- [ ] Warning callback fires 2 minutes before timeout
- [ ] Remaining time is accurate
- [ ] Warning only fires once

**Status**: ⬜ Not Tested | ✅ Passed | ❌ Failed

---

### Test 1.4: Session Timeout
**Objective**: Verify session expires after inactivity

**Steps:**
1. Start session
2. Do not perform any activity
3. Wait 30 minutes (or adjusted timeout)
4. Observe timeout callback

**Expected:**
- [ ] Timeout callback fires after 30 minutes
- [ ] Session state becomes inactive
- [ ] Activity listeners are removed
- [ ] Timers are cleared

**Status**: ⬜ Not Tested | ✅ Passed | ❌ Failed

---

### Test 1.5: Session Refresh
**Objective**: Verify manual session refresh works

**Steps:**
1. Start session
2. Wait 20 minutes
3. Call `refreshSession()`
4. Check remaining time

**Expected:**
- [ ] `lastActivity` updates to current time
- [ ] Timeout timer resets to 30 minutes
- [ ] Warning flag resets
- [ ] Refresh callback fires

**Status**: ⬜ Not Tested | ✅ Passed | ❌ Failed

---

### Test 1.6: Session Persistence
**Objective**: Verify session persists across page reloads

**Steps:**
1. Start session
2. Perform some activity
3. Reload page
4. Call `restoreSession()`

**Expected:**
- [ ] Session restores if within timeout
- [ ] `lastActivity` is restored
- [ ] `sessionStarted` is restored
- [ ] Session does not restore if expired

**Status**: ⬜ Not Tested | ✅ Passed | ❌ Failed

---

### Test 1.7: Session End
**Objective**: Verify session ends cleanly

**Steps:**
1. Start session
2. Call `endSession()`
3. Check session state

**Expected:**
- [ ] `isActive` becomes false
- [ ] Activity listeners are removed
- [ ] Timers are cleared
- [ ] localStorage is cleared

**Status**: ⬜ Not Tested | ✅ Passed | ❌ Failed

---

## Test Suite 2: Re-Authentication

### Test 2.1: Large Transaction Auth
**Objective**: Verify large transactions require auth

**Steps:**
1. Check if 1500 XLM transaction requires auth
2. Check if 500 XLM transaction requires auth

**Expected:**
- [ ] 1500 XLM requires auth (>= 1000 threshold)
- [ ] 500 XLM does not require auth (< 1000 threshold)

**Status**: ⬜ Not Tested | ✅ Passed | ❌ Failed

---

### Test 2.2: Wallet Signature Auth
**Objective**: Verify wallet signature authentication

**Steps:**
1. Call `authenticateWithWallet()` with mock sign function
2. Provide valid signature
3. Check auth state

**Expected:**
- [ ] Challenge message is created
- [ ] Sign function is called with challenge
- [ ] Auth succeeds with valid signature
- [ ] `isAuthenticated` becomes true
- [ ] Attempt is recorded

**Status**: ⬜ Not Tested | ✅ Passed | ❌ Failed

---

### Test 2.3: Failed Authentication
**Objective**: Verify failed auth is handled correctly

**Steps:**
1. Call `authenticateWithWallet()` with failing sign function
2. Check auth state and attempts

**Expected:**
- [ ] Auth fails
- [ ] Error message is returned
- [ ] Failed attempt is recorded
- [ ] `isAuthenticated` remains false

**Status**: ⬜ Not Tested | ✅ Passed | ❌ Failed

---

### Test 2.4: Authentication Cooldown
**Objective**: Verify cooldown after max attempts

**Steps:**
1. Fail authentication 3 times
2. Try to authenticate again
3. Check cooldown state

**Expected:**
- [ ] Cooldown activates after 3 failures
- [ ] `isInCooldown()` returns true
- [ ] Auth attempts are blocked
- [ ] Cooldown duration is 5 minutes
- [ ] Error message indicates cooldown

**Status**: ⬜ Not Tested | ✅ Passed | ❌ Failed

---

### Test 2.5: Biometric Authentication
**Objective**: Verify biometric auth works (if available)

**Steps:**
1. Enable biometrics
2. Call `authenticateWithBiometrics()`
3. Complete biometric verification

**Expected:**
- [ ] Biometric availability is checked
- [ ] WebAuthn API is used
- [ ] Auth succeeds with valid biometric
- [ ] `isAuthenticated` becomes true

**Status**: ⬜ Not Tested | ✅ Passed | ❌ Failed

---

### Test 2.6: Auth History
**Objective**: Verify authentication history is tracked

**Steps:**
1. Perform multiple auth attempts (success and failure)
2. Call `getAuthHistory()`

**Expected:**
- [ ] All attempts are recorded
- [ ] Timestamp is accurate
- [ ] Success/failure is tracked
- [ ] Operation type is recorded
- [ ] History is limited to last 10 attempts

**Status**: ⬜ Not Tested | ✅ Passed | ❌ Failed

---

## Test Suite 3: Data Encryption

### Test 3.1: Encryption Initialization
**Objective**: Verify encryption initializes correctly

**Steps:**
1. Call `initialize()` with wallet signature
2. Check encryption state

**Expected:**
- [ ] Key material is imported
- [ ] Salt is generated or retrieved
- [ ] Encryption key is derived
- [ ] `isReady()` returns true

**Status**: ⬜ Not Tested | ✅ Passed | ❌ Failed

---

### Test 3.2: Data Encryption
**Objective**: Verify data encrypts correctly

**Steps:**
1. Initialize encryption
2. Encrypt test string
3. Verify encrypted output

**Expected:**
- [ ] Encrypted data is base64 string
- [ ] Encrypted data differs from original
- [ ] IV is included in output
- [ ] Encryption is deterministic with same IV

**Status**: ⬜ Not Tested | ✅ Passed | ❌ Failed

---

### Test 3.3: Data Decryption
**Objective**: Verify data decrypts correctly

**Steps:**
1. Initialize encryption
2. Encrypt test string
3. Decrypt encrypted string
4. Compare with original

**Expected:**
- [ ] Decrypted data matches original
- [ ] Decryption handles IV correctly
- [ ] Invalid data throws error

**Status**: ⬜ Not Tested | ✅ Passed | ❌ Failed

---

### Test 3.4: Secure localStorage
**Objective**: Verify secure item storage

**Steps:**
1. Initialize encryption
2. Store secure item
3. Retrieve secure item
4. Check localStorage

**Expected:**
- [ ] Item is encrypted in localStorage
- [ ] Retrieved item matches original
- [ ] Key is prefixed with "secure_"
- [ ] JSON serialization works

**Status**: ⬜ Not Tested | ✅ Passed | ❌ Failed

---

### Test 3.5: IPC Message Encryption
**Objective**: Verify IPC messages encrypt/decrypt

**Steps:**
1. Initialize encryption
2. Encrypt IPC message object
3. Decrypt IPC message
4. Compare with original

**Expected:**
- [ ] Message object is encrypted
- [ ] Decrypted message matches original
- [ ] JSON serialization works
- [ ] Complex objects are handled

**Status**: ⬜ Not Tested | ✅ Passed | ❌ Failed

---

### Test 3.6: IndexedDB Encryption
**Objective**: Verify IndexedDB field encryption

**Steps:**
1. Initialize encryption
2. Encrypt object with sensitive fields
3. Decrypt object
4. Compare fields

**Expected:**
- [ ] Sensitive fields are encrypted
- [ ] Non-sensitive fields are unchanged
- [ ] Decrypted fields match original
- [ ] Multiple fields are handled

**Status**: ⬜ Not Tested | ✅ Passed | ❌ Failed

---

### Test 3.7: Key Derivation
**Objective**: Verify key derivation is consistent

**Steps:**
1. Initialize encryption with signature A
2. Encrypt data
3. Clear encryption
4. Initialize with same signature A
5. Decrypt data

**Expected:**
- [ ] Same signature produces same key
- [ ] Data decrypts successfully
- [ ] Salt is reused from localStorage

**Status**: ⬜ Not Tested | ✅ Passed | ❌ Failed

---

### Test 3.8: Hash Function
**Objective**: Verify one-way hashing

**Steps:**
1. Hash test string
2. Hash same string again
3. Try to reverse hash

**Expected:**
- [ ] Hash is consistent for same input
- [ ] Hash is base64 string
- [ ] Hash cannot be reversed
- [ ] Different inputs produce different hashes

**Status**: ⬜ Not Tested | ✅ Passed | ❌ Failed

---

## Test Suite 4: React Components

### Test 4.1: SessionTimeoutWarning Component
**Objective**: Verify timeout warning displays correctly

**Steps:**
1. Trigger session warning
2. Observe modal

**Expected:**
- [ ] Modal appears
- [ ] Countdown displays correctly
- [ ] Progress bar animates
- [ ] Continue button refreshes session
- [ ] Logout button ends session

**Status**: ⬜ Not Tested | ✅ Passed | ❌ Failed

---

### Test 4.2: AuthenticationModal Component
**Objective**: Verify auth modal works correctly

**Steps:**
1. Open auth modal for large transaction
2. Attempt wallet auth
3. Observe result

**Expected:**
- [ ] Modal displays operation details
- [ ] Wallet auth button works
- [ ] Biometric option shows if enabled
- [ ] Error messages display
- [ ] Cooldown warning shows if applicable

**Status**: ⬜ Not Tested | ✅ Passed | ❌ Failed

---

### Test 4.3: SecuritySettings Component
**Objective**: Verify security settings panel

**Steps:**
1. Open security settings
2. Toggle biometrics
3. View auth history

**Expected:**
- [ ] Session status displays
- [ ] Biometric toggle works
- [ ] Encryption status shows
- [ ] Auth history displays
- [ ] Clear history works

**Status**: ⬜ Not Tested | ✅ Passed | ❌ Failed

---

## Test Suite 5: React Hook

### Test 5.1: useSecurity Hook
**Objective**: Verify hook provides all functionality

**Steps:**
1. Use hook in component
2. Access all methods and state
3. Verify reactivity

**Expected:**
- [ ] All methods are available
- [ ] State updates reactively
- [ ] Callbacks work correctly
- [ ] No memory leaks

**Status**: ⬜ Not Tested | ✅ Passed | ❌ Failed

---

## Test Suite 6: Integration Tests

### Test 6.1: Full Authentication Flow
**Objective**: Verify complete auth flow

**Steps:**
1. Start session
2. Attempt large transaction
3. Authenticate with wallet
4. Complete transaction
5. Verify auth expires after 5 minutes

**Expected:**
- [ ] Session is active
- [ ] Auth is required
- [ ] Auth succeeds
- [ ] Transaction proceeds
- [ ] Auth expires correctly

**Status**: ⬜ Not Tested | ✅ Passed | ❌ Failed

---

### Test 6.2: Session Timeout with Auth
**Objective**: Verify session timeout clears auth

**Steps:**
1. Start session
2. Authenticate
3. Wait for session timeout
4. Check auth state

**Expected:**
- [ ] Session expires
- [ ] Auth is cleared
- [ ] User is logged out

**Status**: ⬜ Not Tested | ✅ Passed | ❌ Failed

---

### Test 6.3: Encryption with Session
**Objective**: Verify encryption persists across session

**Steps:**
1. Start session
2. Initialize encryption
3. Store encrypted data
4. Refresh session
5. Retrieve encrypted data

**Expected:**
- [ ] Encryption remains initialized
- [ ] Data retrieves correctly
- [ ] Session refresh doesn't affect encryption

**Status**: ⬜ Not Tested | ✅ Passed | ❌ Failed

---

## Summary

**Total Tests**: 28
**Passed**: ___
**Failed**: ___
**Not Tested**: ___

**Tester**: _______________
**Date**: _______________
**Environment**: _______________
**Browser**: _______________

## Critical Issues

_List any critical security issues found_

## Recommendations

_Security improvement recommendations_
