import React, { useState, useEffect, useCallback } from "react";
import { ViewProps } from "../../types";
import {
  getLocalTransactions,
  syncTransactions,
  filterTransactionsByType,
  Transaction,
  getStellarExpertUrl,
} from "../../services/blockchainService";
import { ExternalLink, RefreshCw, Filter, Search, Loader2 } from "lucide-react";

// Demo address for testing (Stellar testnet)
const DEMO_ADDRESS = "GAIH3ULLFQ4DGSECF2AR555KZ4MNDLV5ZBJQB7IAGQ5IJ65H4XUN7Q7U";

export const TransactionHistory: React.FC<ViewProps> = ({
  onNavigate: _onNavigate,
}) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<
    Transaction[]
  >([]);
  const [filterType, setFilterType] = useState<"all" | "payment" | "mint">(
    "all",
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Load transactions from local DB on mount
  const loadTransactions = useCallback(async () => {
    try {
      const localTxs = await getLocalTransactions();
      setTransactions(localTxs);
      setFilteredTransactions(localTxs);
    } catch (error) {
      console.error("Error loading transactions:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Sync transactions from Horizon
  const handleSync = async () => {
    setIsSyncing(true);
    try {
      await syncTransactions(DEMO_ADDRESS);
      await loadTransactions();
    } catch (error) {
      console.error("Error syncing transactions:", error);
    } finally {
      setIsSyncing(false);
    }
  };

  // Initial load
  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  // Handle filter change
  useEffect(() => {
    const applyFilter = async () => {
      let filtered = transactions;

      // Apply type filter
      if (filterType !== "all") {
        filtered = await filterTransactionsByType(filterType);
      } else {
        filtered = transactions;
      }

      // Apply search filter
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        filtered = filtered.filter(
          (tx) =>
            tx.hash.toLowerCase().includes(term) ||
            tx.asset.toLowerCase().includes(term) ||
            tx.amount.toLowerCase().includes(term),
        );
      }

      setFilteredTransactions(filtered);
    };

    applyFilter();
  }, [filterType, searchTerm, transactions]);

  // Format timestamp
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Format amount
  const formatAmount = (amount: string, asset: string) => {
    const num = parseFloat(amount);
    if (isNaN(num)) return `0 ${asset}`;
    return `${num.toLocaleString(undefined, { maximumFractionDigits: 7 })} ${asset}`;
  };

  // Get status badge class
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "success":
        return "bg-green-500/20 text-green-400 border-green-500/30";
      case "pending":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      case "failed":
        return "bg-red-500/20 text-red-400 border-red-500/30";
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  // Get type badge class
  const getTypeBadge = (type: string) => {
    switch (type) {
      case "payment":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      case "mint":
        return "bg-purple-500/20 text-purple-400 border-purple-500/30";
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  return (
    <div className="p-7 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Transaction History</h2>
          <p className="text-gray-400 text-sm mt-1">
            View and track all blockchain transactions
          </p>
        </div>
        <button
          onClick={handleSync}
          disabled={isSyncing}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSyncing ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4" />
          )}
          {isSyncing ? "Syncing..." : "Sync from Horizon"}
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by hash, asset, or amount..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>

        {/* Filter buttons */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <div className="flex bg-gray-800/50 rounded-lg p-1 border border-gray-700">
            <button
              onClick={() => setFilterType("all")}
              className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
                filterType === "all"
                  ? "bg-indigo-600 text-white"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilterType("payment")}
              className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
                filterType === "payment"
                  ? "bg-indigo-600 text-white"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              Payments
            </button>
            <button
              onClick={() => setFilterType("mint")}
              className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
                filterType === "mint"
                  ? "bg-indigo-600 text-white"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              Mints
            </button>
          </div>
        </div>
      </div>

      {/* Transaction Table */}
      <div className="bg-gray-900/50 rounded-xl border border-gray-800 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center p-12">
            <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mb-4">
              <RefreshCw className="w-8 h-8 text-gray-500" />
            </div>
            <p className="text-gray-400 text-lg">No transactions found</p>
            <p className="text-gray-500 text-sm mt-1">
              {transactions.length === 0
                ? 'Click "Sync from Horizon" to fetch transactions'
                : "Try adjusting your filters"}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="text-left px-6 py-4 text-gray-400 font-medium text-sm">
                    Hash
                  </th>
                  <th className="text-left px-6 py-4 text-gray-400 font-medium text-sm">
                    Type
                  </th>
                  <th className="text-left px-6 py-4 text-gray-400 font-medium text-sm">
                    Amount
                  </th>
                  <th className="text-left px-6 py-4 text-gray-400 font-medium text-sm">
                    Asset
                  </th>
                  <th className="text-left px-6 py-4 text-gray-400 font-medium text-sm">
                    Timestamp
                  </th>
                  <th className="text-left px-6 py-4 text-gray-400 font-medium text-sm">
                    Status
                  </th>
                  <th className="text-left px-6 py-4 text-gray-400 font-medium text-sm">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.map((tx, index) => (
                  <tr
                    key={tx.hash || index}
                    className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="max-w-[150px]">
                        <span className="text-indigo-400 font-mono text-sm truncate block">
                          {tx.hash.substring(0, 12)}...
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-medium border ${getTypeBadge(tx.type)}`}
                      >
                        {tx.type.charAt(0).toUpperCase() + tx.type.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-white font-medium">
                        {formatAmount(tx.amount, tx.asset)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-gray-300">{tx.asset}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-gray-400 text-sm">
                        {formatTimestamp(tx.timestamp)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusBadge(tx.status)}`}
                      >
                        {tx.status.charAt(0).toUpperCase() + tx.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <a
                        href={getStellarExpertUrl(tx.hash)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-indigo-400 hover:text-indigo-300 transition-colors text-sm"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        View on Stellar Expert
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Stats Footer */}
      <div className="flex items-center justify-between text-sm text-gray-500">
        <span>
          Showing {filteredTransactions.length} of {transactions.length}{" "}
          transactions
        </span>
        <span>
          Source:{" "}
          {transactions.length > 0
            ? "Local Database (IndexedDB)"
            : "Not synced yet"}
        </span>
      </div>
    </div>
  );
};

export default TransactionHistory;
