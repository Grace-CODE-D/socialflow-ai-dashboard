import React, { useState, useEffect } from 'react';
import { transactionDebugger } from '../../services/transactionDebugger';
import { 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Activity,
  Download,
  Trash2,
  Search,
  Filter
} from 'lucide-react';

interface TransactionDebugInfo {
  transaction: any;
  debugData: {
    executionTime: number;
    memoryUsage: number;
    apiCalls: string[];
    errors: string[];
    warnings: string[];
    stackTrace?: string;
    performance: {
      startTime: number;
      endTime: number;
      duration: number;
      steps: Array<{
        name: string;
        duration: number;
        timestamp: number;
      }>;
    };
  };
}

export const TransactionDebugger: React.FC = () => {
  const [debuggedTransactions, setDebuggedTransactions] = useState<TransactionDebugInfo[]>([]);
  const [selectedTransaction, setSelectedTransaction] = useState<TransactionDebugInfo | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'completed' | 'failed'>('all');

  useEffect(() => {
    const unsubscribe = transactionDebugger.subscribe((debugInfo) => {
      setDebuggedTransactions(prev => [debugInfo, ...prev.slice(0, 49)]);
    });

    // Load existing data
    setDebuggedTransactions(transactionDebugger.getDebuggedTransactions());

    return unsubscribe;
  }, []);

  const filteredTransactions = debuggedTransactions.filter(t => {
    const matchesSearch = t.transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         t.transaction.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || t.transaction.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      default:
        return <Activity className="w-4 h-4 text-gray-500" />;
    }
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms.toFixed(1)}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  return (
    <div className="p-6 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-white">Transaction Debugger</h2>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => transactionDebugger.clearDebugData()}
            className="flex items-center space-x-2 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            <span>Clear</span>
          </button>
          <button className="flex items-center space-x-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
            <Download className="w-4 h-4" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center space-x-4 mb-6">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search transactions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-primary-blue"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as any)}
          className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-primary-blue"
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="completed">Completed</option>
          <option value="failed">Failed</option>
        </select>
      </div>

      <div className="flex-1 flex space-x-6 overflow-hidden">
        {/* Transaction List */}
        <div className="w-1/2 flex flex-col">
          <h3 className="text-lg font-medium text-white mb-4">
            Transactions ({filteredTransactions.length})
          </h3>
          <div className="flex-1 overflow-y-auto space-y-2">
            {filteredTransactions.map((debugInfo) => (
              <div
                key={debugInfo.transaction.id}
                onClick={() => setSelectedTransaction(debugInfo)}
                className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                  selectedTransaction?.transaction.id === debugInfo.transaction.id
                    ? 'bg-primary-blue/20 border-primary-blue'
                    : 'bg-gray-700 border-gray-600 hover:bg-gray-600'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(debugInfo.transaction.status)}
                    <span className="text-white font-medium">
                      {debugInfo.transaction.type}
                    </span>
                  </div>
                  <span className="text-xs text-gray-400">
                    {formatDuration(debugInfo.debugData.executionTime)}
                  </span>
                </div>
                <p className="text-sm text-gray-300 mb-2">
                  {debugInfo.transaction.description}
                </p>
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span>{debugInfo.transaction.platform}</span>
                  <span>{new Date(debugInfo.transaction.timestamp).toLocaleTimeString()}</span>
                </div>
                {debugInfo.debugData.errors.length > 0 && (
                  <div className="flex items-center space-x-1 mt-2">
                    <AlertTriangle className="w-3 h-3 text-red-500" />
                    <span className="text-xs text-red-400">
                      {debugInfo.debugData.errors.length} error(s)
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Transaction Details */}
        <div className="w-1/2 flex flex-col">
          {selectedTransaction ? (
            <>
              <h3 className="text-lg font-medium text-white mb-4">Debug Details</h3>
              <div className="flex-1 overflow-y-auto space-y-4">
                {/* Performance Overview */}
                <div className="bg-gray-700 rounded-lg p-4">
                  <h4 className="text-white font-medium mb-3">Performance</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-400">Execution Time:</span>
                      <span className="text-white ml-2">
                        {formatDuration(selectedTransaction.debugData.executionTime)}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400">Memory Usage:</span>
                      <span className="text-white ml-2">
                        {selectedTransaction.debugData.memoryUsage}MB
                      </span>
                    </div>
                  </div>
                </div>

                {/* Execution Steps */}
                <div className="bg-gray-700 rounded-lg p-4">
                  <h4 className="text-white font-medium mb-3">Execution Steps</h4>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {selectedTransaction.debugData.performance.steps.map((step, index) => (
                      <div key={index} className="flex items-center justify-between text-sm">
                        <span className="text-gray-300">{step.name}</span>
                        <span className="text-gray-400">{formatDuration(step.duration)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* API Calls */}
                {selectedTransaction.debugData.apiCalls.length > 0 && (
                  <div className="bg-gray-700 rounded-lg p-4">
                    <h4 className="text-white font-medium mb-3">API Calls</h4>
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {selectedTransaction.debugData.apiCalls.map((call, index) => (
                        <div key={index} className="text-sm text-gray-300 font-mono">
                          {call}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Warnings */}
                {selectedTransaction.debugData.warnings.length > 0 && (
                  <div className="bg-yellow-900/20 border border-yellow-700 rounded-lg p-4">
                    <h4 className="text-yellow-400 font-medium mb-3 flex items-center">
                      <AlertTriangle className="w-4 h-4 mr-2" />
                      Warnings
                    </h4>
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {selectedTransaction.debugData.warnings.map((warning, index) => (
                        <div key={index} className="text-sm text-yellow-300">
                          {warning}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Errors */}
                {selectedTransaction.debugData.errors.length > 0 && (
                  <div className="bg-red-900/20 border border-red-700 rounded-lg p-4">
                    <h4 className="text-red-400 font-medium mb-3 flex items-center">
                      <XCircle className="w-4 h-4 mr-2" />
                      Errors
                    </h4>
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {selectedTransaction.debugData.errors.map((error, index) => (
                        <div key={index} className="text-sm text-red-300">
                          {error}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Stack Trace */}
                {selectedTransaction.debugData.stackTrace && (
                  <div className="bg-gray-700 rounded-lg p-4">
                    <h4 className="text-white font-medium mb-3">Stack Trace</h4>
                    <pre className="text-xs text-gray-300 font-mono whitespace-pre-wrap max-h-40 overflow-y-auto">
                      {selectedTransaction.debugData.stackTrace}
                    </pre>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-400">
              <div className="text-center">
                <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Select a transaction to view debug details</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};