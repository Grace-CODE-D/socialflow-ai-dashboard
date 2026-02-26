/**
 * Staging Dock Component
 * Requirements: 4.1, 10.1, 2.4, 4.4, 20.1, 20.2, 20.3
 */

import React, { useState, useCallback, useEffect, useRef } from "react";
import {
  ChevronDown,
  ChevronUp,
  X,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Send,
  Trash2,
  GripVertical,
  Zap,
  Wallet,
  Bell,
  Volume2,
  VolumeX,
  RefreshCw,
  Sparkles,
  FileText,
  Link,
  CreditCard,
  ArrowLeftRight,
  Image,
} from "lucide-react";
import { useTransactionQueue } from "../src/hooks/useTransactionQueue";
import { useDockNotifications } from "../src/hooks/useDockNotifications";
import type {
  PendingTransaction,
  TransactionStatus,
  TransactionType,
  AuthorizationProgress,
  TransactionSummary,
} from "../src/types/stagingDock";

/**
 * Transaction type icons
 */
const getTransactionTypeIcon = (type: TransactionType) => {
  switch (type) {
    case "post_publish":
      return <Send size={14} />;
    case "trustline":
      return <Link size={14} />;
    case "payment":
      return <CreditCard size={14} />;
    case "swap":
      return <ArrowLeftRight size={14} />;
    case "nft_mint":
      return <Image size={14} />;
    default:
      return <FileText size={14} />;
  }
};

/**
 * Status color mapping
 */
const getStatusColor = (status: TransactionStatus): string => {
  switch (status) {
    case "pending":
      return "bg-gray-500";
    case "signing":
      return "bg-yellow-500";
    case "dispatched":
      return "bg-blue-500";
    case "confirmed":
      return "bg-green-500";
    case "failed":
      return "bg-red-500";
    default:
      return "bg-gray-500";
  }
};

/**
 * Status icon mapping
 */
const getStatusIcon = (status: TransactionStatus) => {
  switch (status) {
    case "pending":
      return <Clock size={12} />;
    case "signing":
      return <Zap size={12} className="animate-pulse" />;
    case "dispatched":
      return <Send size={12} className="animate-pulse" />;
    case "confirmed":
      return <CheckCircle2 size={12} />;
    case "failed":
      return <AlertCircle size={12} />;
    default:
      return <Clock size={12} />;
  }
};

/**
 * Priority badge component
 */
const PriorityBadge = ({ priority }: { priority: string }) => {
  const colors = {
    urgent: "bg-red-500/20 text-red-400 border-red-500/30",
    high: "bg-orange-500/20 text-orange-400 border-orange-500/30",
    normal: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    low: "bg-gray-500/20 text-gray-400 border-gray-500/30",
  };

  return (
    <span
      className={`text-[10px] px-1.5 py-0.5 rounded border ${colors[priority as keyof typeof colors] || colors.normal}`}
    >
      {priority.toUpperCase()}
    </span>
  );
};

/**
 * Transaction item component
 */
