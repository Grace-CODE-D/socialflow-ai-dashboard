import { useState, useEffect, useRef, useCallback } from 'react';
import { Card } from '../ui/Card';

export enum TransactionStatus {
  CONFIRMED = 'confirmed',
  PENDING = 'pending',
  FAILED = 'failed',
}

export enum TransactionType {
  PAYMENT = 'payment',
  TOKEN = 'token',
  NFT = 'nft',
  CONTRACT = 'contract',
}

export interface BlockchainTransaction {
  id: string;
  type: TransactionType;
  amount?: string;
  asset: string;
  timestamp: string;
  status: TransactionStatus;
  from?: string;
  to?: string;
  memo?: string;
  fee?: string;
}

interface FilterPreferences {
  dateFrom: string;
  dateTo: string;
  type: TransactionType | 'all';
  asset: string;
  status: TransactionStatus | 'all';
}

const STATUS_COLORS = {
  [TransactionStatus.CONFIRMED]: 'bg-green-500',
  [TransactionStatus.PENDING]: 'bg-yellow-500',
  [TransactionStatus.FAILED]: 'bg-red-500',
};

const STATUS_LABELS = {
  [TransactionStatus.CONFIRMED]: '✓ Confirmed',
  [TransactionStatus.PENDING]: '⏳ Pending',
  [TransactionStatus.FAILED]: '✗ Failed',
};

const TYPE_LABELS = {
  [TransactionType.PAYMENT]: '💰 Payment',
  [TransactionType.TOKEN]: '🪙 Token',
  [TransactionType.NFT]: '🖼️ NFT',
  [TransactionType.CONTRACT]: '⚙️ Contract',
};

