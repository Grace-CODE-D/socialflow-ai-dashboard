import { Transaction } from '../types/transaction';

export interface SearchResult {
  transaction: Transaction;
  matchType: 'hash' | 'address' | 'memo';
  matchedText: string;
}

export function searchTransactions(
  transactions: Transaction[],
  query: string
): SearchResult[] {
  if (!query.trim()) return [];

  const lowerQuery = query.toLowerCase();
  const results: SearchResult[] = [];

  transactions.forEach(tx => {
    // Search by hash (ID)
    if (tx.id.toLowerCase().includes(lowerQuery)) {
      results.push({ transaction: tx, matchType: 'hash', matchedText: tx.id });
    }
    // Search by recipient address
    else if (tx.to?.toLowerCase().includes(lowerQuery)) {
      results.push({ transaction: tx, matchType: 'address', matchedText: tx.to });
    }
    // Search by sender address
    else if (tx.from?.toLowerCase().includes(lowerQuery)) {
      results.push({ transaction: tx, matchType: 'address', matchedText: tx.from });
    }
    // Search by memo
    else if (tx.data?.memo?.toLowerCase().includes(lowerQuery)) {
      results.push({ transaction: tx, matchType: 'memo', matchedText: tx.data.memo });
    }
  });

  return results;
}

export function generateSearchSuggestions(transactions: Transaction[]): string[] {
  const suggestions = new Set<string>();
  
  transactions.slice(0, 50).forEach(tx => {
    if (tx.to) suggestions.add(tx.to.slice(0, 8) + '...');
    if (tx.from) suggestions.add(tx.from.slice(0, 8) + '...');
    if (tx.data?.memo) suggestions.add(tx.data.memo);
  });

  return Array.from(suggestions).slice(0, 10);
}

export function highlightMatch(text: string, query: string): string {
  if (!query) return text;
  const regex = new RegExp(`(${query})`, 'gi');
  return text.replace(regex, '<mark class="bg-yellow-400 text-black">$1</mark>');
}
