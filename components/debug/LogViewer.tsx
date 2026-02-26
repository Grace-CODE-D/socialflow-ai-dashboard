import React, { useState, useEffect, useRef } from 'react';
import { logViewer } from '../../services/logViewer';
import { LogEntry } from '../../types';
import { 
  FileText, 
  AlertTriangle, 
  Info, 
  AlertCircle, 
  Bug,
  Download,
  Trash2,
  Search,
  Filter,
  Pause,
  Play,
  BarChart3
} from 'lucide-react';

export const LogViewer: React.FC = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<LogEntry[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [levelFilter, setLevelFilter] = useState<'all' | LogEntry['level']>('all');
  const [sourceFilter, setSourceFilter] = useState('');
  const [isPaused, setIsPaused] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);
  const [showStats, setShowStats] = useState(false);
  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsubscribe = logViewer.subscribe((log) => {
      if (!isPaused) {
        setLogs(prev => [log, ...prev.slice(0, 499)]);
      }
    });

    // Load existing data
    setLogs(logViewer.getLogs());

    return unsubscribe;
  }, [isPaused]);

  useEffect(() => {
    const filtered = logViewer.filterLogs(
      levelFilter === 'all' ? undefined : levelFilter,
      sourceFilter || undefined,
      searchTerm || undefined
    );
    setFilteredLogs(filtered);
  }, [logs, searchTerm, levelFilter, sourceFilter]);

  useEffect(() => {
    if (autoScroll && logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [filteredLogs, autoScroll]);

  const getLevelIcon = (level: LogEntry['level']) => {
    switch (level) {
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'warn':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'info':
        return <Info className="w-4 h-4 text-blue-500" />;
      case 'debug':
        return <Bug className="w-4 h-4 text-gray-500" />;
      default:
        return <FileText className="w-4 h-4 text-gray-500" />;
    }
  };

  const getLevelColor = (level: LogEntry['level']) => {
    switch (level) {
      case 'error':
        return 'text-red-400 bg-red-900/20 border-red-700';
      case 'warn':
        return 'text-yellow-400 bg-yellow-900/20 border-yellow-700';
      case 'info':
        return 'text-blue-400 bg-blue-900/20 border-blue-700';
      case 'debug':
        return 'text-gray-400 bg-gray-800 border-gray-700';
      default:
        return 'text-gray-400 bg-gray-800 border-gray-700';
    }
  };

  const exportLogs = (format: 'json' | 'csv' = 'json') => {
    const data = logViewer.exportLogs(format);
    const blob = new Blob([data], { 
      type: format === 'json' ? 'application/json' : 'text/csv' 
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `logs-${new Date().toISOString().split('T')[0]}.${format}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const stats = logViewer.getLogStats();

  return (
    <div className="p-6 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-white">Log Viewer</h2>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowStats(!showStats)}
            className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
              showStats ? 'bg-primary-blue text-white' : 'bg-gray-600 hover:bg-gray-700 text-gray-300'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Stats</span>
          </button>
          <button
            onClick={() => setIsPaused(!isPaused)}
            className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
              isPaused 
                ? 'bg-yellow-600 hover:bg-yellow-700 text-white' 
                : 'bg-green-600 hover:bg-green-700 text-white'
            }`}
          >
            {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
            <span>{isPaused ? 'Resume' : 'Pause'}</span>
          </button>
          <button
            onClick={() => logViewer.clearLogs()}
            className="flex items-center space-x-2 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            <span>Clear</span>
          </button>
          <div className="relative">
            <button className="flex items-center space-x-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors group">
              <Download className="w-4 h-4" />
              <span>Export</span>
            </button>
            <div className="absolute right-0 top-full mt-1 bg-gray-700 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
              <button
                onClick={() => exportLogs('json')}
                className="block w-full text-left px-4 py-2 text-white hover:bg-gray-600 rounded-t-lg"
              >
                Export JSON
              </button>
              <button
                onClick={() => exportLogs('csv')}
                className="block w-full text-left px-4 py-2 text-white hover:bg-gray-600 rounded-b-lg"
              >
                Export CSV
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Panel */}
      {showStats && (
        <div className="mb-6 bg-gray-800 rounded-lg p-4">
          <h3 className="text-white font-medium mb-3">Log Statistics</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-white">{stats.total}</div>
              <div className="text-gray-400 text-sm">Total Logs</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-400">{stats.byLevel.error}</div>
              <div className="text-gray-400 text-sm">Errors</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-400">{stats.byLevel.warn}</div>
              <div className="text-gray-400 text-sm">Warnings</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400">{stats.byLevel.info}</div>
              <div className="text-gray-400 text-sm">Info</div>
            </div>
          </div>
          <div className="mt-4">
            <h4 className="text-white font-medium mb-2">Top Sources</h4>
            <div className="flex flex-wrap gap-2">
              {Object.entries(stats.bySource)
                .sort(([,a], [,b]) => b - a)
                .slice(0, 5)
                .map(([source, count]) => (
                  <span key={source} className="px-2 py-1 bg-gray-700 rounded text-sm text-gray-300">
                    {source}: {count}
                  </span>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center space-x-4 mb-6">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search logs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-primary-blue"
          />
        </div>
        <select
          value={levelFilter}
          onChange={(e) => setLevelFilter(e.target.value as any)}
          className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-primary-blue"
        >
          <option value="all">All Levels</option>
          <option value="error">Error</option>
          <option value="warn">Warning</option>
          <option value="info">Info</option>
          <option value="debug">Debug</option>
        </select>
        <input
          type="text"
          placeholder="Filter by source..."
          value={sourceFilter}
          onChange={(e) => setSourceFilter(e.target.value)}
          className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-primary-blue"
        />
        <label className="flex items-center space-x-2 text-gray-300">
          <input
            type="checkbox"
            checked={autoScroll}
            onChange={(e) => setAutoScroll(e.target.checked)}
            className="rounded"
          />
          <span className="text-sm">Auto-scroll</span>
        </label>
      </div>

      {/* Logs */}
      <div className="flex-1 bg-gray-900 rounded-lg overflow-hidden">
        <div className="h-full overflow-y-auto p-4 space-y-2 font-mono text-sm">
          {filteredLogs.map((log) => (
            <div
              key={log.id}
              className={`p-3 rounded border-l-4 ${getLevelColor(log.level)}`}
            >
              <div className="flex items-start justify-between mb-1">
                <div className="flex items-center space-x-2">
                  {getLevelIcon(log.level)}
                  <span className="font-medium uppercase text-xs">
                    {log.level}
                  </span>
                  <span className="text-gray-400 text-xs">
                    [{log.source}]
                  </span>
                </div>
                <span className="text-gray-400 text-xs">
                  {new Date(log.timestamp).toLocaleTimeString()}
                </span>
              </div>
              
              <div className="text-gray-200 mb-2">
                {log.message}
              </div>
              
              {log.metadata && Object.keys(log.metadata).length > 0 && (
                <div className="bg-gray-800 rounded p-2 mt-2">
                  <div className="text-gray-400 text-xs mb-1">Metadata:</div>
                  <pre className="text-gray-300 text-xs">
                    {JSON.stringify(log.metadata, null, 2)}
                  </pre>
                </div>
              )}
              
              {log.stackTrace && (
                <div className="bg-gray-800 rounded p-2 mt-2">
                  <div className="text-gray-400 text-xs mb-1">Stack Trace:</div>
                  <pre className="text-gray-300 text-xs whitespace-pre-wrap">
                    {log.stackTrace}
                  </pre>
                </div>
              )}
            </div>
          ))}
          
          {filteredLogs.length === 0 && (
            <div className="text-center text-gray-400 mt-8">
              <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No logs match the current filters</p>
            </div>
          )}
          
          <div ref={logsEndRef} />
        </div>
      </div>

      {/* Status Bar */}
      <div className="flex items-center justify-between text-sm text-gray-400 mt-4">
        <div className="flex items-center space-x-4">
          <span>Showing {filteredLogs.length} of {logs.length} logs</span>
          {isPaused && (
            <span className="text-yellow-400">⏸ Paused</span>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <span>Auto-scroll: {autoScroll ? 'On' : 'Off'}</span>
        </div>
      </div>
    </div>
  );
};