import { transactionDB, TransactionRecord } from '../services/transactionDB';

async function testIndexedDB() {
  console.log('🧪 Testing IndexedDB Implementation...\n');

  try {
    // Test 1: Initialize database
    console.log('Test 1: Initialize database');
    await transactionDB.init();
    console.log('✅ Database initialized\n');

    // Test 2: Add single transaction
    console.log('Test 2: Add single transaction');
    const testTx: TransactionRecord = {
      id: 'test_tx_1',
      type: 'payment',
      amount: '100',
      asset: 'XLM',
      timestamp: Date.now(),
      status: 'confirmed',
      from: 'GABC123',
      to: 'GDEF456',
      memo: 'Test transaction',
      fee: '100',
      syncedAt: Date.now(),
    };
    await transactionDB.addTransaction(testTx);
    console.log('✅ Transaction added\n');

    // Test 3: Retrieve transaction
    console.log('Test 3: Retrieve transaction');
    const retrieved = await transactionDB.getTransaction('test_tx_1');
    console.log('✅ Transaction retrieved:', retrieved?.id, '\n');

    // Test 4: Add multiple transactions
    console.log('Test 4: Add multiple transactions');
    const bulkTxs: TransactionRecord[] = Array.from({ length: 10 }, (_, i) => ({
      id: `bulk_tx_${i}`,
      type: ['payment', 'token', 'nft'][i % 3],
      amount: String((i + 1) * 10),
      asset: ['XLM', 'USDC', 'BTC'][i % 3],
      timestamp: Date.now() - i * 1000,
      status: 'confirmed' as const,
      from: `SENDER_${i}`,
      to: `RECEIVER_${i}`,
      syncedAt: Date.now(),
    }));
    await transactionDB.addTransactions(bulkTxs);
    console.log('✅ Bulk transactions added\n');

    // Test 5: Get all transactions
    console.log('Test 5: Get all transactions');
    const allTxs = await transactionDB.getAllTransactions();
    console.log(`✅ Retrieved ${allTxs.length} transactions\n`);

    // Test 6: Query by type
    console.log('Test 6: Query by type');
    const paymentTxs = await transactionDB.getTransactionsByType('payment');
    console.log(`✅ Found ${paymentTxs.length} payment transactions\n`);

    // Test 7: Query by asset
    console.log('Test 7: Query by asset');
    const xlmTxs = await transactionDB.getTransactionsByAsset('XLM');
    console.log(`✅ Found ${xlmTxs.length} XLM transactions\n`);

    // Test 8: Query by date range
    console.log('Test 8: Query by date range');
    const now = Date.now();
    const oneHourAgo = now - 3600000;
    const recentTxs = await transactionDB.getTransactionsByDateRange(oneHourAgo, now);
    console.log(`✅ Found ${recentTxs.length} transactions in last hour\n`);

    // Test 9: Get latest transaction
    console.log('Test 9: Get latest transaction');
    const latest = await transactionDB.getLatestTransaction();
    console.log('✅ Latest transaction:', latest?.id, '\n');

    // Test 10: Clear database
    console.log('Test 10: Clear database');
    await transactionDB.clearAll();
    const afterClear = await transactionDB.getAllTransactions();
    console.log(`✅ Database cleared. Remaining: ${afterClear.length} transactions\n`);

    console.log('🎉 All tests passed!');
    return true;
  } catch (error) {
    console.error('❌ Test failed:', error);
    return false;
  } finally {
    transactionDB.close();
  }
}

// Run tests if in browser environment
if (typeof window !== 'undefined') {
  console.log('Run testIndexedDB() in browser console to test');
}

export { testIndexedDB };
