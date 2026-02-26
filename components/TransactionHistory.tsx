import { useState, useEffect } from 'react';
import { Card } from './ui/Card';
import { Transaction, TransactionCategory } from '../src/types/transaction';
import { 
  autoCategorize, 
  calculateCategoryStats, 
  exportToCSV, 
  generateExportFilename,
  CATEGORY_COLORS,
  CATEGORY_LABELS 
} from '../src/utils/transactionUtils';
import { searchTransactions, generateSearchSuggestions, highlightMatch } from '../src/utils/searchUtils';
import { TransactionDetailModal } from './TransactionDetailModal';

export function TransactionHistory() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTxs, setFilteredTxs] = useState<Transaction[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<TransactionCategory | 'all'>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [exporting, setExporting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);

  useEffect(() => {
    if (!window.electronAPI?.blockchain) return;

    const unsubscribe = window.electronAPI.blockchain.onEvents((events) => {
      const newTxs = events.map(event => ({
        id: event.id,
        type: event.type,
        category: autoCategorize(event.type),
        timestamp: event.timestamp,
        account: event.account,
        amount: event.data?.amount,
        asset: event.data?.asset,
        from: event.data?.from,
        to: event.data?.to,
        data: event.data,
      }));
      
      setTransactions(prev => [...newTxs, ...prev]);
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    let filtered = [...transactions];

    // Apply search filter
    if (searchQuery.trim()) {
      const searchResults = searchTransactions(filtered, searchQuery);
      filtered = searchResults.map(r => r.transaction);
    }

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(tx => tx.category === selectedCategory);
    }

    if (startDate) {
      filtered = filtered.filter(tx => new Date(tx.timestamp) >= new Date(startDate));
    }

    if (endDate) {
      filtered = filtered.filter(tx => new Date(tx.timestamp) <= new Date(endDate));
    }

    setFilteredTxs(filtered);
  }, [transactions, selectedCategory, startDate, endDate, searchQuery]);

  const suggestions = generateSearchSuggestions(transactions);
  const stats = calculateCategoryStats(transactions);

  const handleCategoryChange = (txId: string, category: TransactionCategory) => {
    setTransactions(prev => prev.map(tx => 
      tx.id === txId ? { ...tx, category } : tx
    ));
  };

  const handleExportCSV = async () => {
    setExporting(true);
    const csv = exportToCSV(
      filteredTxs, 
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined
    );
    const filename = generateExportFilename('csv', 
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined
    );
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    
    setTimeout(() => setExporting(false), 500);
  };

  const handleExportPDF = async () => {
    setExporting(true);
    
    // Simple PDF generation using print
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      const html = `
        <html>
          <head>
            <title>Transaction History</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; }
              h1 { color: #333; }
              table { width: 100%; border-collapse: collapse; margin-top: 20px; }
              th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
              th { background-color: #f2f2f2; }
              .category { display: inline-block; padding: 2px 8px; border-radius: 4px; color: white; font-size: 12px; }
            </style>
          </head>
          <body>
            <h1>Transaction History</h1>
            <p>Generated: ${new Date().toLocaleString()}</p>
            ${startDate ? `<p>From: ${startDate}</p>` : ''}
            ${endDate ? `<p>To: ${endDate}</p>` : ''}
            <p>Total Transactions: ${filteredTxs.length}</p>
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Category</th>
                  <th>Type</th>
                  <th>Timestamp</th>
                  <th>Amount</th>
                  <th>Asset</th>
                </tr>
              </thead>
              <tbody>
                ${filteredTxs.map(tx => `
                  <tr>
                    <td>${tx.id.slice(0, 8)}...</td>
                    <td>${tx.category}</td>
                    <td>${tx.type}</td>
                    <td>${new Date(tx.timestamp).toLocaleString()}</td>
                    <td>${tx.amount || '-'}</td>
                    <td>${tx.asset || '-'}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </body>
        </html>
      `;
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.print();
    }
    
    setTimeout(() => setExporting(false), 500);
  };

  return (
    <div className="space-y-4 p-6">
      <Card className="p-6">
        <h2 className="text-xl font-bold mb-4">Transaction History & Audit Trail</h2>

        {/* Category Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-6">
          {stats.map(stat => (
            <div key={stat.category} className="p-3 bg-gray-800 rounded">
              <div className="flex items-center gap-2 mb-1">
                <div className={`w-3 h-3 rounded ${CATEGORY_COLORS[stat.category]}`} />
                <span className="text-xs">{CATEGORY_LABELS[stat.category]}</span>
              </div>
              <div className="text-lg font-bold">{stat.count}</div>
              <div className="text-xs text-gray-400">{stat.percentage.toFixed(1)}%</div>
            </div>
          ))}
        </div>

        {/* Search */}
        <div className="mb-4 relative">
          <label className="block text-sm mb-2">🔍 Search Transactions</label>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            placeholder="Search by hash, address, or memo..."
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded focus:border-blue-500 focus:outline-none"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-9 text-gray-400 hover:text-white"
            >
              ✕
            </button>
          )}
          {showSuggestions && suggestions.length > 0 && searchQuery.length < 3 && (
            <div className="absolute z-10 w-full mt-1 bg-gray-800 border border-gray-700 rounded shadow-lg">
              <div className="text-xs text-gray-400 px-3 py-2 border-b border-gray-700">Recent suggestions:</div>
              {suggestions.map((suggestion, idx) => (
                <div
                  key={idx}
                  onClick={() => setSearchQuery(suggestion)}
                  className="px-3 py-2 hover:bg-gray-700 cursor-pointer text-sm"
                >
                  {suggestion}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <div>
            <label className="block text-sm mb-2">Category</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value as any)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded"
            >
              <option value="all">All Categories</option>
              {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm mb-2">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded"
            />
          </div>

          <div>
            <label className="block text-sm mb-2">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded"
            />
          </div>

          <div className="flex items-end gap-2">
            <button
              onClick={handleExportCSV}
              disabled={exporting || filteredTxs.length === 0}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 rounded text-sm"
            >
              {exporting ? '⏳' : '📊'} CSV
            </button>
            <button
              onClick={handleExportPDF}
              disabled={exporting || filteredTxs.length === 0}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 rounded text-sm"
            >
              {exporting ? '⏳' : '📄'} PDF
            </button>
          </div>
        </div>

        {/* Transaction List */}
        <div className="space-y-2 max-h-[600px] overflow-y-auto">
          <div className="text-sm text-gray-400 mb-2">
            Showing {filteredTxs.length} of {transactions.length} transactions
          </div>
          
          {filteredTxs.length === 0 ? (
            <p className="text-gray-400 text-center py-8">No transactions found</p>
          ) : (
            filteredTxs.map((tx) => (
              <div 
                key={tx.id} 
                className="p-4 bg-gray-800 rounded border border-gray-700 hover:border-blue-500 cursor-pointer transition-colors"
                onClick={() => setSelectedTx(tx)}
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${CATEGORY_COLORS[tx.category]}`} />
                    <span className="font-mono text-sm text-blue-400">{tx.type}</span>
                  </div>
                  <span className="text-xs text-gray-400">
                    {new Date(tx.timestamp).toLocaleString()}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-sm mb-2">
                  {tx.amount && (
                    <div>
                      <span className="text-gray-400">Amount:</span>{' '}
                      <span className="text-green-400">{tx.amount} {tx.asset}</span>
                    </div>
                  )}
                  {tx.from && (
                    <div>
                      <span className="text-gray-400">From:</span>{' '}
                      <span 
                        className="font-mono text-xs"
                        dangerouslySetInnerHTML={{ 
                          __html: highlightMatch(tx.from.slice(0, 8) + '...', searchQuery) 
                        }}
                      />
                    </div>
                  )}
                  {tx.to && (
                    <div>
                      <span className="text-gray-400">To:</span>{' '}
                      <span 
                        className="font-mono text-xs"
                        dangerouslySetInnerHTML={{ 
                          __html: highlightMatch(tx.to.slice(0, 8) + '...', searchQuery) 
                        }}
                      />
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <label className="text-xs text-gray-400">Category:</label>
                  <select
                    value={tx.category}
                    onChange={(e) => {
                      e.stopPropagation();
                      handleCategoryChange(tx.id, e.target.value as TransactionCategory);
                    }}
                    onClick={(e) => e.stopPropagation()}
                    className="px-2 py-1 bg-gray-700 border border-gray-600 rounded text-xs"
                  >
                    {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>

      <TransactionDetailModal transaction={selectedTx} onClose={() => setSelectedTx(null)} />
    </div>
  );
}
