import { Transaction, TransactionCategory, CategoryStats } from '../types/transaction';

export const CATEGORY_COLORS: Record<TransactionCategory, string> = {
  [TransactionCategory.PAYMENT]: 'bg-green-500',
  [TransactionCategory.TOKEN]: 'bg-blue-500',
  [TransactionCategory.NFT]: 'bg-purple-500',
  [TransactionCategory.CONTRACT]: 'bg-orange-500',
  [TransactionCategory.OTHER]: 'bg-gray-500',
};

export const CATEGORY_LABELS: Record<TransactionCategory, string> = {
  [TransactionCategory.PAYMENT]: '💰 Payment',
  [TransactionCategory.TOKEN]: '🪙 Token',
  [TransactionCategory.NFT]: '🖼️ NFT',
  [TransactionCategory.CONTRACT]: '⚙️ Contract',
  [TransactionCategory.OTHER]: '📋 Other',
};

export function autoCategorize(type: string): TransactionCategory {
  const lower = type.toLowerCase();
  if (lower.includes('payment')) return TransactionCategory.PAYMENT;
  if (lower.includes('token')) return TransactionCategory.TOKEN;
  if (lower.includes('nft')) return TransactionCategory.NFT;
  if (lower.includes('contract')) return TransactionCategory.CONTRACT;
  return TransactionCategory.OTHER;
}

export function calculateCategoryStats(transactions: Transaction[]): CategoryStats[] {
  const counts = new Map<TransactionCategory, number>();
  
  transactions.forEach(tx => {
    counts.set(tx.category, (counts.get(tx.category) || 0) + 1);
  });

  const total = transactions.length || 1;
  
  return Object.values(TransactionCategory).map(category => ({
    category,
    count: counts.get(category) || 0,
    percentage: ((counts.get(category) || 0) / total) * 100,
  }));
}

export function exportToCSV(transactions: Transaction[], startDate?: Date, endDate?: Date): string {
  const headers = ['ID', 'Category', 'Type', 'Timestamp', 'Account', 'Amount', 'Asset', 'From', 'To'];
  const rows = transactions.map(tx => [
    tx.id,
    tx.category,
    tx.type,
    tx.timestamp,
    tx.account,
    tx.amount || '',
    tx.asset || '',
    tx.from || '',
    tx.to || '',
  ]);

  return [headers, ...rows].map(row => row.join(',')).join('\n');
}

export function generateExportFilename(format: 'csv' | 'pdf', startDate?: Date, endDate?: Date): string {
  const dateStr = startDate && endDate
    ? `${startDate.toISOString().split('T')[0]}_to_${endDate.toISOString().split('T')[0]}`
    : new Date().toISOString().split('T')[0];
  
  return `transactions_${dateStr}.${format}`;
}
