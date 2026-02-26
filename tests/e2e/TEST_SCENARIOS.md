## E2E Test Scenarios Documentation

## Overview
This document provides detailed descriptions of all E2E test scenarios for the SocialFlow campaign system.

---

## Test Scenario Categories

### 1. Campaign Creation Tests

#### Scenario 1.1: Create Campaign with Valid Data
**Requirement**: 13.1
**Description**: Verify that a campaign can be created with all required fields.

**Test Steps**:
1. Prepare campaign data with name, budget, reward amount
2. Call createCampaign API
3. Verify campaign is created with correct data
4. Verify campaign has unique ID
5. Verify campaign status is 'draft'
6. Verify participants array is empty
7. Verify totalDistributed is 0

**Expected Result**: Campaign created successfully with all fields populated correctly.

**Assertions**:
- `campaign.id` is defined
- `campaign.name` matches input
- `campaign.budget` matches input
- `campaign.status === 'draft'`
- `campaign.participants.length === 0`

---

#### Scenario 1.2: Validate Required Fields
**Requirement**: 13.1
**Description**: Verify that campaign creation fails without required fields.

**Test Steps**:
1. Attempt to create campaign without name
2. Verify error is thrown
3. Attempt to create campaign without budget
4. Verify error is thrown
5. Attempt to create campaign without reward amount
6. Verify error is thrown

**Expected Result**: Appropriate error messages for each missing field.

**Assertions**:
- Error message: "Campaign name is required"
- Error message: "Valid budget is required"
- Error message: "Valid reward amount is required"

---

#### Scenario 1.3: Budget Validation
**Requirement**: 13.1
**Description**: Verify that budget must be at least equal to reward amount.

**Test Steps**:
1. Attempt to create campaign with budget < reward amount
2. Verify error is thrown with appropriate message

**Expected Result**: Campaign creation fails with budget validation error.

**Assertions**:
- Error message: "Budget must be at least equal to reward amount"

---

### 2. Campaign Management Tests

#### Scenario 2.1: Retrieve Campaign by ID
**Requirement**: 13.2
**Description**: Verify that a campaign can be retrieved by its ID.

**Test Steps**:
1. Create a campaign
2. Retrieve campaign using its ID
3. Verify retrieved data matches created campaign

**Expected Result**: Campaign data retrieved successfully.

**Assertions**:
- Retrieved campaign ID matches
- All fields match original campaign

---

#### Scenario 2.2: Update Campaign Details
**Requirement**: 13.3
**Description**: Verify that campaign details can be updated.

**Test Steps**:
1. Create a campaign
2. Update campaign name and description
3. Retrieve updated campaign
4. Verify changes are persisted

**Expected Result**: Campaign updated successfully with new values.

**Assertions**:
- `campaign.name` updated
- `campaign.description` updated
- `campaign.updatedAt` is set

---

#### Scenario 2.3: Start Campaign
**Requirement**: 13.4
**Description**: Verify that a draft campaign can be started.

**Test Steps**:
1. Create a draft campaign
2. Call startCampaign API
3. Verify campaign status changes to 'active'

**Expected Result**: Campaign status changes to 'active'.

**Assertions**:
- `campaign.status === 'active'`
- `campaign.updatedAt` is set

---

#### Scenario 2.4: Pause Active Campaign
**Requirement**: 13.4
**Description**: Verify that an active campaign can be paused.

**Test Steps**:
1. Create and start a campaign
2. Call pauseCampaign API
3. Verify campaign status changes to 'paused'

**Expected Result**: Campaign status changes to 'paused'.

**Assertions**:
- `campaign.status === 'paused'`
- `campaign.updatedAt` is updated

---

#### Scenario 2.5: Complete Campaign
**Requirement**: 13.4
**Description**: Verify that a campaign can be marked as completed.

**Test Steps**:
1. Create and start a campaign
2. Call completeCampaign API
3. Verify campaign status changes to 'completed'

**Expected Result**: Campaign status changes to 'completed'.

**Assertions**:
- `campaign.status === 'completed'`
- `campaign.updatedAt` is updated

---

#### Scenario 2.6: Delete Draft Campaign
**Requirement**: 13.4
**Description**: Verify that a draft campaign can be deleted.

**Test Steps**:
1. Create a draft campaign
2. Call deleteCampaign API
3. Verify campaign is removed
4. Attempt to retrieve deleted campaign
5. Verify campaign not found

**Expected Result**: Campaign deleted successfully.

**Assertions**:
- Delete operation returns true
- Retrieved campaign is null

---

#### Scenario 2.7: Prevent Invalid State Transitions
**Requirement**: 13.4
**Description**: Verify that invalid state transitions are prevented.

**Test Steps**:
1. Create a draft campaign
2. Attempt to pause draft campaign (invalid)
3. Verify error is thrown
4. Start campaign
5. Attempt to start active campaign (invalid)
6. Verify error is thrown

