import { Transaction } from '../types/transaction';

/**
 * Demo utility to add test transactions to the queue
 * Usage in browser console: window.demoTransaction()
 */
export const createDemoTransaction = (): Omit<Transaction, 'id' | 'timestamp'> => {
  const types = ['Payment', 'Token Transfer', 'NFT Mint', 'Smart Contract Call'];
  const assets = ['XLM', 'USDC', 'CUSTOM'];
  const recipients = [
    'GABC...XYZ',
    'GDEF...ABC',
    'GHIJ...DEF',
  ];

  return {
    type: types[Math.floor(Math.random() * types.length)],
    amount: (Math.random() * 1000).toFixed(2),
    asset: assets[Math.floor(Math.random() * assets.length)],
    recipient: recipients[Math.floor(Math.random() * recipients.length)],
    status: 'pending',
  };
};

/**
 * Add a demo transaction to the queue
 */
export const addDemoTransaction = () => {
  const addTx = (window as any).__addTransaction;
  if (addTx) {
    const tx = createDemoTransaction();
    addTx(tx);
    console.log('Demo transaction added:', tx);
  } else {
    console.error('Transaction queue not initialized');
  }
};

// Expose to window for testing
if (typeof window !== 'undefined') {
  (window as any).demoTransaction = addDemoTransaction;
}
