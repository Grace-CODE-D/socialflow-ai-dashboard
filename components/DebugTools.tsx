import React, { useState, useEffect } from 'react';
import { ViewProps } from '../types';
import { 
  Bug, 
  Network, 
  Database, 
  Eye, 
  FileText, 
  Activity,
  Settings,
  Download,
  Trash2,
  Play,
  Pause,
  RefreshCw
} from 'lucide-react';
import { TransactionDebugger } from './debug/TransactionDebugger';
import { NetworkMonitor } from './debug/NetworkMonitor';
import { ContractTracer } from './debug/ContractTracer';
import { StateInspector } from './debug/StateInspector';
import { LogViewer } from './debug/LogViewer';

type DebugTool = 'transaction' | 'network' | 'contract' | 'state' | 'logs';

export const DebugTools: React.FC<ViewProps> = ({ onNavigate }) => {
  const [activeTool, setActiveTool] = useState<DebugTool>('transaction');
  const [isMonitoring, setIsMonitoring] = useState(true);

  const tools = [
    {
      id: 'transaction' as DebugTool,
      name: 'Transaction Debugger',
      icon: <Bug className="w-5 h-5" />,
      description: 'Debug and analyze transaction execution'
    },
    {
      id: 'network' as DebugTool,
      name: 'Network Monitor',
      icon: <Network className="w-5 h-5" />,
      description: 'Monitor HTTP requests and responses'
    },
    {
      id: 'contract' as DebugTool,
      name: 'Contract Tracer',
      icon: <Database className="w-5 h-5" />,
      description: 'Trace smart contract executions'
    },
    {
      id: 'state' as DebugTool,
      name: 'State Inspector',
      icon: <Eye className="w-5 h-5" />,
      description: 'Inspect and monitor application state'
    },
    {
      id: 'logs' as DebugTool,
      name: 'Log Viewer',
      icon: <FileText className="w-5 h-5" />,
      description: 'View and filter application logs'
    }
  ];

  const renderActiveTool = () => {
    switch (activeTool) {
      case 'transaction':
        return <TransactionDebugger />;
      case 'network':
        return <NetworkMonitor />;
      case 'contract':
        return <ContractTracer />;
      case 'state':
        return <StateInspector />;
      case 'logs':
        return <LogViewer />;
      default:
        return <TransactionDebugger />;
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Debug Tools</h1>
          <p className="text-gray-400">
            Comprehensive debugging and monitoring tools for development
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setIsMonitoring(!isMonitoring)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
              isMonitoring 
                ? 'bg-green-600 hover:bg-green-700 text-white' 
                : 'bg-gray-600 hover:bg-gray-700 text-gray-300'
            }`}
          >
            {isMonitoring ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            <span>{isMonitoring ? 'Monitoring' : 'Paused'}</span>
          </button>
          
          <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
            <Settings className="w-4 h-4" />
            <span>Settings</span>
          </button>
        </div>
      </div>

      {/* Tool Navigation */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {tools.map((tool) => (
          <button
            key={tool.id}
            onClick={() => setActiveTool(tool.id)}
            className={`p-4 rounded-lg border transition-all ${
              activeTool === tool.id
                ? 'bg-primary-blue/20 border-primary-blue text-white'
                : 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700 hover:border-gray-600'
            }`}
          >
            <div className="flex flex-col items-center space-y-2">
              {tool.icon}
              <h3 className="font-semibold text-sm">{tool.name}</h3>
              <p className="text-xs text-gray-400 text-center">{tool.description}</p>
            </div>
          </button>
        ))}
      </div>

      {/* Active Tool Content */}
      <div className="bg-gray-800 rounded-lg border border-gray-700 min-h-[600px]">
        {renderActiveTool()}
      </div>

      {/* Status Bar */}
      <div className="flex items-center justify-between text-sm text-gray-400 bg-gray-800 rounded-lg p-4">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Activity className="w-4 h-4" />
            <span>Status: {isMonitoring ? 'Active' : 'Paused'}</span>
          </div>
          <div className="flex items-center space-x-2">
            <RefreshCw className="w-4 h-4" />
            <span>Last Update: {new Date().toLocaleTimeString()}</span>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <span>Debug Tools v1.0.0</span>
        </div>
      </div>
    </div>
  );
};