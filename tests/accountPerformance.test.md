# Account Performance Analytics Dashboard - Test Plan

## Test Case 1: Component Rendering
**Objective**: Verify the component renders correctly with all sections

### Steps:
1. Navigate to Performance view from sidebar
2. Wait for data to load

### Expected Results:
- [ ] Loading spinner appears initially
- [ ] All 4 overview cards display with correct data
- [ ] Balance History chart renders
- [ ] Engagement vs XLM Spent chart renders
- [ ] Top Posts bar chart renders
- [ ] Reward Distribution timeline displays
- [ ] Token Performance cards display
- [ ] Social Platform Breakdown displays

### Status: ⬜ Not Tested | ✅ Passed | ❌ Failed

---

## Test Case 2: Time Range Toggle
**Objective**: Verify time range switching works correctly

### Steps:
1. Navigate to Performance view
2. Note current data values
3. Click "Last 30 Days" button
4. Observe data changes
5. Click "Last 7 Days" button
6. Observe data changes

### Expected Results:
- [ ] "Last 7 Days" button is active by default
- [ ] Clicking "Last 30 Days" updates all charts and metrics
- [ ] Data values change appropriately
- [ ] Active button has blue background
- [ ] Inactive button has gray text
- [ ] Transition is smooth without errors

### Status: ⬜ Not Tested | ✅ Passed | ❌ Failed

---

## Test Case 3: Chart Interactions
**Objective**: Verify chart tooltips and interactions work

### Steps:
1. Hover over Balance History chart
2. Hover over Engagement vs XLM Spent chart
3. Hover over Top Posts bar chart

### Expected Results:
- [ ] Tooltips appear on hover
- [ ] Tooltips show formatted values
- [ ] Tooltips display correct data
- [ ] Charts are responsive to window resize
- [ ] No console errors

### Status: ⬜ Not Tested | ✅ Passed | ❌ Failed

---

## Test Case 4: Token Detail Expansion
**Objective**: Verify token cards expand to show detailed metrics

### Steps:
1. Click on XLM token card
2. Observe expanded view
3. Click on another token card
4. Click on the same token card again

### Expected Results:
- [ ] Token card expands with animation
- [ ] Shows 24h, 7d, 30d change percentages
- [ ] Card has blue border when selected
- [ ] Only one token can be selected at a time
- [ ] Clicking same token deselects it
- [ ] Animation is smooth

### Status: ⬜ Not Tested | ✅ Passed | ❌ Failed

---

## Test Case 5: PDF Export
**Objective**: Verify PDF export functionality

### Steps:
1. Click "Export Report" button
2. Hover to reveal dropdown
3. Click "Export as PDF"
4. Wait for new window to open

### Expected Results:
- [ ] Dropdown menu appears on hover
- [ ] New window opens with report
- [ ] Report contains all summary data
- [ ] Report contains top posts table
- [ ] Report contains social metrics table
- [ ] Report is properly formatted
- [ ] Print button works
- [ ] No popup blocker issues

### Status: ⬜ Not Tested | ✅ Passed | ❌ Failed

---

## Test Case 6: CSV Export
**Objective**: Verify CSV export functionality

### Steps:
1. Click "Export Report" button
2. Hover to reveal dropdown
3. Click "Export as CSV"
4. Check downloads folder

### Expected Results:
- [ ] CSV file downloads immediately
- [ ] Filename includes time range and timestamp
- [ ] File contains summary section
- [ ] File contains performance history
- [ ] File contains top posts data
- [ ] Data is properly formatted
- [ ] No download errors

### Status: ⬜ Not Tested | ✅ Passed | ❌ Failed

---

## Test Case 7: Data Accuracy
**Objective**: Verify data calculations are correct

### Steps:
1. Note Total Follower Growth value
2. Check individual platform followers
3. Verify sum matches total
4. Check wallet value calculation
5. Verify engagement rate calculation

### Expected Results:
- [ ] Total followers = sum of all platforms
- [ ] Total wallet value = sum of all assets
- [ ] Engagement rate is average of platforms
- [ ] Growth percentages are accurate
- [ ] All numbers are properly formatted
- [ ] Currency symbols display correctly

### Status: ⬜ Not Tested | ✅ Passed | ❌ Failed

---

## Test Case 8: Responsive Design
**Objective**: Verify layout works on different screen sizes

### Steps:
1. Open Performance view on desktop
2. Resize browser to tablet size
3. Resize browser to mobile size
4. Check all sections

