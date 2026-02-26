#!/usr/bin/env node

/**
 * Manual test script for Transaction History implementation
 * Run with: node src/services/__tests__/manual-test.js
 */

const { indexedDB } = require('fake-indexeddb');
global.indexedDB = indexedDB;

// Import after setting up fake-indexeddb
const { transactionDB } = require('../transactionDB');

async function runTests() {
  console.log('🧪 Testing Transaction History Implementation\n');
  
  let passed = 0;
  let failed = 0;

  try {
    // Test 1: Initialize database
    console.log('Test 1: Initialize database');
    await transactionDB.init();
    console.log('✅ PASSED\n');
    passed++;

    // Test 2: Add single transaction
    console.log('Test 2: Add single transaction');
    const tx1 = {
      id: 'test_tx_1',
      type: 'payment',
      amount: '100',
      asset: 'XLM',
      timestamp: Date.now(),
      status: 'confirmed',
      from: 'GABC123',
      to: 'GDEF456',
      syncedAt: Date.now(),
    };
    await transactionDB.addTransaction(tx1);
    const retrieved = await transactionDB.getTransaction('test_tx_1');
    if (retrieved && retrieved.id === 'test_tx_1') {
      console.log('✅ PASSED\n');
      passed++;
    } else {
      console.log('❌ FAILED: Transaction not retrieved correctly\n');
      failed++;
    }

    // Test 3: Add multiple transactions
    console.log('Test 3: Add multiple transactions');
    const bulkTxs = Array.from({ length: 10 }, (_, i) => ({
      id: `bulk_tx_${i}`,
      type: ['payment', 'token', 'nft'][i % 3],
      amount: String((i + 1) * 10),
      asset: ['XLM', 'USDC', 'BTC'][i % 3],
      timestamp: Date.now() - i * 1000,
      status: 'confirmed',
      syncedAt: Date.now(),
    }));
    await transactionDB.addTransactions(bulkTxs);
    const allTxs = await transactionDB.getAllTransactions();
    if (allTxs.length === 11) { // 1 from test 2 + 10 from test 3
      console.log(`✅ PASSED (${allTxs.length} transactions)\n`);
      passed++;
    } else {
      console.log(`❌ FAILED: Expected 11 transactions, got ${allTxs.length}\n`);
      failed++;
    }

    // Test 4: Query by type
    console.log('Test 4: Query by type');
    const paymentTxs = await transactionDB.getTransactionsByType('payment');
    if (paymentTxs.length > 0) {
      console.log(`✅ PASSED (${paymentTxs.length} payment transactions)\n`);
      passed++;
    } else {
      console.log('❌ FAILED: No payment transactions found\n');
      failed++;
    }

    // Test 5: Query by asset
    console.log('Test 5: Query by asset');
    const xlmTxs = await transactionDB.getTransactionsByAsset('XLM');
    if (xlmTxs.length > 0) {
      console.log(`✅ PASSED (${xlmTxs.length} XLM transactions)\n`);
      passed++;
    } else {
      console.log('❌ FAILED: No XLM transactions found\n');
      failed++;
    }

    // Test 6: Query by date range
    console.log('Test 6: Query by date range');
    const now = Date.now();
    const oneHourAgo = now - 3600000;
    const recentTxs = await transactionDB.getTransactionsByDateRange(oneHourAgo, now);
    if (recentTxs.length > 0) {
      console.log(`✅ PASSED (${recentTxs.length} transactions in range)\n`);
      passed++;
    } else {
      console.log('❌ FAILED: No transactions in date range\n');
      failed++;
    }

    // Test 7: Get latest transaction
    console.log('Test 7: Get latest transaction');
    const latest = await transactionDB.getLatestTransaction();
    if (latest) {
      console.log(`✅ PASSED (Latest: ${latest.id})\n`);
      passed++;
    } else {
      console.log('❌ FAILED: No latest transaction found\n');
      failed++;
    }

    // Test 8: Update transaction
    console.log('Test 8: Update transaction');
    const updatedTx = { ...tx1, status: 'failed' };
    await transactionDB.addTransaction(updatedTx);
    const updated = await transactionDB.getTransaction('test_tx_1');
    if (updated && updated.status === 'failed') {
      console.log('✅ PASSED\n');
      passed++;
    } else {
      console.log('❌ FAILED: Transaction not updated\n');
      failed++;
    }

    // Test 9: Clear database
    console.log('Test 9: Clear database');
    await transactionDB.clearAll();
    const afterClear = await transactionDB.getAllTransactions();
    if (afterClear.length === 0) {
      console.log('✅ PASSED\n');
      passed++;
    } else {
      console.log(`❌ FAILED: ${afterClear.length} transactions remaining\n`);
      failed++;
    }

    // Summary
    console.log('═══════════════════════════════════════');
    console.log(`📊 Test Results: ${passed} passed, ${failed} failed`);
    console.log('═══════════════════════════════════════\n');

    if (failed === 0) {
      console.log('🎉 All tests passed! Implementation is working correctly.\n');
      process.exit(0);
    } else {
      console.log('⚠️  Some tests failed. Please review the implementation.\n');
      process.exit(1);
    }

  } catch (error) {
    console.error('❌ Test suite failed with error:', error);
    process.exit(1);
  } finally {
    transactionDB.close();
  }
}

runTests();
