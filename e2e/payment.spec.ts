import { test, expect } from '@playwright/test';

/**
 * E2E Tests for Payment Processing (Requirement 4)
 * Tests cover Requirements 4.1-4.8:
 * - XLM payment flow
 * - Token payment flow
 * - Payment request generation
 * - Recurring payment setup
 * - Payment history
 */

test.describe('Payment Processing E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Mock wallet connection for testing
    await page.evaluate(() => {
      (window as any).mockWalletConnected = true;
      (window as any).mockPublicKey = 'GTEST123MOCKPUBLICKEY456789';
    });
  });

  // Requirement 4.1: Test XLM payment flow
  test('should complete XLM payment transaction', async ({ page }) => {
    // Navigate to payment section
    await page.click('[data-testid="payments-nav"]');
    await expect(page.locator('[data-testid="payment-form"]')).toBeVisible();

    // Fill payment form
    await page.fill('[data-testid="recipient-address"]', 'GRECIPIENT123456789');
    await page.fill('[data-testid="payment-amount"]', '100');
    await page.selectOption('[data-testid="asset-type"]', 'XLM');

    // Verify gas fee calculation (4.2)
    await expect(page.locator('[data-testid="gas-fee"]')).toBeVisible();
    const gasFee = await page.locator('[data-testid="gas-fee"]').textContent();
    expect(gasFee).toMatch(/\d+\.\d+ XLM/);

    // Submit payment (4.3)
    await page.click('[data-testid="submit-payment"]');

    // Verify wallet approval prompt
    await expect(page.locator('[data-testid="wallet-approval-modal"]')).toBeVisible();
    await page.click('[data-testid="approve-transaction"]');

    // Verify transaction status display (4.4)
    await expect(page.locator('[data-testid="transaction-status"]')).toContainText('pending');
    
    // Wait for confirmation
    await page.waitForSelector('[data-testid="transaction-status"]:has-text("confirmed")', {
      timeout: 10000
    });

    // Verify success notification (4.5)
    await expect(page.locator('[data-testid="payment-success-notification"]')).toBeVisible();
  });

  // Requirement 4.1: Test token payment flow
  test('should complete custom token payment', async ({ page }) => {
    await page.click('[data-testid="payments-nav"]');

    // Fill payment form with custom token
    await page.fill('[data-testid="recipient-address"]', 'GRECIPIENT123456789');
    await page.fill('[data-testid="payment-amount"]', '50');
    await page.selectOption('[data-testid="asset-type"]', 'CUSTOM_TOKEN');
    await page.fill('[data-testid="token-issuer"]', 'GISSUER123456789');

    // Verify gas fee in XLM and fiat (4.2)
    await expect(page.locator('[data-testid="gas-fee-xlm"]')).toBeVisible();
    await expect(page.locator('[data-testid="gas-fee-fiat"]')).toBeVisible();

    await page.click('[data-testid="submit-payment"]');
    await page.click('[data-testid="approve-transaction"]');

    await expect(page.locator('[data-testid="transaction-status"]')).toContainText('confirmed');
  });

  // Requirement 4.6: Test payment request generation with QR code
  test('should generate payment request with QR code', async ({ page }) => {
    await page.click('[data-testid="payments-nav"]');
    await page.click('[data-testid="create-payment-request"]');

    // Fill payment request details
    await page.fill('[data-testid="request-amount"]', '75');
    await page.selectOption('[data-testid="request-asset"]', 'XLM');
    await page.fill('[data-testid="request-memo"]', 'Payment for services');

    await page.click('[data-testid="generate-request"]');

    // Verify QR code generation
    await expect(page.locator('[data-testid="payment-qr-code"]')).toBeVisible();
    
    // Verify payment link
    const paymentLink = await page.locator('[data-testid="payment-link"]').textContent();
    expect(paymentLink).toContain('stellar:');

    // Verify shareable link
    await page.click('[data-testid="copy-payment-link"]');
    await expect(page.locator('[data-testid="copy-success"]')).toBeVisible();
  });

  // Requirement 4.8: Test recurring payment setup
  test('should set up recurring payment schedule', async ({ page }) => {
    await page.click('[data-testid="payments-nav"]');
    await page.click('[data-testid="recurring-payments-tab"]');
    await page.click('[data-testid="create-recurring-payment"]');

    // Configure recurring payment
    await page.fill('[data-testid="recipient-address"]', 'GRECIPIENT123456789');
    await page.fill('[data-testid="payment-amount"]', '25');
    await page.selectOption('[data-testid="asset-type"]', 'XLM');
    await page.selectOption('[data-testid="frequency"]', 'weekly');
    await page.fill('[data-testid="start-date"]', '2026-03-01');

    await page.click('[data-testid="create-schedule"]');

    // Verify user approval requirement
    await expect(page.locator('[data-testid="approval-notice"]')).toContainText('requires approval');
    await page.click('[data-testid="approve-schedule"]');

    // Verify schedule created
    await expect(page.locator('[data-testid="recurring-payment-list"]')).toContainText('weekly');
    await expect(page.locator('[data-testid="next-payment-date"]')).toBeVisible();
  });

  // Requirement 4.7: Test payment history with filtering and search
  test('should display and filter payment history', async ({ page }) => {
    await page.click('[data-testid="payments-nav"]');
    await page.click('[data-testid="payment-history-tab"]');

    // Verify payment history display
    await expect(page.locator('[data-testid="payment-history-list"]')).toBeVisible();

    // Test filtering by date range
    await page.fill('[data-testid="filter-start-date"]', '2026-01-01');
    await page.fill('[data-testid="filter-end-date"]', '2026-02-28');
    await page.click('[data-testid="apply-filters"]');

    // Test search by transaction hash
    await page.fill('[data-testid="search-transactions"]', 'abc123hash');
    await page.press('[data-testid="search-transactions"]', 'Enter');

    // Verify transaction details
    await page.click('[data-testid="transaction-item"]:first-child');
    await expect(page.locator('[data-testid="transaction-details"]')).toBeVisible();
    await expect(page.locator('[data-testid="transaction-type"]')).toBeVisible();
    await expect(page.locator('[data-testid="transaction-amount"]')).toBeVisible();
    await expect(page.locator('[data-testid="transaction-timestamp"]')).toBeVisible();
  });

  // Requirement 4.5: Test payment received notification
  test('should notify user when payment is received', async ({ page }) => {
    await page.goto('/');

    // Simulate incoming payment event
    await page.evaluate(() => {
      const event = new CustomEvent('stellar:payment:received', {
        detail: {
          sender: 'GSENDER123456789',
          amount: '100',
          asset: 'XLM'
        }
      });
      window.dispatchEvent(event);
    });

    // Verify notification appears
    await expect(page.locator('[data-testid="payment-received-notification"]')).toBeVisible();
    await expect(page.locator('[data-testid="notification-amount"]')).toContainText('100 XLM');

    // Verify balance update
    await expect(page.locator('[data-testid="wallet-balance"]')).toBeVisible();
  });

  // Requirement 4.4: Test real-time transaction status updates
  test('should display real-time transaction status', async ({ page }) => {
    await page.click('[data-testid="payments-nav"]');

    // Initiate payment
    await page.fill('[data-testid="recipient-address"]', 'GRECIPIENT123456789');
    await page.fill('[data-testid="payment-amount"]', '10');
    await page.click('[data-testid="submit-payment"]');
    await page.click('[data-testid="approve-transaction"]');

    // Verify status progression
    await expect(page.locator('[data-testid="transaction-status"]')).toContainText('pending');
    
    // Simulate status update
    await page.evaluate(() => {
      const event = new CustomEvent('stellar:transaction:update', {
        detail: { status: 'confirmed' }
      });
      window.dispatchEvent(event);
    });

    await expect(page.locator('[data-testid="transaction-status"]')).toContainText('confirmed');
  });

  // Test payment failure handling
  test('should handle payment failures gracefully', async ({ page }) => {
    await page.click('[data-testid="payments-nav"]');

    // Attempt payment with insufficient balance
    await page.fill('[data-testid="recipient-address"]', 'GRECIPIENT123456789');
    await page.fill('[data-testid="payment-amount"]', '999999');
    await page.click('[data-testid="submit-payment"]');

    // Verify error message
    await expect(page.locator('[data-testid="payment-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="payment-error"]')).toContainText('insufficient');
  });
});
