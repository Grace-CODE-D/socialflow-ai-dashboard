import { test, expect } from '@playwright/test';

/**
 * E2E Tests for NFT Content Creation (Requirement 6)
 * Tests cover Requirements 6.1-6.8:
 * - NFT minting flow
 * - NFT transfer
 * - NFT gallery display
 * - Batch minting
 */

test.describe('NFT Content Creation E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Mock wallet connection
    await page.evaluate(() => {
      (window as any).mockWalletConnected = true;
      (window as any).mockPublicKey = 'GTEST123MOCKPUBLICKEY456789';
    });
  });

  // Requirement 6.1-6.3: Test NFT minting flow
  test('should complete NFT minting process', async ({ page }) => {
    // Navigate to NFT section
    await page.click('[data-testid="nft-nav"]');
    await page.click('[data-testid="create-nft"]');

    // Upload media file (6.1)
    const fileInput = page.locator('[data-testid="nft-file-upload"]');
    await fileInput.setInputFiles({
      name: 'test-image.png',
      mimeType: 'image/png',
      buffer: Buffer.from('fake-image-data')
    });

    // Verify IPFS upload progress
    await expect(page.locator('[data-testid="ipfs-upload-progress"]')).toBeVisible();
    await page.waitForSelector('[data-testid="ipfs-upload-complete"]', { timeout: 10000 });

    // Verify IPFS hash display (6.1)
    const ipfsHash = await page.locator('[data-testid="ipfs-hash"]').textContent();
    expect(ipfsHash).toMatch(/^Qm[a-zA-Z0-9]{44}$/);

    // Fill NFT metadata (6.2)
    await page.fill('[data-testid="nft-title"]', 'My First NFT');
    await page.fill('[data-testid="nft-description"]', 'A unique digital collectible');
    await page.fill('[data-testid="nft-creator"]', 'Test Creator');

    // Verify metadata preview
    await expect(page.locator('[data-testid="metadata-preview"]')).toBeVisible();
    await expect(page.locator('[data-testid="metadata-preview"]')).toContainText('My First NFT');

    // Mint NFT (6.3)
    await page.click('[data-testid="mint-nft"]');

    // Verify wallet approval
    await expect(page.locator('[data-testid="wallet-approval-modal"]')).toBeVisible();
    await page.click('[data-testid="approve-mint"]');

    // Verify minting status
    await expect(page.locator('[data-testid="mint-status"]')).toContainText('minting');
    await page.waitForSelector('[data-testid="mint-status"]:has-text("completed")', {
      timeout: 15000
    });

    // Verify success notification
    await expect(page.locator('[data-testid="mint-success"]')).toBeVisible();
  });

  // Requirement 6.4: Test NFT display in gallery
  test('should display NFTs in gallery with preview', async ({ page }) => {
    await page.click('[data-testid="nft-nav"]');
    await page.click('[data-testid="my-nfts-tab"]');

    // Verify gallery display (6.4)
    await expect(page.locator('[data-testid="nft-gallery"]')).toBeVisible();
    await expect(page.locator('[data-testid="nft-item"]')).toHaveCount(3, { timeout: 5000 });

    // Verify preview images
    const nftItems = page.locator('[data-testid="nft-item"]');
    await expect(nftItems.first().locator('[data-testid="nft-preview"]')).toBeVisible();

    // Click on NFT to view details
    await nftItems.first().click();

    // Verify detailed view
    await expect(page.locator('[data-testid="nft-detail-modal"]')).toBeVisible();
    await expect(page.locator('[data-testid="nft-title"]')).toBeVisible();
    await expect(page.locator('[data-testid="nft-description"]')).toBeVisible();
    await expect(page.locator('[data-testid="nft-creator"]')).toBeVisible();
    await expect(page.locator('[data-testid="ipfs-link"]')).toBeVisible();
  });

  // Requirement 6.5: Test NFT transfer
  test('should transfer NFT to another wallet', async ({ page }) => {
    await page.click('[data-testid="nft-nav"]');
    await page.click('[data-testid="my-nfts-tab"]');

    // Select NFT to transfer
    await page.locator('[data-testid="nft-item"]').first().click();
    await page.click('[data-testid="transfer-nft"]');

    // Fill transfer form (6.5)
    await page.fill('[data-testid="recipient-address"]', 'GRECIPIENT123456789');
    await page.fill('[data-testid="transfer-memo"]', 'Gift for you');

    // Verify transfer preview
    await expect(page.locator('[data-testid="transfer-preview"]')).toBeVisible();
    await expect(page.locator('[data-testid="transfer-recipient"]')).toContainText('GRECIPIENT');

    // Submit transfer
    await page.click('[data-testid="confirm-transfer"]');

    // Verify wallet approval
    await expect(page.locator('[data-testid="wallet-approval-modal"]')).toBeVisible();
    await page.click('[data-testid="approve-transfer"]');

    // Verify transfer status
    await expect(page.locator('[data-testid="transfer-status"]')).toContainText('pending');
    await page.waitForSelector('[data-testid="transfer-status"]:has-text("completed")');

    // Verify success notification
    await expect(page.locator('[data-testid="transfer-success"]')).toBeVisible();
  });

  // Requirement 6.6: Test NFT collections with batch minting
  test('should create NFT collection with batch minting', async ({ page }) => {
    await page.click('[data-testid="nft-nav"]');
    await page.click('[data-testid="create-collection"]');

    // Fill collection details
    await page.fill('[data-testid="collection-name"]', 'My Art Collection');
    await page.fill('[data-testid="collection-description"]', 'A series of digital artworks');

    await page.click('[data-testid="next-step"]');

    // Upload multiple files for batch minting (6.6)
    const fileInput = page.locator('[data-testid="batch-file-upload"]');
    await fileInput.setInputFiles([
      {
        name: 'art1.png',
        mimeType: 'image/png',
        buffer: Buffer.from('fake-image-1')
      },
      {
        name: 'art2.png',
        mimeType: 'image/png',
        buffer: Buffer.from('fake-image-2')
      },
      {
        name: 'art3.png',
        mimeType: 'image/png',
        buffer: Buffer.from('fake-image-3')
      }
    ]);

    // Verify batch upload progress
    await expect(page.locator('[data-testid="batch-upload-progress"]')).toBeVisible();
    await expect(page.locator('[data-testid="upload-count"]')).toContainText('3 files');

    // Wait for all uploads to complete
    await page.waitForSelector('[data-testid="all-uploads-complete"]', { timeout: 20000 });

    // Fill metadata for each NFT
    const metadataForms = page.locator('[data-testid="nft-metadata-form"]');
    await metadataForms.nth(0).locator('[data-testid="nft-title"]').fill('Art Piece #1');
    await metadataForms.nth(1).locator('[data-testid="nft-title"]').fill('Art Piece #2');
    await metadataForms.nth(2).locator('[data-testid="nft-title"]').fill('Art Piece #3');

    // Batch mint
    await page.click('[data-testid="batch-mint"]');

    // Verify batch minting progress
    await expect(page.locator('[data-testid="batch-mint-progress"]')).toBeVisible();
    await expect(page.locator('[data-testid="minting-count"]')).toContainText('0 / 3');

    // Wait for batch minting to complete
    await page.waitForSelector('[data-testid="minting-count"]:has-text("3 / 3")', {
      timeout: 30000
    });

    // Verify success
    await expect(page.locator('[data-testid="batch-mint-success"]')).toBeVisible();
    await expect(page.locator('[data-testid="collection-created"]')).toBeVisible();
  });

  // Requirement 6.7: Test shareable NFT link generation
  test('should generate shareable link for NFT promotion', async ({ page }) => {
    await page.click('[data-testid="nft-nav"]');
    await page.click('[data-testid="my-nfts-tab"]');

    // Select NFT
    await page.locator('[data-testid="nft-item"]').first().click();

    // Generate shareable link (6.7)
    await page.click('[data-testid="share-nft"]');

    // Verify shareable link display
    await expect(page.locator('[data-testid="shareable-link"]')).toBeVisible();
    const shareLink = await page.locator('[data-testid="shareable-link"]').textContent();
    expect(shareLink).toContain('https://');

    // Test copy to clipboard
    await page.click('[data-testid="copy-share-link"]');
    await expect(page.locator('[data-testid="copy-success"]')).toBeVisible();

    // Verify social media share buttons
    await expect(page.locator('[data-testid="share-twitter"]')).toBeVisible();
    await expect(page.locator('[data-testid="share-facebook"]')).toBeVisible();
    await expect(page.locator('[data-testid="share-instagram"]')).toBeVisible();
  });

  // Requirement 6.8: Test NFT ownership history and provenance
  test('should display NFT ownership history and provenance', async ({ page }) => {
    await page.click('[data-testid="nft-nav"]');
    await page.click('[data-testid="my-nfts-tab"]');

    // Select NFT
    await page.locator('[data-testid="nft-item"]').first().click();

    // Navigate to provenance tab (6.8)
    await page.click('[data-testid="provenance-tab"]');

    // Verify ownership history display
    await expect(page.locator('[data-testid="ownership-history"]')).toBeVisible();
    
    // Verify history entries
    const historyEntries = page.locator('[data-testid="history-entry"]');
    await expect(historyEntries).toHaveCount(2, { timeout: 5000 });

    // Verify entry details
    await expect(historyEntries.first()).toContainText('Minted');
    await expect(historyEntries.first().locator('[data-testid="timestamp"]')).toBeVisible();
    await expect(historyEntries.first().locator('[data-testid="owner-address"]')).toBeVisible();

    // Verify blockchain verification link
    await expect(page.locator('[data-testid="blockchain-explorer-link"]')).toBeVisible();
    const explorerLink = await page.locator('[data-testid="blockchain-explorer-link"]').getAttribute('href');
    expect(explorerLink).toContain('stellar');
  });

  // Test NFT metadata validation
  test('should validate NFT metadata before minting', async ({ page }) => {
    await page.click('[data-testid="nft-nav"]');
    await page.click('[data-testid="create-nft"]');

    // Upload file
    const fileInput = page.locator('[data-testid="nft-file-upload"]');
    await fileInput.setInputFiles({
      name: 'test.png',
      mimeType: 'image/png',
      buffer: Buffer.from('fake-data')
    });

    await page.waitForSelector('[data-testid="ipfs-upload-complete"]');

    // Try to mint without metadata
    await page.click('[data-testid="mint-nft"]');

    // Verify validation errors
    await expect(page.locator('[data-testid="validation-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="title-error"]')).toContainText('required');
  });

  // Test IPFS upload failure handling
  test('should handle IPFS upload failures', async ({ page }) => {
    await page.click('[data-testid="nft-nav"]');
    await page.click('[data-testid="create-nft"]');

    // Simulate upload failure
    await page.evaluate(() => {
      (window as any).mockIPFSFailure = true;
    });

    const fileInput = page.locator('[data-testid="nft-file-upload"]');
    await fileInput.setInputFiles({
      name: 'test.png',
      mimeType: 'image/png',
      buffer: Buffer.from('fake-data')
    });

    // Verify error handling
    await expect(page.locator('[data-testid="ipfs-upload-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="retry-upload"]')).toBeVisible();

    // Test retry functionality
    await page.evaluate(() => {
      (window as any).mockIPFSFailure = false;
    });
    await page.click('[data-testid="retry-upload"]');

    await expect(page.locator('[data-testid="ipfs-upload-complete"]')).toBeVisible();
  });

  // Test NFT filtering and search in gallery
  test('should filter and search NFTs in gallery', async ({ page }) => {
    await page.click('[data-testid="nft-nav"]');
    await page.click('[data-testid="my-nfts-tab"]');

    // Test search functionality
    await page.fill('[data-testid="search-nfts"]', 'Art Piece');
    await page.press('[data-testid="search-nfts"]', 'Enter');

    // Verify filtered results
    await expect(page.locator('[data-testid="nft-item"]')).toHaveCount(3);

    // Test collection filter
    await page.selectOption('[data-testid="filter-collection"]', 'My Art Collection');
    await expect(page.locator('[data-testid="nft-item"]')).toHaveCount(3);

    // Test sort options
    await page.selectOption('[data-testid="sort-nfts"]', 'date-desc');
    const firstNFT = await page.locator('[data-testid="nft-item"]').first().textContent();
    expect(firstNFT).toBeTruthy();
  });

  // Test NFT transfer notification
  test('should notify when NFT is received', async ({ page }) => {
    await page.goto('/');

    // Simulate incoming NFT transfer
    await page.evaluate(() => {
      const event = new CustomEvent('stellar:nft:received', {
        detail: {
          sender: 'GSENDER123456789',
          nftId: 'NFT123',
          title: 'Received NFT'
        }
      });
      window.dispatchEvent(event);
    });

    // Verify notification
    await expect(page.locator('[data-testid="nft-received-notification"]')).toBeVisible();
    await expect(page.locator('[data-testid="notification-title"]')).toContainText('Received NFT');
  });
});
