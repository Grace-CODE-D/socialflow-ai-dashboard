import React, { useState, useEffect } from 'react';
import { contractTracer } from '../../services/contractTracer';
import { ContractExecution } from '../../types';
import { 
  Database, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Download,
  Trash2,
  Search,
  Play,
  Zap,
  Hash
} from 'lucide-react';

export const ContractTracer: React.FC = () => {
  const [executions, setExecutions] = useState<ContractExecution[]>([]);
  const [selectedExecution, setSelectedExecution] = useState<ContractExecution | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'success' | 'failed' | 'pending'>('all');

  useEffect(() => {
    const unsubscribe = contractTracer.subscribe((execution) => {
      setExecutions(prev => {
        const existingIndex = prev.findIndex(e => e.id === execution.id);
        if (existingIndex !== -1) {
          const updated = [...prev];
          updated[existingIndex] = execution;
          return updated;
        }
        return [execution, ...prev.slice(0, 49)];
      });
    });

    // Load existing data
    setExecutions(contractTracer.getExecutions());

    return unsubscribe;
  }, []);

  const filteredExecutions = executions.filter(execution => {
    const matchesSearch = execution.contractAddress.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         execution.method.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         execution.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || execution.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      default:
        return <Database className="w-4 h-4 text-gray-500" />;
    }
  };

  const formatGas = (gas: number) => {
    return gas.toLocaleString();
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const testContractExecution = async () => {
    const testAddress = '0x1234567890123456789012345678901234567890';
    const testMethod = 'transfer';
    const testParams = ['0xabcdefabcdefabcdefabcdefabcdefabcdefabcd', 1000];
    
    await contractTracer.traceExecution(testAddress, testMethod, testParams);
  };

  return (
    <div className="p-6 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-white">Contract Tracer</h2>
        <div className="flex items-center space-x-3">
          <button
            onClick={testContractExecution}
            className="flex items-center space-x-2 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
          >
            <Play className="w-4 h-4" />
            <span>Test Execution</span>
          </button>
          <button
            onClick={() => contractTracer.clearExecutions()}
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
            placeholder="Search contracts or methods..."
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
          <option value="success">Success</option>
          <option value="failed">Failed</option>
        </select>
      </div>

      <div className="flex-1 flex space-x-6 overflow-hidden">
        {/* Execution List */}
        <div className="w-1/2 flex flex-col">
          <h3 className="text-lg font-medium text-white mb-4">
            Contract Executions ({filteredExecutions.length})
          </h3>
          <div className="flex-1 overflow-y-auto space-y-2">
            {filteredExecutions.map((execution) => (
              <div
                key={execution.id}
                onClick={() => setSelectedExecution(execution)}
                className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                  selectedExecution?.id === execution.id
                    ? 'bg-primary-blue/20 border-primary-blue'
                    : 'bg-gray-700 border-gray-600 hover:bg-gray-600'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(execution.status)}
                    <span className="text-white font-medium">
                      {execution.method}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2 text-xs text-gray-400">
                    <Zap className="w-3 h-3" />
                    <span>{formatGas(execution.gasUsed)}</span>
                  </div>
                </div>
                <p className="text-sm text-gray-300 mb-2 font-mono">
                  {formatAddress(execution.contractAddress)}
                </p>
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span>{new Date(execution.timestamp).toLocaleTimeString()}</span>
                  {execution.transactionHash && (
                    <div className="flex items-center space-x-1">
                      <Hash className="w-3 h-3" />
                      <span className="font-mono">{formatAddress(execution.transactionHash)}</span>
                    </div>
                  )}
                </div>
                {execution.error && (
                  <div className="flex items-center space-x-1 mt-2">
                    <AlertTriangle className="w-3 h-3 text-red-500" />
                    <span className="text-xs text-red-400">Error</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Execution Details */}
        <div className="w-1/2 flex flex-col">
          {selectedExecution ? (
            <>
              <h3 className="text-lg font-medium text-white mb-4">Execution Details</h3>
              <div className="flex-1 overflow-y-auto space-y-4">
                {/* General Info */}
                <div className="bg-gray-700 rounded-lg p-4">
                  <h4 className="text-white font-medium mb-3">General</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Contract:</span>
                      <span className="text-white font-mono text-xs">
                        {selectedExecution.contractAddress}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Method:</span>
                      <span className="text-white font-medium">{selectedExecution.method}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Status:</span>
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(selectedExecution.status)}
                        <span className="text-white capitalize">{selectedExecution.status}</span>
                      </div>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Gas Used:</span>
                      <span className="text-white">{formatGas(selectedExecution.gasUsed)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Gas Limit:</span>
                      <span className="text-white">{formatGas(selectedExecution.gasLimit)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Timestamp:</span>
                      <span className="text-white">
                        {new Date(selectedExecution.timestamp).toLocaleString()}
                      </span>
                    </div>
                    {selectedExecution.transactionHash && (
                      <div className="flex justify-between">
                        <span className="text-gray-400">Tx Hash:</span>
                        <span className="text-white font-mono text-xs">
                          {selectedExecution.transactionHash}
                        </span>
                      </div>
                    )}
                    {selectedExecution.blockNumber && (
                      <div className="flex justify-between">
                        <span className="text-gray-400">Block:</span>
                        <span className="text-white">{selectedExecution.blockNumber}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Parameters */}
                <div className="bg-gray-700 rounded-lg p-4">
                  <h4 className="text-white font-medium mb-3">Parameters</h4>
                  <div className="max-h-40 overflow-y-auto">
                    {selectedExecution.parameters.length > 0 ? (
                      <div className="space-y-2">
                        {selectedExecution.parameters.map((param, index) => (
                          <div key={index} className="flex items-start space-x-3">
                            <span className="text-gray-400 text-sm w-8 flex-shrink-0">
                              [{index}]
                            </span>
                            <span className="text-gray-300 text-sm font-mono break-all">
                              {typeof param === 'object' ? JSON.stringify(param) : String(param)}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="text-gray-400 text-sm">No parameters</span>
                    )}
                  </div>
                </div>

                {/* Logs */}
                {selectedExecution.logs.length > 0 && (
                  <div className="bg-gray-700 rounded-lg p-4">
                    <h4 className="text-white font-medium mb-3">Event Logs</h4>
                    <div className="max-h-60 overflow-y-auto space-y-3">
                      {selectedExecution.logs.map((log, index) => (
                        <div key={log.id} className="bg-gray-800 rounded p-3">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-gray-400 text-xs">Log #{index}</span>
                            <span className="text-gray-400 text-xs font-mono">
                              {formatAddress(log.address)}
                            </span>
                          </div>
                          <div className="space-y-1 text-xs">
                            <div>
                              <span className="text-gray-400">Topics:</span>
                              <div className="ml-2 space-y-1">
                                {log.topics.map((topic, i) => (
                                  <div key={i} className="text-gray-300 font-mono break-all">
                                    [{i}] {topic}
                                  </div>
                                ))}
                              </div>
                            </div>
                            <div>
                              <span className="text-gray-400">Data:</span>
                              <div className="text-gray-300 font-mono break-all ml-2">
                                {log.data}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Error */}
                {selectedExecution.error && (
                  <div className="bg-red-900/20 border border-red-700 rounded-lg p-4">
                    <h4 className="text-red-400 font-medium mb-3 flex items-center">
                      <XCircle className="w-4 h-4 mr-2" />
                      Error
                    </h4>
                    <p className="text-sm text-red-300">{selectedExecution.error}</p>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-400">
              <div className="text-center">
                <Database className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Select a contract execution to view details</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};