### Expected Results:
- [ ] Desktop: All charts display side-by-side
- [ ] Tablet: Charts stack appropriately
- [ ] Mobile: Single column layout
- [ ] All text is readable
- [ ] No horizontal scrolling
- [ ] Charts remain interactive
- [ ] Export button remains accessible

### Status: ⬜ Not Tested | ✅ Passed | ❌ Failed

---

## Test Case 9: Loading States
**Objective**: Verify loading indicators work correctly

### Steps:
1. Clear browser cache
2. Navigate to Performance view
3. Observe loading state
4. Toggle time range
5. Observe loading state

### Expected Results:
- [ ] Loading spinner appears on initial load
- [ ] Loading message displays
- [ ] Component doesn't render until data loads
- [ ] No flash of empty content
- [ ] Export button shows "Exporting..." when active
- [ ] Export button is disabled during export

### Status: ⬜ Not Tested | ✅ Passed | ❌ Failed

---

## Test Case 10: Error Handling
**Objective**: Verify error scenarios are handled gracefully

### Steps:
1. Simulate network error
2. Attempt to load data
3. Attempt to export with error

### Expected Results:
- [ ] Error doesn't crash the app
- [ ] User-friendly error message displays
- [ ] Console logs error details
- [ ] User can retry operation
- [ ] Fallback data displays if available

### Status: ⬜ Not Tested | ✅ Passed | ❌ Failed

---

## Test Case 11: Performance Metrics
**Objective**: Verify component performance is acceptable

### Steps:
1. Open Chrome DevTools Performance tab
2. Navigate to Performance view
3. Record performance
4. Toggle time range
5. Interact with charts

### Expected Results:
- [ ] Initial render < 2 seconds
- [ ] Time range toggle < 500ms
- [ ] Chart interactions < 100ms
- [ ] No memory leaks
- [ ] Smooth 60fps animations
- [ ] No layout thrashing

### Status: ⬜ Not Tested | ✅ Passed | ❌ Failed

---

## Test Case 12: Browser Compatibility
**Objective**: Verify component works across browsers

### Browsers to Test:
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile Safari (iOS)
- [ ] Chrome Mobile (Android)

### Expected Results:
- [ ] All features work in all browsers
- [ ] Charts render correctly
- [ ] Export functions work
- [ ] No browser-specific errors
- [ ] Consistent visual appearance

### Status: ⬜ Not Tested | ✅ Passed | ❌ Failed

---

## Test Case 13: Accessibility
**Objective**: Verify component is accessible

### Steps:
1. Navigate using keyboard only
2. Use screen reader
3. Check color contrast
4. Verify ARIA labels

### Expected Results:
- [ ] All interactive elements are keyboard accessible
- [ ] Tab order is logical
- [ ] Focus indicators are visible
- [ ] Screen reader announces content correctly
- [ ] Color contrast meets WCAG AA standards
- [ ] Charts have text alternatives

### Status: ⬜ Not Tested | ✅ Passed | ❌ Failed

---

## Test Case 14: Data Persistence
**Objective**: Verify data persists across sessions

### Steps:
1. Load Performance view
2. Note current data
3. Close browser
4. Reopen browser
5. Navigate to Performance view

### Expected Results:
- [ ] Data loads from localStorage
- [ ] Previous values are displayed
- [ ] No data loss
- [ ] Timestamps are accurate

### Status: ⬜ Not Tested | ✅ Passed | ❌ Failed

---

## Test Case 15: Integration with Other Components
**Objective**: Verify integration with rest of application

### Steps:
1. Navigate from Dashboard to Performance
2. Navigate from Performance to Portfolio
3. Check data consistency
4. Verify navigation works

### Expected Results:
- [ ] Navigation is smooth
- [ ] Data is consistent across views
- [ ] No state conflicts
- [ ] Sidebar highlights correct item
- [ ] No console errors

### Status: ⬜ Not Tested | ✅ Passed | ❌ Failed

---

## Summary

**Total Test Cases**: 15
**Passed**: ___
**Failed**: ___
**Not Tested**: ___

**Tester Name**: _______________
**Test Date**: _______________
**Environment**: _______________
**Browser**: _______________
**OS**: _______________

## Notes

_Add any additional observations or issues here_

---

## Critical Issues Found

_List any critical issues that block release_

## Non-Critical Issues Found

_List any minor issues that can be addressed later_

## Recommendations

_Add any recommendations for improvements_
