import React, { useState, useEffect } from 'react';
import { networkMonitor } from '../../services/networkMonitor';
import { NetworkRequest } from '../../types';
import { 
  Globe, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Download,
  Trash2,
  Search,
  Filter,
  ArrowUp,
  ArrowDown
} from 'lucide-react';

export const NetworkMonitor: React.FC = () => {
  const [requests, setRequests] = useState<NetworkRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<NetworkRequest | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [methodFilter, setMethodFilter] = useState<'all' | 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'success' | 'error'>('all');

  useEffect(() => {
    const unsubscribe = networkMonitor.subscribe((request) => {
      setRequests(prev => [request, ...prev.slice(0, 99)]);
    });

    // Load existing data
    setRequests(networkMonitor.getRequests());

    return unsubscribe;
  }, []);

  const filteredRequests = requests.filter(request => {
    const matchesSearch = request.url.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesMethod = methodFilter === 'all' || request.method === methodFilter;
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'success' && request.status >= 200 && request.status < 300) ||
      (statusFilter === 'error' && (request.status >= 400 || request.status === 0));
    
    return matchesSearch && matchesMethod && matchesStatus;
  });

  const getStatusColor = (status: number) => {
    if (status === 0) return 'text-red-500';
    if (status >= 200 && status < 300) return 'text-green-500';
    if (status >= 300 && status < 400) return 'text-yellow-500';
    if (status >= 400) return 'text-red-500';
    return 'text-gray-500';
  };

  const getMethodColor = (method: string) => {
    switch (method) {
      case 'GET': return 'text-blue-400';
      case 'POST': return 'text-green-400';
      case 'PUT': return 'text-yellow-400';
      case 'DELETE': return 'text-red-400';
      case 'PATCH': return 'text-purple-400';
      default: return 'text-gray-400';
    }
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const exportRequests = () => {
    const data = JSON.stringify(filteredRequests, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `network-requests-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-white">Network Monitor</h2>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => networkMonitor.clearRequests()}
            className="flex items-center space-x-2 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            <span>Clear</span>
          </button>
          <button
            onClick={exportRequests}
            className="flex items-center space-x-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
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
            placeholder="Search URLs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-primary-blue"
          />
        </div>
        <select
          value={methodFilter}
          onChange={(e) => setMethodFilter(e.target.value as any)}
          className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-primary-blue"
        >
          <option value="all">All Methods</option>
          <option value="GET">GET</option>
          <option value="POST">POST</option>
          <option value="PUT">PUT</option>
          <option value="DELETE">DELETE</option>
          <option value="PATCH">PATCH</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as any)}
          className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-primary-blue"
        >
          <option value="all">All Status</option>
          <option value="success">Success (2xx)</option>
          <option value="error">Error (4xx, 5xx)</option>
        </select>
      </div>

      <div className="flex-1 flex space-x-6 overflow-hidden">
        {/* Request List */}
        <div className="w-1/2 flex flex-col">
          <h3 className="text-lg font-medium text-white mb-4">
            Requests ({filteredRequests.length})
          </h3>
          <div className="flex-1 overflow-y-auto space-y-2">
            {filteredRequests.map((request) => (
              <div
                key={request.id}
                onClick={() => setSelectedRequest(request)}
                className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                  selectedRequest?.id === request.id
                    ? 'bg-primary-blue/20 border-primary-blue'
                    : 'bg-gray-700 border-gray-600 hover:bg-gray-600'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-3">
                    <span className={`font-mono text-sm font-medium ${getMethodColor(request.method)}`}>
                      {request.method}
                    </span>
                    <span className={`text-sm font-medium ${getStatusColor(request.status)}`}>
                      {request.status || 'ERR'}
                    </span>
                  </div>
                  <span className="text-xs text-gray-400">
                    {formatDuration(request.duration)}
                  </span>
                </div>
                <p className="text-sm text-gray-300 mb-2 truncate">
                  {request.url}
                </p>
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span>{new Date(request.timestamp).toLocaleTimeString()}</span>
                  {request.error && (
                    <div className="flex items-center space-x-1">
                      <XCircle className="w-3 h-3 text-red-500" />
                      <span className="text-red-400">Error</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Request Details */}
        <div className="w-1/2 flex flex-col">
          {selectedRequest ? (
            <>
              <h3 className="text-lg font-medium text-white mb-4">Request Details</h3>
              <div className="flex-1 overflow-y-auto space-y-4">
                {/* General Info */}
                <div className="bg-gray-700 rounded-lg p-4">
                  <h4 className="text-white font-medium mb-3">General</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">URL:</span>
                      <span className="text-white font-mono text-xs break-all">
                        {selectedRequest.url}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Method:</span>
                      <span className={`font-medium ${getMethodColor(selectedRequest.method)}`}>
                        {selectedRequest.method}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Status:</span>
                      <span className={`font-medium ${getStatusColor(selectedRequest.status)}`}>
                        {selectedRequest.status || 'Error'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Duration:</span>
                      <span className="text-white">{formatDuration(selectedRequest.duration)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Timestamp:</span>
                      <span className="text-white">
                        {new Date(selectedRequest.timestamp).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Request Headers */}
                <div className="bg-gray-700 rounded-lg p-4">
                  <h4 className="text-white font-medium mb-3 flex items-center">
                    <ArrowUp className="w-4 h-4 mr-2" />
                    Request Headers
                  </h4>
                  <div className="max-h-40 overflow-y-auto">
                    {Object.keys(selectedRequest.requestHeaders).length > 0 ? (
                      <div className="space-y-1 text-sm font-mono">
                        {Object.entries(selectedRequest.requestHeaders).map(([key, value]) => (
                          <div key={key} className="flex">
                            <span className="text-gray-400 w-32 flex-shrink-0">{key}:</span>
                            <span className="text-gray-300 break-all">{value}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="text-gray-400 text-sm">No headers</span>
                    )}
                  </div>
                </div>

                {/* Response Headers */}
                <div className="bg-gray-700 rounded-lg p-4">
                  <h4 className="text-white font-medium mb-3 flex items-center">
                    <ArrowDown className="w-4 h-4 mr-2" />
                    Response Headers
                  </h4>
                  <div className="max-h-40 overflow-y-auto">
                    {Object.keys(selectedRequest.responseHeaders).length > 0 ? (
                      <div className="space-y-1 text-sm font-mono">
                        {Object.entries(selectedRequest.responseHeaders).map(([key, value]) => (
                          <div key={key} className="flex">
                            <span className="text-gray-400 w-32 flex-shrink-0">{key}:</span>
                            <span className="text-gray-300 break-all">{value}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="text-gray-400 text-sm">No headers</span>
                    )}
                  </div>
                </div>

                {/* Request Body */}
                {selectedRequest.requestBody && (
                  <div className="bg-gray-700 rounded-lg p-4">
                    <h4 className="text-white font-medium mb-3">Request Body</h4>
                    <pre className="text-xs text-gray-300 font-mono whitespace-pre-wrap max-h-40 overflow-y-auto bg-gray-800 p-3 rounded">
                      {typeof selectedRequest.requestBody === 'string' 
                        ? selectedRequest.requestBody 
                        : JSON.stringify(selectedRequest.requestBody, null, 2)}
                    </pre>
                  </div>
                )}

                {/* Response Body */}
                {selectedRequest.responseBody && (
                  <div className="bg-gray-700 rounded-lg p-4">
                    <h4 className="text-white font-medium mb-3">Response Body</h4>
                    <pre className="text-xs text-gray-300 font-mono whitespace-pre-wrap max-h-40 overflow-y-auto bg-gray-800 p-3 rounded">
                      {typeof selectedRequest.responseBody === 'string' 
                        ? selectedRequest.responseBody 
                        : JSON.stringify(selectedRequest.responseBody, null, 2)}
                    </pre>
                  </div>
                )}

                {/* Error */}
                {selectedRequest.error && (
                  <div className="bg-red-900/20 border border-red-700 rounded-lg p-4">
                    <h4 className="text-red-400 font-medium mb-3 flex items-center">
                      <XCircle className="w-4 h-4 mr-2" />
                      Error
                    </h4>
                    <p className="text-sm text-red-300">{selectedRequest.error}</p>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-400">
              <div className="text-center">
                <Globe className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Select a request to view details</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};