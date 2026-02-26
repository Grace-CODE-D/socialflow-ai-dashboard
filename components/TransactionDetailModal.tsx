import { Transaction } from '../src/types/transaction';
import { CATEGORY_LABELS } from '../src/utils/transactionUtils';

interface TransactionDetailModalProps {
  transaction: Transaction | null;
  onClose: () => void;
}

export function TransactionDetailModal({ transaction, onClose }: TransactionDetailModalProps) {
  if (!transaction) return null;

  const stellarExpertUrl = `https://stellar.expert/explorer/testnet/tx/${transaction.id}`;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-gray-900 rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-xl font-bold">Transaction Details</h2>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-white text-2xl leading-none hover:bg-gray-800 rounded px-2"
          >
            &times;
          </button>
        </div>

        <div className="space-y-4">
          {/* Transaction Hash */}
          <div>
            <label className="text-sm text-gray-400">Transaction Hash</label>
            <div className="font-mono text-sm bg-gray-800 p-2 rounded break-all">{transaction.id}</div>
          </div>

          {/* Category & Type */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-400">Category</label>
              <div className="text-sm">{CATEGORY_LABELS[transaction.category]}</div>
            </div>
            <div>
              <label className="text-sm text-gray-400">Type</label>
              <div className="text-sm">{transaction.type}</div>
            </div>
          </div>

          {/* Timestamp */}
          <div>
            <label className="text-sm text-gray-400">Timestamp</label>
            <div className="text-sm">{new Date(transaction.timestamp).toLocaleString()}</div>
          </div>

          {/* Addresses */}
          {transaction.from && (
            <div>
              <label className="text-sm text-gray-400">From</label>
              <div className="font-mono text-sm bg-gray-800 p-2 rounded break-all">{transaction.from}</div>
            </div>
          )}

          {transaction.to && (
            <div>
              <label className="text-sm text-gray-400">To</label>
              <div className="font-mono text-sm bg-gray-800 p-2 rounded break-all">{transaction.to}</div>
            </div>
          )}

          {/* Amount & Asset */}
          {transaction.amount && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-400">Amount</label>
                <div className="text-sm text-green-400">{transaction.amount}</div>
              </div>
              <div>
                <label className="text-sm text-gray-400">Asset</label>
                <div className="text-sm">{transaction.asset || 'XLM'}</div>
              </div>
            </div>
          )}

          {/* Memo */}
          {transaction.data?.memo && (
            <div>
              <label className="text-sm text-gray-400">Memo</label>
              <div className="text-sm bg-gray-800 p-2 rounded">{transaction.data.memo}</div>
            </div>
          )}

          {/* Gas Fee */}
          {transaction.data?.fee && (
            <div>
              <label className="text-sm text-gray-400">Gas Fee</label>
              <div className="text-sm">{transaction.data.fee} stroops</div>
            </div>
          )}

          {/* Block Number */}
          {transaction.data?.ledger && (
            <div>
              <label className="text-sm text-gray-400">Block Number</label>
              <div className="text-sm">{transaction.data.ledger}</div>
            </div>
          )}

          {/* Operations */}
          {transaction.data?.operations && (
            <div>
              <label className="text-sm text-gray-400">Operations ({transaction.data.operations.length})</label>
              <div className="space-y-2 mt-2">
                {transaction.data.operations.map((op: any, idx: number) => (
                  <div key={idx} className="bg-gray-800 p-3 rounded text-sm">
                    <div className="font-semibold text-blue-400">{op.type}</div>
                    <pre className="text-xs text-gray-300 mt-1 overflow-x-auto">
                      {JSON.stringify(op, null, 2)}
                    </pre>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Signatures */}
          {transaction.data?.signatures && (
            <div>
              <label className="text-sm text-gray-400">Signatures ({transaction.data.signatures.length})</label>
              <div className="space-y-1 mt-2">
                {transaction.data.signatures.map((sig: string, idx: number) => (
                  <div key={idx} className="font-mono text-xs bg-gray-800 p-2 rounded break-all">
                    {sig}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* View on Stellar Expert */}
          <div className="pt-4 border-t border-gray-700">
            <a
              href={stellarExpertUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-sm"
            >
              <span>🔗</span>
              View on Stellar Expert
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