**Expected Result**: Invalid transitions are rejected with appropriate errors.

**Assertions**:
- Error for pausing draft: "Can only pause active campaigns"
- Error for starting active: "Can only start draft or paused campaigns"

---

### 3. Participant Management Tests

#### Scenario 3.1: Add Participant to Active Campaign
**Requirement**: 13.5
**Description**: Verify that participants can be added to active campaigns.

**Test Steps**:
1. Create and start a campaign
2. Add participant with public key and username
3. Verify participant is added
4. Verify participant data is correct

**Expected Result**: Participant added successfully.

**Assertions**:
- Participant has unique ID
- Participant public key matches
- Participant username matches
- `rewardsClaimed === 0`
- Campaign participants array updated

---

#### Scenario 3.2: Prevent Duplicate Participants
**Requirement**: 13.5
**Description**: Verify that duplicate participants cannot be added.

**Test Steps**:
1. Create and start a campaign
2. Add participant with public key
3. Attempt to add same public key again
4. Verify error is thrown

**Expected Result**: Duplicate participant rejected.

**Assertions**:
- Error message: "Participant already exists in campaign"

---

#### Scenario 3.3: Restrict Participant Addition to Active Campaigns
**Requirement**: 13.5
**Description**: Verify participants can only be added to active campaigns.

**Test Steps**:
1. Create a draft campaign
2. Attempt to add participant
3. Verify error is thrown

**Expected Result**: Participant addition rejected for non-active campaign.

**Assertions**:
- Error message: "Can only add participants to active campaigns"

---

### 4. Reward Distribution Tests

#### Scenario 4.1: Distribute Rewards to Participants
**Requirement**: 19.1, 19.2
**Description**: Verify that rewards can be distributed to multiple participants.

**Test Steps**:
1. Create and start a campaign
2. Add multiple participants
3. Distribute rewards to subset of participants
4. Verify rewards are created
5. Verify reward data is correct

**Expected Result**: Rewards created for all specified recipients.

**Assertions**:
- Reward count matches recipient count
- Each reward has correct campaign ID
- Each reward has correct amount
- Each reward status is 'pending'
- Campaign totalDistributed updated

---

#### Scenario 4.2: Validate Budget Sufficiency
**Requirement**: 19.2
**Description**: Verify that reward distribution fails if budget is insufficient.

**Test Steps**:
1. Create campaign with limited budget
2. Distribute rewards up to budget limit
3. Attempt to distribute more rewards
4. Verify error is thrown

**Expected Result**: Distribution rejected when budget exceeded.

**Assertions**:
- Error message: "Insufficient budget for reward distribution"
- Campaign totalDistributed not updated

---

#### Scenario 4.3: Track Total Distributed Amount
**Requirement**: 19.3
**Description**: Verify that total distributed amount is tracked accurately.

**Test Steps**:
1. Create and start a campaign
2. Distribute first batch of rewards
3. Verify totalDistributed updated
4. Distribute second batch
5. Verify totalDistributed cumulative

**Expected Result**: Total distributed amount accurately reflects all distributions.

**Assertions**:
- After batch 1: `totalDistributed === batch1Amount`
- After batch 2: `totalDistributed === batch1Amount + batch2Amount`

---

### 5. Reward Processing Tests

#### Scenario 5.1: Process Pending Rewards
**Requirement**: 19.5
**Description**: Verify that pending rewards can be processed.

**Test Steps**:
1. Create campaign and distribute rewards
2. Process a pending reward
3. Verify reward status changes
4. Verify transaction hash is generated

**Expected Result**: Reward processed successfully.

**Assertions**:
- Reward status is 'completed' or 'failed'
- If completed: transaction hash is set
- If failed: failure reason is set

---

#### Scenario 5.2: Prevent Processing Non-Pending Rewards
**Requirement**: 19.5
**Description**: Verify that only pending rewards can be processed.

**Test Steps**:
1. Create and process a reward
2. Attempt to process same reward again
3. Verify error is thrown

**Expected Result**: Re-processing rejected.

**Assertions**:
- Error message: "Can only process pending rewards"

---

#### Scenario 5.3: Handle Processing Failures
**Requirement**: 19.6
**Description**: Verify that processing failures are handled gracefully.

**Test Steps**:
1. Create campaign and distribute rewards
2. Process multiple rewards
3. Verify some may fail (simulated 5% failure rate)
4. Verify failed rewards have failure reason

**Expected Result**: Failures handled without crashing.

**Assertions**:
- Failed rewards have status 'failed'
- Failed rewards have `failureReason` set

---

### 6. Reward Claiming Tests

#### Scenario 6.1: Claim Completed Reward
**Requirement**: 19.7
**Description**: Verify that recipients can claim completed rewards.

**Test Steps**:
1. Create campaign, distribute, and process reward
2. Claim reward as recipient
3. Verify reward is marked as claimed
4. Verify claim timestamp is set