const TransactionItem = ({
  transaction,
  onRemove,
  onSelect,
  isSelected,
  isDragging,
  dragHandleProps,
}: {
  transaction: PendingTransaction;
  onRemove: (id: string) => void;
  onSelect: (id: string) => void;
  isSelected: boolean;
  isDragging: boolean;
  dragHandleProps: any;
}) => {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <div
      className={`
        relative group rounded-xl border transition-all duration-200
        ${isDragging ? "opacity-50 scale-95" : ""}
        ${isSelected ? "border-primary-blue bg-primary-blue/10" : "border-dark-border bg-dark-surface hover:border-dark-border/80"}
      `}
    >
      <div className="flex items-center gap-3 p-3">
        {/* Drag Handle */}
        <div
          {...dragHandleProps}
          className="cursor-grab active:cursor-grabbing text-gray-500 hover:text-gray-300"
        >
          <GripVertical size={16} />
        </div>

        {/* Type Icon */}
        <div
          className={`
          w-8 h-8 rounded-lg flex items-center justify-center shrink-0
          ${
            transaction.status === "confirmed"
              ? "bg-green-500/20 text-green-400"
              : transaction.status === "failed"
                ? "bg-red-500/20 text-red-400"
                : "bg-primary-blue/20 text-primary-blue"
          }
        `}
        >
          {getTransactionTypeIcon(transaction.type)}
        </div>

        {/* Content */}
        <div
          className="flex-1 min-w-0"
          onClick={() => setShowDetails(!showDetails)}
        >
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-white truncate">
              {transaction.title}
            </span>
            <PriorityBadge priority={transaction.priority} />
          </div>
          <p className="text-xs text-gray-subtext truncate">
            {transaction.description}
          </p>
        </div>

        {/* Status */}
        <div
          className={`w-6 h-6 rounded-full flex items-center justify-center ${getStatusColor(transaction.status)} text-white`}
        >
          {getStatusIcon(transaction.status)}
        </div>

        {/* Actions */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove(transaction.id);
          }}
          className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition-all"
        >
          <X size={14} />
        </button>
      </div>

      {/* Expanded Details */}
      {showDetails && (
        <div className="px-3 pb-3 pt-0 border-t border-dark-border/50 mt-0">
          <div className="grid grid-cols-2 gap-2 mt-2 text-xs">
            <div>
              <span className="text-gray-subtext">ID:</span>
              <span className="text-gray-400 ml-1 font-mono">
                {transaction.id.slice(0, 12)}...
              </span>
            </div>
            <div>
              <span className="text-gray-subtext">Fee:</span>
              <span className="text-gray-400 ml-1">
                {transaction.fee || transaction.estimatedGas || 0} XLM
              </span>
            </div>
            <div>
              <span className="text-gray-subtext">Created:</span>
              <span className="text-gray-400 ml-1">
                {new Date(transaction.createdAt).toLocaleTimeString()}
              </span>
            </div>
            {transaction.postId && (
              <div>
                <span className="text-gray-subtext">Post:</span>
                <span className="text-gray-400 ml-1">{transaction.postId}</span>
              </div>
            )}
          </div>
          {transaction.error && (
            <div className="mt-2 p-2 bg-red-500/10 rounded-lg text-red-400 text-xs">
              {transaction.error}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

/**
 * Authorization Summary Modal
 */
const AuthorizationSummary = ({
  summary,
  onAuthorize,
  onCancel,
  isProcessing,
  progress,
}: {
  summary: TransactionSummary;
  onAuthorize: () => void;
  onCancel: () => void;
  isProcessing: boolean;
  progress: AuthorizationProgress | null;
}) => {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-dark-surface border border-dark-border rounded-2xl w-full max-w-md overflow-hidden animate-fade-in">
        {/* Header */}
        <div className="p-4 border-b border-dark-border">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <Wallet size={20} className="text-primary-blue" />
              Authorize Transactions
            </h3>
            <button
              onClick={onCancel}
              disabled={isProcessing}
              className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Summary Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-dark-border/30 rounded-xl p-3 text-center">
              <div className="text-xl font-bold text-white">
                {summary.totalTransactions}
              </div>
              <div className="text-xs text-gray-subtext">Transactions</div>
            </div>
            <div className="bg-dark-border/30 rounded-xl p-3 text-center">
              <div className="text-xl font-bold text-white">
                {summary.totalGroups}
              </div>
              <div className="text-xs text-gray-subtext">Groups</div>
            </div>
            <div className="bg-dark-border/30 rounded-xl p-3 text-center">
              <div className="text-xl font-bold text-primary-teal">
                {summary.totalFee}
              </div>
              <div className="text-xs text-gray-subtext">Total XLM</div>
            </div>
          </div>

          {/* Progress (when processing) */}
          {isProcessing && progress && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-subtext">Processing...</span>
                <span className="text-white">
                  {progress.current}/{progress.total}
                </span>
              </div>
              <div className="h-2 bg-dark-border rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary-blue transition-all duration-300"
                  style={{
                    width: `${(progress.current / progress.total) * 100}%`,
                  }}
                />
              </div>
            </div>
          )}

          {/* Transaction List Toggle */}
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="w-full p-2 rounded-lg bg-dark-border/30 hover:bg-dark-border/50 text-sm text-gray-subtext flex items-center justify-center gap-2"
          >
            {showDetails ? "Hide" : "Show"} Transaction Details
            {showDetails ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>

          {/* Detailed List */}
          {showDetails && (
            <div className="max-h-40 overflow-y-auto space-y-2">
              {summary.transactions.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between p-2 bg-dark-border/20 rounded-lg text-sm"
                >
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-2 h-2 rounded-full ${getStatusColor(tx.status)}`}
                    />
                    <span className="text-white truncate max-w-[200px]">
                      {tx.title}
                    </span>
                  </div>
                  <span className="text-gray-subtext">{tx.fee || 0} XLM</span>
                </div>
              ))}
            </div>
          )}

          {/* Estimated Time */}
          <div className="flex items-center gap-2 text-sm text-gray-subtext">
            <Clock size={14} />
            <span>Estimated time: ~{summary.estimatedTime} seconds</span>
          </div>
        </div>

        {/* Actions */}
        <div className="p-4 border-t border-dark-border flex gap-3">
          <button
            onClick={onCancel}
            disabled={isProcessing}
            className="flex-1 py-2.5 rounded-xl border border-dark-border text-gray-subtext hover:bg-white/5 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onAuthorize}
            disabled={isProcessing}
            className="flex-1 py-2.5 rounded-xl bg-primary-blue text-white font-medium hover:bg-primary-blue/90 transition-colors flex items-center justify-center gap-2"
          >
            {isProcessing ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Signing...
              </>
            ) : (
              <>
                <Zap size={16} />
                Authorize All
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

/**
 * Notification Toast
 */
const NotificationToast = ({
  notification,
  onDismiss,
}: {
  notification: { id: string; title: string; message: string; type: string };
  onDismiss: () => void;
}) => {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 4000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  const icons = {
    item_added: <Send size={16} className="text-primary-blue" />,
    signature_required: <Zap size={16} className="text-yellow-400" />,
    transaction_confirmed: (
      <CheckCircle2 size={16} className="text-green-400" />
    ),
    transaction_failed: <AlertCircle size={16} className="text-red-400" />,
    queue_processing: (
      <Loader2 size={16} className="text-primary-blue animate-spin" />
    ),
  };

  return (
    <div className="bg-dark-surface border border-dark-border rounded-xl p-3 shadow-lg animate-slide-up flex items-start gap-3 min-w-[280px]">
      <div className="w-8 h-8 rounded-lg bg-dark-border/50 flex items-center justify-center shrink-0">
        {icons[notification.type as keyof typeof icons] || <Bell size={16} />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white">{notification.title}</p>
        <p className="text-xs text-gray-subtext truncate">
          {notification.message}
        </p>
      </div>
      <button onClick={onDismiss} className="text-gray-500 hover:text-white">
        <X size={14} />
      </button>
    </div>
  );
};

/**
 * Main StagingDock Component
 */
export const StagingDock: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedTransactions, setSelectedTransactions] = useState<Set<string>>(
    new Set(),
  );
  const [showAuthorization, setShowAuthorization] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState<AuthorizationProgress | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [toasts, setToasts] = useState<
    Array<{ id: string; title: string; message: string; type: string }>
  >([]);
  const dockRef = useRef<HTMLDivElement>(null);

  const {
    transactions,
    queueStatus,
    isLoading,
    addTransaction,
    updateTransactionStatus,
    removeTransaction,
    reorderTransactions,
    getTotalEstimatedFees,
  } = useTransactionQueue();

  const {
    notifications,
    unreadCount,
    soundEnabled,
    soundPreferences,
    addNotification,
    markAllAsRead,
    toggleSound,
    updateSoundPreferences,
  } = useDockNotifications();

  // Add toast notification
  const showToast = useCallback(
    (title: string, message: string, type: string) => {
      const id = `${Date.now()}-${Math.random()}`;
      setToasts((prev) => [...prev, { id, title, message, type }]);
    },
    [],
  );

  // Remove toast
  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Handle transaction selection
  const handleSelectTransaction = useCallback((id: string) => {
    setSelectedTransactions((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  }, []);

  // Handle remove transaction
  const handleRemoveTransaction = useCallback(
    async (id: string) => {
      await removeTransaction(id);
      showToast(
        "Transaction Removed",
        "Transaction has been removed from the queue",
        "item_added",
      );
    },
    [removeTransaction, showToast],
  );

  // Handle drag start
  const handleDragStart = useCallback((index: number) => {
    setDraggedIndex(index);
  }, []);

  // Handle drag over
  const handleDragOver = useCallback(
    (e: React.DragEvent, index: number) => {
      e.preventDefault();
      if (draggedIndex !== null && draggedIndex !== index) {
        reorderTransactions(draggedIndex, index);
        setDraggedIndex(index);
      }
    },
    [draggedIndex, reorderTransactions],
  );

  // Handle drag end
  const handleDragEnd = useCallback(() => {
    setDraggedIndex(null);
  }, []);

  // Calculate summary
  const getSummary = useCallback((): TransactionSummary => {
    const selected =
      selectedTransactions.size > 0
        ? transactions.filter((t) => selectedTransactions.has(t.id))
        : transactions;

    return {
      totalTransactions: selected.length,
      totalGroups: 1,
      totalFee: selected.reduce(
        (sum, t) => sum + (t.fee || t.estimatedGas || 0),
        0,
      ),
      estimatedTime: selected.length * 3,
      transactions: selected,
    };
  }, [transactions, selectedTransactions]);

  // Handle authorize all
  const handleAuthorizeAll = useCallback(async () => {
    if (selectedTransactions.size === 0 && transactions.length === 0) return;

    setShowAuthorization(true);
    setIsProcessing(true);

    const summary = getSummary();
    const progressState: AuthorizationProgress = {
      total: summary.totalTransactions,
      current: 0,
      currentTransactionId: null,
      failed: [],
      completed: [],
    };
    setProgress(progressState);

    // Simulate processing each transaction
    for (let i = 0; i < summary.transactions.length; i++) {
      const tx = summary.transactions[i];

      // Update progress
      progressState.current = i + 1;
      progressState.currentTransactionId = tx.id;
      setProgress({ ...progressState });

      // Optimistic: set to signing
      await updateTransactionStatus(tx.id, "signing");

      // Simulate signing delay
      await new Promise((resolve) => setTimeout(resolve, 800));

      // Simulate success/failure (90% success rate for demo)
      if (Math.random() > 0.1) {
        // Optimistic update to dispatched
        await updateTransactionStatus(tx.id, "dispatched");
        progressState.completed.push(tx.id);

        // Show toast
        showToast(
          "Transaction Dispatched",
          `"${tx.title}" has been sent to the network`,
          "transaction_confirmed",
        );
        addNotification(
          "transaction_confirmed",
          "Transaction Dispatched",
          `"${tx.title}" has been sent`,
          tx.id,
        );
      } else {
        await updateTransactionStatus(
          tx.id,
          "failed",
          "User rejected signature",
        );
        progressState.failed.push(tx.id);

        showToast(
          "Transaction Failed",
          `"${tx.title}" was rejected`,
          "transaction_failed",
        );
        addNotification(
          "transaction_failed",
          "Transaction Failed",
          `"${tx.title}" was rejected`,
          tx.id,
        );
      }

      setProgress({ ...progressState });
    }

    setIsProcessing(false);

    // Simulate confirmation polling (optimistic status updates)
    setTimeout(async () => {
      for (const txId of progressState.completed) {
        await updateTransactionStatus(txId, "confirmed");
      }
    }, 3000);
  }, [
    transactions,
    selectedTransactions,
    getSummary,
    updateTransactionStatus,
    showToast,
    addNotification,
  ]);

  // Demo: Add sample transactions on mount
  useEffect(() => {
    const addDemoTransactions = async () => {
      if (transactions.length === 0 && !isLoading) {
        const demoTransactions = [
          {
            type: "post_publish" as TransactionType,
            status: "pending" as TransactionStatus,
            priority: "high" as const,
            title: "Post to Instagram",
            description: "Schedule new promotional post",
            fee: 0.00001,
            estimatedGas: 100,
            dependencies: [],
          },
          {
            type: "trustline" as TransactionType,
            status: "pending" as TransactionStatus,
            priority: "normal" as const,
            title: "Add USDC Trustline",
            description: "Enable USDC asset for portfolio",
            fee: 0.00002,
            estimatedGas: 200,
            dependencies: [],
          },
          {
            type: "payment" as TransactionType,
            status: "pending" as TransactionStatus,
            priority: "urgent" as const,
            title: "Send Payment",
            description: "Transfer 100 XLM to wallet",
            fee: 0.00001,
            estimatedGas: 100,
            dependencies: [],
          },
        ];

        for (const tx of demoTransactions) {
          await addTransaction(tx);
        }

        addNotification(
          "item_added",
          "Transactions Added",
          `${demoTransactions.length} transactions added to queue`,
          undefined,
        );
        showToast(
          "Queue Updated",
          `${demoTransactions.length} transactions added`,
          "item_added",
        );
      }
    };

    addDemoTransactions();
  }, [isLoading]);

  // Render
  return (
    <>
      {/* Main Dock */}
      <div
        ref={dockRef}
        className={`
          fixed bottom-0 left-0 right-0 z-40 transition-all duration-300
          ${isExpanded ? "h-80" : "h-16"}
        `}
      >
        {/* Dock Background */}
        <div className="absolute inset-0 bg-dark-surface/95 backdrop-blur-lg border-t border-dark-border" />

        {/* Dock Content */}
        <div className="relative h-full flex flex-col">
          {/* Header */}
          <div
            className="h-16 flex items-center justify-between px-4 cursor-pointer hover:bg-white/5"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary-blue/20 flex items-center justify-center">
                <Sparkles size={20} className="text-primary-blue" />
              </div>
              <div>
                <h3 className="text-white font-medium">Staging Dock</h3>
                <p className="text-xs text-gray-subtext">
                  {transactions.length} pending •{" "}
                  {getTotalEstimatedFees().toFixed(4)} XLM est. fees
                </p>
              </div>

              {/* Notification Badge */}
              {unreadCount > 0 && (
                <span className="ml-2 px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">
                  {unreadCount}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {/* Sound Toggle */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleSound();
                }}
                className="p-2 rounded-lg hover:bg-white/10 text-gray-subtext"
              >
                {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
              </button>

              {/* Authorize Button */}
              {transactions.length > 0 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedTransactions(
                      new Set(transactions.map((t) => t.id)),
                    );
                    setShowAuthorization(true);
                  }}
                  className="px-4 py-2 rounded-xl bg-primary-blue text-white text-sm font-medium hover:bg-primary-blue/90 flex items-center gap-2"
                >
                  <Zap size={16} />
                  Authorize All
                </button>
              )}

              {/* Expand Toggle */}
              <button className="p-2 rounded-lg hover:bg-white/10 text-gray-subtext">
                {isExpanded ? (
                  <ChevronDown size={20} />
                ) : (
                  <ChevronUp size={20} />
                )}
              </button>
            </div>
          </div>

          {/* Expanded Content */}
          {isExpanded && (
            <div className="flex-1 overflow-hidden flex">
              {/* Transaction List */}
              <div className="flex-1 p-4 overflow-y-auto">
                {isLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <Loader2
                      size={24}
                      className="text-primary-blue animate-spin"
                    />
                  </div>
                ) : transactions.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-gray-subtext">
                    <Sparkles size={48} className="mb-4 opacity-50" />
                    <p>No pending transactions</p>
                    <p className="text-sm">
                      Add posts or transactions to see them here
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {transactions.map((transaction, index) => (
                      <div
                        key={transaction.id}
                        draggable
                        onDragStart={() => handleDragStart(index)}
                        onDragOver={(e) => handleDragOver(e, index)}
                        onDragEnd={handleDragEnd}
                      >
                        <TransactionItem
                          transaction={transaction}
                          onRemove={handleRemoveTransaction}
                          onSelect={handleSelectTransaction}
                          isSelected={selectedTransactions.has(transaction.id)}
                          isDragging={draggedIndex === index}
                          dragHandleProps={{}}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Sidebar - Quick Actions */}
              <div className="w-48 border-l border-dark-border p-4 space-y-3">
                <h4 className="text-sm font-medium text-gray-subtext">
                  Quick Actions
                </h4>

                <button
                  onClick={markAllAsRead}
                  className="w-full p-2 rounded-lg bg-dark-border/30 hover:bg-dark-border/50 text-sm text-white flex items-center gap-2"
                >
                  <Bell size={14} />
                  Mark all read
                </button>

                <button
                  onClick={() => {
                    const pending = transactions.filter(
                      (t) => t.status === "pending",
                    );
                    setSelectedTransactions(new Set(pending.map((t) => t.id)));
                  }}
                  className="w-full p-2 rounded-lg bg-dark-border/30 hover:bg-dark-border/50 text-sm text-white flex items-center gap-2"
                >
                  <CheckCircle2 size={14} />
                  Select pending
                </button>

                {/* Queue Status */}
                <div className="pt-4 border-t border-dark-border">
                  <h4 className="text-sm font-medium text-gray-subtext mb-2">
                    Queue Status
                  </h4>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-gray-subtext">Pending:</span>
                      <span className="text-white">
                        {queueStatus.totalPending}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-subtext">Processed:</span>
                      <span className="text-green-400">
                        {queueStatus.processedCount}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-subtext">Failed:</span>
                      <span className="text-red-400">
                        {queueStatus.failedCount}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Authorization Modal */}
      {showAuthorization && (
        <AuthorizationSummary
          summary={getSummary()}
          onAuthorize={handleAuthorizeAll}
          onCancel={() => setShowAuthorization(false)}
          isProcessing={isProcessing}
          progress={progress}
        />
      )}

      {/* Toast Notifications */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {toasts.map((toast) => (
          <NotificationToast
            key={toast.id}
            notification={toast}
            onDismiss={() => removeToast(toast.id)}
          />
        ))}
      </div>
    </>
  );
};

export default StagingDock;
