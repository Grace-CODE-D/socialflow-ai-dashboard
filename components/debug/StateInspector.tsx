import React, { useState, useEffect } from 'react';
import { stateInspector } from '../../services/stateInspector';
import { AppState } from '../../types';
import { 
  Eye, 
  History, 
  Search, 
  Download, 
  Upload,
  Trash2,
  ChevronRight,
  ChevronDown,
  Edit3,
  Save,
  X
} from 'lucide-react';

interface StateNode {
  key: string;
  value: any;
  path: string;
  isExpanded: boolean;
  isEditing: boolean;
}

export const StateInspector: React.FC = () => {
  const [state, setState] = useState<AppState | null>(null);
  const [stateHistory, setStateHistory] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set());
  const [editingPath, setEditingPath] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'current' | 'history' | 'search'>('current');

  useEffect(() => {
    const unsubscribe = stateInspector.subscribe((path, oldValue, newValue) => {
      setState(stateInspector.getState());
      setStateHistory(stateInspector.getStateHistory());
    });

    // Load initial data
    setState(stateInspector.getState());
    setStateHistory(stateInspector.getStateHistory());

    return unsubscribe;
  }, []);

  const toggleExpanded = (path: string) => {
    const newExpanded = new Set(expandedPaths);
    if (newExpanded.has(path)) {
      newExpanded.delete(path);
    } else {
      newExpanded.add(path);
    }
    setExpandedPaths(newExpanded);
  };

  const startEditing = (path: string, value: any) => {
    setEditingPath(path);
    setEditValue(typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value));
  };

  const saveEdit = () => {
    if (!editingPath) return;
    
    try {
      let newValue;
      try {
        newValue = JSON.parse(editValue);
      } catch {
        newValue = editValue;
      }
      
      stateInspector.updateState(editingPath, newValue);
      setEditingPath(null);
      setEditValue('');
    } catch (error) {
      console.error('Failed to update state:', error);
    }
  };

  const cancelEdit = () => {
    setEditingPath(null);
    setEditValue('');
  };

  const renderValue = (value: any, path: string, depth: number = 0): React.ReactNode => {
    if (value === null) return <span className="text-gray-500">null</span>;
    if (value === undefined) return <span className="text-gray-500">undefined</span>;
    
    const isExpanded = expandedPaths.has(path);
    const isEditing = editingPath === path;
    
    if (typeof value === 'object' && !Array.isArray(value)) {
      const keys = Object.keys(value);
      
      return (
        <div className={depth > 0 ? 'ml-4' : ''}>
          <div className="flex items-center space-x-2 group">
            <button
              onClick={() => toggleExpanded(path)}
              className="flex items-center space-x-1 text-gray-400 hover:text-white"
            >
              {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              <span className="text-blue-400">Object</span>
              <span className="text-gray-500">({keys.length} keys)</span>
            </button>
            <button
              onClick={() => startEditing(path, value)}
              className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-white"
            >
              <Edit3 className="w-3 h-3" />
            </button>
          </div>
          
          {isExpanded && (
            <div className="ml-4 mt-2 space-y-1">
              {keys.map(key => (
                <div key={key} className="flex items-start space-x-2">
                  <span className="text-purple-400 font-mono text-sm">{key}:</span>
                  <div className="flex-1">
                    {renderValue(value[key], `${path}.${key}`, depth + 1)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }
    
    if (Array.isArray(value)) {
      return (
        <div className={depth > 0 ? 'ml-4' : ''}>
          <div className="flex items-center space-x-2 group">
            <button
              onClick={() => toggleExpanded(path)}
              className="flex items-center space-x-1 text-gray-400 hover:text-white"
            >
              {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              <span className="text-green-400">Array</span>
              <span className="text-gray-500">({value.length} items)</span>
            </button>
            <button
              onClick={() => startEditing(path, value)}
              className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-white"
            >
              <Edit3 className="w-3 h-3" />
            </button>
          </div>
          
          {isExpanded && (
            <div className="ml-4 mt-2 space-y-1">
              {value.map((item, index) => (
                <div key={index} className="flex items-start space-x-2">
                  <span className="text-yellow-400 font-mono text-sm">[{index}]:</span>
                  <div className="flex-1">
                    {renderValue(item, `${path}[${index}]`, depth + 1)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }
    
    // Primitive values
    if (isEditing) {
      return (
        <div className="flex items-center space-x-2">
          <input
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            className="flex-1 px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm"
            onKeyDown={(e) => {
              if (e.key === 'Enter') saveEdit();
              if (e.key === 'Escape') cancelEdit();
            }}
            autoFocus
          />
          <button onClick={saveEdit} className="text-green-400 hover:text-green-300">
            <Save className="w-3 h-3" />
          </button>
          <button onClick={cancelEdit} className="text-red-400 hover:text-red-300">
            <X className="w-3 h-3" />
          </button>
        </div>
      );
    }
    
    const getValueColor = (val: any) => {
      if (typeof val === 'string') return 'text-green-300';
      if (typeof val === 'number') return 'text-blue-300';
      if (typeof val === 'boolean') return 'text-yellow-300';
      return 'text-gray-300';
    };
    
    return (
      <div className="flex items-center space-x-2 group">
        <span className={`font-mono text-sm ${getValueColor(value)}`}>
          {typeof value === 'string' ? `"${value}"` : String(value)}
        </span>
        <button
          onClick={() => startEditing(path, value)}
          className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-white"
        >
          <Edit3 className="w-3 h-3" />
        </button>
      </div>
    );
  };

  const searchResults = searchTerm ? stateInspector.searchState(searchTerm) : [];

  const exportState = () => {
    const data = stateInspector.exportState();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `app-state-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importState = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (stateInspector.importState(content)) {
        setState(stateInspector.getState());
      } else {
        alert('Failed to import state. Please check the file format.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="p-6 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-white">State Inspector</h2>
        <div className="flex items-center space-x-3">
          <label className="flex items-center space-x-2 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors cursor-pointer">
            <Upload className="w-4 h-4" />
            <span>Import</span>
            <input
              type="file"
              accept=".json"
              onChange={importState}
              className="hidden"
            />
          </label>
          <button
            onClick={exportState}
            className="flex items-center space-x-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Export</span>
          </button>
          <button
            onClick={() => stateInspector.clearHistory()}
            className="flex items-center space-x-2 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            <span>Clear History</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-4 mb-6">
        {[
          { id: 'current', label: 'Current State', icon: <Eye className="w-4 h-4" /> },
          { id: 'history', label: 'History', icon: <History className="w-4 h-4" /> },
          { id: 'search', label: 'Search', icon: <Search className="w-4 h-4" /> }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
              activeTab === tab.id
                ? 'bg-primary-blue text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'current' && state && (
          <div className="h-full overflow-y-auto bg-gray-800 rounded-lg p-4">
            <div className="space-y-2">
              {Object.entries(state).map(([key, value]) => (
                <div key={key} className="border-b border-gray-700 pb-2">
                  <div className="flex items-start space-x-2">
                    <span className="text-purple-400 font-mono font-semibold">{key}:</span>
                    <div className="flex-1">
                      {renderValue(value, key)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="h-full overflow-y-auto bg-gray-800 rounded-lg p-4">
            <div className="space-y-3">
              {stateHistory.map((change, index) => (
                <div key={index} className="bg-gray-700 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white font-medium">{change.path}</span>
                    <span className="text-gray-400 text-sm">
                      {new Date(change.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-red-400">Old:</span>
                      <pre className="text-gray-300 font-mono text-xs mt-1 bg-gray-800 p-2 rounded">
                        {JSON.stringify(change.oldValue, null, 2)}
                      </pre>
                    </div>
                    <div>
                      <span className="text-green-400">New:</span>
                      <pre className="text-gray-300 font-mono text-xs mt-1 bg-gray-800 p-2 rounded">
                        {JSON.stringify(change.newValue, null, 2)}
                      </pre>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'search' && (
          <div className="h-full flex flex-col">
            <div className="mb-4">
              <input
                type="text"
                placeholder="Search state keys and values..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-primary-blue"
              />
            </div>
            <div className="flex-1 overflow-y-auto bg-gray-800 rounded-lg p-4">
              {searchResults.length > 0 ? (
                <div className="space-y-2">
                  {searchResults.map((result, index) => (
                    <div key={index} className="bg-gray-700 rounded-lg p-3">
                      <div className="text-purple-400 font-mono text-sm mb-2">
                        {result.path}
                      </div>
                      <pre className="text-gray-300 font-mono text-xs bg-gray-800 p-2 rounded">
                        {JSON.stringify(result.value, null, 2)}
                      </pre>
                    </div>
                  ))}
                </div>
              ) : searchTerm ? (
                <div className="text-center text-gray-400 mt-8">
                  <Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No results found for "{searchTerm}"</p>
                </div>
              ) : (
                <div className="text-center text-gray-400 mt-8">
                  <Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Enter a search term to find state properties</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};