**Expected Result**: Reward claimed successfully.

**Assertions**:
- `reward.claimedAt` is set
- Claim timestamp is valid

---

#### Scenario 6.2: Prevent Unauthorized Claims
**Requirement**: 19.7
**Description**: Verify that only recipients can claim their rewards.

**Test Steps**:
1. Create and process a reward
2. Attempt to claim with wrong public key
3. Verify error is thrown

**Expected Result**: Unauthorized claim rejected.

**Assertions**:
- Error message: "Only the recipient can claim this reward"

---

#### Scenario 6.3: Prevent Double Claiming
**Requirement**: 19.8
**Description**: Verify that rewards cannot be claimed twice.

**Test Steps**:
1. Create, process, and claim a reward
2. Attempt to claim same reward again
3. Verify error is thrown

**Expected Result**: Double claim rejected.

**Assertions**:
- Error message: "Reward already claimed"

---

### 7. Campaign Statistics Tests

#### Scenario 7.1: Calculate Campaign Statistics
**Requirement**: 13.6, 13.7
**Description**: Verify that campaign statistics are calculated correctly.

**Test Steps**:
1. Create campaign with participants and rewards
2. Get campaign statistics
3. Verify all metrics are correct

**Expected Result**: Statistics accurately reflect campaign state.

**Assertions**:
- `totalParticipants` matches participant count
- `totalRewards` matches reward count
- `totalDistributed` matches sum of rewards
- `budgetRemaining` is correct
- `budgetUtilization` percentage is correct

---

#### Scenario 7.2: Track Reward Statuses
**Requirement**: 13.7
**Description**: Verify that reward status counts are tracked.

**Test Steps**:
1. Create campaign and distribute rewards
2. Process some rewards
3. Get statistics
4. Verify status counts

**Expected Result**: Status counts are accurate.

**Assertions**:
- `pendingRewards` count is correct
- `completedRewards` count is correct
- `failedRewards` count is correct
- Sum of statuses equals total rewards

---

### 8. End-to-End Workflow Tests

#### Scenario 8.1: Complete Campaign Lifecycle
**Requirement**: All (13.1-13.7, 19.1-19.8)
**Description**: Verify complete campaign workflow from creation to completion.

**Test Steps**:
1. Create campaign (draft status)
2. Start campaign (active status)
3. Add 10 participants
4. Distribute rewards to top 5 participants
5. Process all rewards
6. Claim successful rewards
7. Verify statistics
8. Complete campaign

**Expected Result**: Full workflow completes successfully.

**Assertions**:
- Campaign progresses through all states
- All operations succeed
- Final statistics are accurate
- Campaign ends in 'completed' status

---

## Test Data Requirements

### Campaign Data
- Name: String, 1-100 characters
- Description: String, optional
- Budget: Number, > 0
- Reward Amount: Number, > 0, <= budget
- Asset Code: String, 1-12 characters
- Start/End Dates: ISO 8601 strings

### Participant Data
- Public Key: Stellar public key format (G...)
- Username: String, 3-30 characters
- Engagement Score: Number, 0-100

### Reward Data
- Campaign ID: Valid campaign ID
- Recipient Public Key: Valid Stellar public key
- Amount: Number, > 0
- Asset Code: String, 1-12 characters

---

## Performance Requirements

- Campaign creation: < 100ms
- Participant addition: < 50ms
- Reward distribution (50 recipients): < 1s
- Reward processing: < 200ms
- Statistics calculation: < 100ms

---

## Error Handling Requirements

All errors must:
- Include descriptive error messages
- Not expose sensitive data
- Be caught and handled gracefully
- Return appropriate HTTP status codes (if applicable)

---

## Security Requirements

- Validate all input data
- Prevent SQL injection (if using database)
- Sanitize user-provided strings
- Verify public key formats
- Prevent unauthorized operations

---

## Accessibility Requirements

- All UI components keyboard accessible
- Screen reader compatible
- ARIA labels on interactive elements
- Focus management in modals
- Color contrast WCAG AA compliant

---

## Browser Compatibility

- Chrome/Edge: Last 2 versions
- Firefox: Last 2 versions
- Safari: Last 2 versions
- Mobile browsers: iOS 13+, Android 8+

---

## Test Environment

- Node.js: 18+
- Vitest: Latest
- Mock Stellar SDK
- Mock localStorage
- Isolated test database (if applicable)

---

## Continuous Integration

Tests should run:
- On every commit
- On pull requests
- Before deployment
- Nightly for full suite

---

## Reporting

Generate reports including:
- Test results (passed/failed/skipped)
- Coverage metrics
- Performance metrics
- Error logs
- Screenshots (for UI tests)

---

## Maintenance

- Review tests quarterly
- Update for new features
- Remove obsolete tests
- Refactor for clarity
- Update documentation
