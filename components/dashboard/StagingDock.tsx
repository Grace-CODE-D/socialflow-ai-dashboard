import React, { useState, useRef } from 'react';
import { Transaction, TransactionType, Platform } from '../../types';
import { 
  SiInstagram, 
  SiYoutube, 
  SiFacebook, 
  SiLinkedin,
  SiTiktok 
} from 'react-icons/si';
import { FaXTwitter } from 'react-icons/fa6';

const MaterialIcon = ({ name, className }: { name: string; className?: string }) => (
  <span className={`material-symbols-outlined ${className}`}>{name}</span>
);

interface StagingDockProps {
  transactions: Transaction[];
  onRemoveTransaction: (id: string) => void;
  onReorderTransactions: (transactions: Transaction[]) => void;
}

export const StagingDock: React.FC<StagingDockProps> = ({
  transactions,
  onRemoveTransaction,
  onReorderTransactions,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const dockRef = useRef<HTMLDivElement>(null);

  const getPlatformIcon = (platform: Platform) => {
    const iconProps = { size: 16, className: 'text-white' };
    switch (platform) {
      case Platform.INSTAGRAM: return <SiInstagram {...iconProps} />;
      case Platform.YOUTUBE: return <SiYoutube {...iconProps} />;
      case Platform.FACEBOOK: return <SiFacebook {...iconProps} />;
      case Platform.LINKEDIN: return <SiLinkedin {...iconProps} />;
      case Platform.TIKTOK: return <SiTiktok {...iconProps} />;
      case Platform.X: return <FaXTwitter {...iconProps} />;
      default: return null;
    }
  };

  const getTransactionIcon = (type: TransactionType) => {
    switch (type) {
      case TransactionType.POST: return 'send';
      case TransactionType.SCHEDULE: return 'schedule';
      case TransactionType.UPDATE: return 'edit';
      case TransactionType.DELETE: return 'delete';
      case TransactionType.REPLY: return 'reply';
      default: return 'description';
    }
  };

  const getTransactionColor = (type: TransactionType) => {
    switch (type) {
      case TransactionType.POST: return 'bg-primary-blue';
      case TransactionType.SCHEDULE: return 'bg-primary-teal';
      case TransactionType.UPDATE: return 'bg-yellow-500';
      case TransactionType.DELETE: return 'bg-red-500';
      case TransactionType.REPLY: return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setHoveredIndex(index);
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      setHoveredIndex(null);
      return;
    }

    const newTransactions = [...transactions];
    const [draggedItem] = newTransactions.splice(draggedIndex, 1);
    newTransactions.splice(dropIndex, 0, draggedItem);

    onReorderTransactions(newTransactions);
    setDraggedIndex(null);
    setHoveredIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setHoveredIndex(null);
  };

  const groupedTransactions = transactions.reduce((acc, transaction) => {
    if (transaction.relatedTransactions && transaction.relatedTransactions.length > 0) {
      const groupKey = transaction.relatedTransactions.sort().join('-');
      if (!acc[groupKey]) {
        acc[groupKey] = [];
      }
      acc[groupKey].push(transaction);
    } else {
      acc[transaction.id] = [transaction];
    }
    return acc;
  }, {} as Record<string, Transaction[]>);

  return (
    <div
      ref={dockRef}
      className={`fixed bottom-0 left-0 right-0 z-50 transition-all duration-300 ease-in-out ${
        isExpanded ? 'h-80' : 'h-16'
      }`}
    >
      {/* Backdrop blur */}
      <div className="absolute inset-0 bg-dark-surface/95 backdrop-blur-xl border-t border-dark-border" />

      {/* Content */}
      <div className="relative h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-dark-border">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-2 hover:bg-white/5 rounded-lg transition-colors"
            >
              <MaterialIcon
                name={isExpanded ? 'expand_more' : 'expand_less'}
                className="text-gray-subtext"
              />
            </button>
            <h3 className="text-sm font-semibold text-white">Staging Dock</h3>
            {transactions.length > 0 && (
              <span className="px-2 py-0.5 text-xs font-bold bg-primary-blue text-white rounded-full">
                {transactions.length}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              className="px-4 py-2 text-sm font-medium text-white bg-primary-blue hover:bg-primary-blue/80 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={transactions.length === 0}
            >
              Execute All
            </button>
            <button
              className="p-2 hover:bg-white/5 rounded-lg transition-colors text-gray-subtext"
              onClick={() => {
                if (confirm('Clear all pending transactions?')) {
                  transactions.forEach(t => onRemoveTransaction(t.id));
                }
              }}
            >
              <MaterialIcon name="clear_all" />
            </button>
          </div>
        </div>

        {/* Transaction List */}
        {isExpanded && (
          <div className="flex-1 overflow-x-auto overflow-y-hidden px-6 py-4">
            {transactions.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-subtext">
                <MaterialIcon name="inbox" className="text-5xl mb-2 opacity-50" />
                <p className="text-sm">No pending transactions</p>
              </div>
            ) : (
              <div className="flex gap-4 h-full">
                {Object.entries(groupedTransactions).map(([groupKey, groupTransactions]) => (
                  <div
                    key={groupKey}
                    className={`flex gap-2 ${
                      groupTransactions.length > 1 ? 'p-3 bg-white/5 rounded-2xl border border-dark-border' : ''
                    }`}
                  >
                    {groupTransactions.map((transaction) => {
                      const actualIndex = transactions.findIndex(t => t.id === transaction.id);
                      return (
                        <TransactionCard
                          key={transaction.id}
                          transaction={transaction}
                          index={actualIndex}
                          isDragging={draggedIndex === actualIndex}
                          isHovered={hoveredIndex === actualIndex}
                          onDragStart={handleDragStart}
                          onDragOver={handleDragOver}
                          onDrop={handleDrop}
                          onDragEnd={handleDragEnd}
                          onRemove={onRemoveTransaction}
                          getPlatformIcon={getPlatformIcon}
                          getTransactionIcon={getTransactionIcon}
                          getTransactionColor={getTransactionColor}
                        />
                      );
                    })}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

interface TransactionCardProps {
  transaction: Transaction;
  index: number;
  isDragging: boolean;
  isHovered: boolean;
  onDragStart: (e: React.DragEvent, index: number) => void;
  onDragOver: (e: React.DragEvent, index: number) => void;
  onDrop: (e: React.DragEvent, index: number) => void;
  onDragEnd: () => void;
  onRemove: (id: string) => void;
  getPlatformIcon: (platform: Platform) => React.ReactNode;
  getTransactionIcon: (type: TransactionType) => string;
  getTransactionColor: (type: TransactionType) => string;
}

const TransactionCard: React.FC<TransactionCardProps> = ({
  transaction,
  index,
  isDragging,
  isHovered,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  onRemove,
  getPlatformIcon,
  getTransactionIcon,
  getTransactionColor,
}) => {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, index)}
      onDragOver={(e) => onDragOver(e, index)}
      onDrop={(e) => onDrop(e, index)}
      onDragEnd={onDragEnd}
      onMouseEnter={() => setShowDetails(true)}
      onMouseLeave={() => setShowDetails(false)}
      className={`relative w-48 h-full bg-dark-surface border border-dark-border rounded-2xl p-4 cursor-move transition-all ${
        isDragging ? 'opacity-50 scale-95' : ''
      } ${isHovered ? 'border-primary-blue' : ''} hover:border-primary-blue/50`}
    >
      {/* Remove button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onRemove(transaction.id);
        }}
        className="absolute top-2 right-2 p-1 bg-red-500/20 hover:bg-red-500/30 rounded-lg transition-colors"
      >
        <MaterialIcon name="close" className="text-xs text-red-400" />
      </button>

      {/* Transaction type icon */}
      <div className={`w-10 h-10 ${getTransactionColor(transaction.type)} rounded-xl flex items-center justify-center mb-3`}>
        <MaterialIcon name={getTransactionIcon(transaction.type)} className="text-white" />
      </div>

      {/* Title */}
      <h4 className="text-sm font-semibold text-white mb-1 truncate pr-6">
        {transaction.title}
      </h4>

      {/* Platform */}
      <div className="flex items-center gap-2 mb-2">
        <div className="w-6 h-6 bg-white/10 rounded-lg flex items-center justify-center">
          {getPlatformIcon(transaction.platform)}
        </div>
        <span className="text-xs text-gray-subtext capitalize">{transaction.platform}</span>
      </div>

      {/* Description */}
      {transaction.description && (
        <p className="text-xs text-gray-subtext line-clamp-2 mb-2">
          {transaction.description}
        </p>
      )}

      {/* Scheduled time */}
      {transaction.scheduledTime && (
        <div className="flex items-center gap-1 text-xs text-primary-teal">
          <MaterialIcon name="schedule" className="text-xs" />
          <span>{new Date(transaction.scheduledTime).toLocaleString()}</span>
        </div>
      )}

      {/* Hover details tooltip */}
      {showDetails && (
        <div className="absolute bottom-full left-0 mb-2 w-64 bg-dark-surface border border-dark-border rounded-2xl p-4 shadow-xl z-10 animate-fade-in-sm">
          <div className="space-y-2">
            <div>
              <p className="text-xs text-gray-subtext">Type</p>
              <p className="text-sm text-white capitalize">{transaction.type}</p>
            </div>
            <div>
              <p className="text-xs text-gray-subtext">Platform</p>
              <p className="text-sm text-white capitalize">{transaction.platform}</p>
            </div>
            {transaction.description && (
              <div>
                <p className="text-xs text-gray-subtext">Description</p>
                <p className="text-sm text-white">{transaction.description}</p>
              </div>
            )}
            {transaction.scheduledTime && (
              <div>
                <p className="text-xs text-gray-subtext">Scheduled</p>
                <p className="text-sm text-white">
                  {new Date(transaction.scheduledTime).toLocaleString()}
                </p>
              </div>
            )}
            <div>
              <p className="text-xs text-gray-subtext">Created</p>
              <p className="text-sm text-white">
                {new Date(transaction.createdAt).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