export function TransactionHistoryComponent() {
  const [transactions, setTransactions] = useState<BlockchainTransaction[]>([]);
  const [displayedTxs, setDisplayedTxs] = useState<BlockchainTransaction[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  
  const [filters, setFilters] = useState<FilterPreferences>({
    dateFrom: '',
    dateTo: '',
    type: 'all',
    asset: 'all',
    status: 'all',
  });

  const ITEMS_PER_PAGE = 20;

  // Load filter preferences from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('txFilterPreferences');
    if (saved) {
      try {
        setFilters(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to load filter preferences');
      }
    }
  }, []);

  // Save filter preferences
  useEffect(() => {
    localStorage.setItem('txFilterPreferences', JSON.stringify(filters));
  }, [filters]);

  // Mock data - replace with actual blockchain data
  useEffect(() => {
    const mockTxs: BlockchainTransaction[] = Array.from({ length: 100 }, (_, i) => ({
      id: `tx_${i}_${Date.now()}`,
      type: [TransactionType.PAYMENT, TransactionType.TOKEN, TransactionType.NFT, TransactionType.CONTRACT][i % 4],
      amount: (Math.random() * 1000).toFixed(2),
      asset: ['XLM', 'USDC', 'BTC', 'ETH'][i % 4],
      timestamp: new Date(Date.now() - i * 3600000).toISOString(),
      status: [TransactionStatus.CONFIRMED, TransactionStatus.PENDING, TransactionStatus.FAILED][i % 3],
      from: `G${Math.random().toString(36).substring(2, 15).toUpperCase()}`,
      to: `G${Math.random().toString(36).substring(2, 15).toUpperCase()}`,
      memo: i % 3 === 0 ? `Memo ${i}` : undefined,
      fee: '100',
    }));
    setTransactions(mockTxs);
  }, []);

  // Apply filters
  const filteredTxs = transactions.filter(tx => {
    if (filters.dateFrom && new Date(tx.timestamp) < new Date(filters.dateFrom)) return false;
    if (filters.dateTo && new Date(tx.timestamp) > new Date(filters.dateTo)) return false;
    if (filters.type !== 'all' && tx.type !== filters.type) return false;
    if (filters.asset !== 'all' && tx.asset !== filters.asset) return false;
    if (filters.status !== 'all' && tx.status !== filters.status) return false;
    return true;
  });

  // Pagination
  useEffect(() => {
    const start = 0;
    const end = page * ITEMS_PER_PAGE;
    setDisplayedTxs(filteredTxs.slice(start, end));
    setHasMore(end < filteredTxs.length);
  }, [page, filteredTxs]);

  // Infinite scroll
  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      setLoading(true);
      setTimeout(() => {
        setPage(prev => prev + 1);
        setLoading(false);
      }, 500);
    }
  }, [loading, hasMore]);

  useEffect(() => {
    const currentRef = loadMoreRef.current;
    
    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );

    if (currentRef) {
      observerRef.current.observe(currentRef);
    }

    return () => {
      if (observerRef.current && currentRef) {
        observerRef.current.unobserve(currentRef);
      }
    };
  }, [loadMore]);

  const uniqueAssets = ['all', ...new Set(transactions.map(tx => tx.asset))];

  return (
    <div className="space-y-4 p-6">
      <Card className="p-6">
        <h2 className="text-xl font-bold mb-4">Transaction History</h2>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <div>
            <label className="block text-sm mb-2">From Date</label>
            <input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-sm"
            />
          </div>

          <div>
            <label className="block text-sm mb-2">To Date</label>
            <input
              type="date"
              value={filters.dateTo}
              onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-sm"
            />
          </div>

          <div>
            <label className="block text-sm mb-2">Type</label>
            <select
              value={filters.type}
              onChange={(e) => setFilters({ ...filters, type: e.target.value as any })}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-sm"
            >
              <option value="all">All Types</option>
              {Object.entries(TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm mb-2">Asset</label>
            <select
              value={filters.asset}
              onChange={(e) => setFilters({ ...filters, asset: e.target.value })}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-sm"
            >
              {uniqueAssets.map(asset => (
                <option key={asset} value={asset}>
                  {asset === 'all' ? 'All Assets' : asset}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm mb-2">Status</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value as any })}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-sm"
            >
              <option value="all">All Status</option>
              {Object.entries(STATUS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Results count */}
        <div className="text-sm text-gray-400 mb-4">
          Showing {displayedTxs.length} of {filteredTxs.length} transactions
        </div>

        {/* Transaction List */}
        <div className="space-y-2">
          {displayedTxs.length === 0 ? (
            <p className="text-gray-400 text-center py-8">No transactions found</p>
          ) : (
            displayedTxs.map((tx) => (
              <div key={tx.id} className="p-4 bg-gray-800 rounded border border-gray-700">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-3">
                    <span className="text-sm">{TYPE_LABELS[tx.type]}</span>
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${STATUS_COLORS[tx.status]}`} />
                      <span className="text-xs text-gray-400">{STATUS_LABELS[tx.status]}</span>
                    </div>
                  </div>
                  <span className="text-xs text-gray-400">
                    {new Date(tx.timestamp).toLocaleString()}
                  </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                  {tx.amount && (
                    <div>
                      <span className="text-gray-400">Amount:</span>{' '}
                      <span className="text-green-400">{tx.amount}</span>
                    </div>
                  )}
                  <div>
                    <span className="text-gray-400">Asset:</span>{' '}
                    <span className="font-semibold">{tx.asset}</span>
                  </div>
                  {tx.from && (
                    <div>
                      <span className="text-gray-400">From:</span>{' '}
                      <span className="font-mono text-xs">{tx.from.slice(0, 8)}...</span>
                    </div>
                  )}
                  {tx.to && (
                    <div>
                      <span className="text-gray-400">To:</span>{' '}
                      <span className="font-mono text-xs">{tx.to.slice(0, 8)}...</span>
                    </div>
                  )}
                </div>

                {tx.memo && (
                  <div className="mt-2 text-xs text-gray-400">
                    Memo: {tx.memo}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Infinite scroll trigger */}
        {hasMore && (
          <div ref={loadMoreRef} className="py-4 text-center">
            {loading && <span className="text-gray-400">Loading more...</span>}
          </div>
        )}

        {!hasMore && displayedTxs.length > 0 && (
          <div className="py-4 text-center text-gray-400 text-sm">
            No more transactions
          </div>
        )}
      </Card>
    </div>
  );
}
