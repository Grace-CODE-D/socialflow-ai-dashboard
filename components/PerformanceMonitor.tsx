import React, { useState, useEffect } from 'react';
import { Card } from './ui/Card';
import stellarService from '../services/stellarService';
import { ViewProps } from '../types';

const MaterialIcon = ({ name, className }: { name: string, className?: string }) => (
  <span className={`material-symbols-outlined ${className}`}>{name}</span>
);

export const PerformanceMonitor: React.FC<ViewProps> = () => {
  const [poolStats, setPoolStats] = useState<any[]>([]);
  const [cacheStats, setCacheStats] = useState<any>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setPoolStats(stellarService.getPoolStats());
      setCacheStats(stellarService.getCacheStats());
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="p-7 h-full flex flex-col animate-fade-in">
      <h2 className="text-2xl font-bold text-white mb-7">Performance Monitor</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Connection Pool Stats */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <MaterialIcon name="hub" className="text-primary-blue text-2xl" />
            <h3 className="text-lg font-bold text-white">Connection Pool</h3>
          </div>
          <div className="space-y-3">
            {poolStats.map((conn) => (
              <div key={conn.id} className="flex items-center justify-between p-3 bg-dark-surface rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${conn.healthy ? 'bg-green-500' : 'bg-red-500'}`} />
                  <span className="text-white font-medium">Connection {conn.id + 1}</span>
                </div>
                <div className="flex gap-4 text-sm">
                  <span className="text-gray-subtext">Active: <span className="text-white">{conn.activeRequests}</span></span>
                  <span className="text-gray-subtext">Total: <span className="text-white">{conn.totalRequests}</span></span>
                  <span className="text-gray-subtext">Errors: <span className="text-red-400">{conn.errors}</span></span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Cache Stats */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <MaterialIcon name="storage" className="text-primary-teal text-2xl" />
            <h3 className="text-lg font-bold text-white">Cache Performance</h3>
          </div>
          {cacheStats && (
            <div className="space-y-4">
              {/* Balance Cache */}
              <div className="p-3 bg-dark-surface rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-white font-medium">Balance Cache</span>
                  <span className="text-primary-blue font-bold">{cacheStats.balance.hitRate}%</span>
                </div>
                <div className="flex gap-4 text-xs text-gray-subtext">
                  <span>Hits: {cacheStats.balance.hits}</span>
                  <span>Misses: {cacheStats.balance.misses}</span>
                  <span>Size: {cacheStats.balance.size}</span>
                </div>
              </div>

              {/* TX History Cache */}
              <div className="p-3 bg-dark-surface rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-white font-medium">TX History Cache</span>
                  <span className="text-primary-blue font-bold">{cacheStats.txHistory.hitRate}%</span>
                </div>
                <div className="flex gap-4 text-xs text-gray-subtext">
                  <span>Hits: {cacheStats.txHistory.hits}</span>
                  <span>Misses: {cacheStats.txHistory.misses}</span>
                  <span>Size: {cacheStats.txHistory.size}</span>
                </div>
              </div>

              {/* IPFS Cache */}
              <div className="p-3 bg-dark-surface rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-white font-medium">IPFS Cache</span>
                  <span className="text-primary-blue font-bold">{cacheStats.ipfs.hitRate}%</span>
                </div>
                <div className="flex gap-4 text-xs text-gray-subtext">
                  <span>Hits: {cacheStats.ipfs.hits}</span>
                  <span>Misses: {cacheStats.ipfs.misses}</span>
                  <span>Size: {cacheStats.ipfs.size}</span>
                </div>
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Performance Metrics */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <MaterialIcon name="speed" className="text-yellow-500 text-2xl" />
          <h3 className="text-lg font-bold text-white">System Metrics</h3>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-4 bg-dark-surface rounded-lg">
            <p className="text-2xl font-bold text-primary-blue">
              {poolStats.reduce((sum, c) => sum + c.totalRequests, 0)}
            </p>
            <p className="text-sm text-gray-subtext mt-1">Total Requests</p>
          </div>
          <div className="text-center p-4 bg-dark-surface rounded-lg">
            <p className="text-2xl font-bold text-green-500">
              {poolStats.filter(c => c.healthy).length}/{poolStats.length}
            </p>
            <p className="text-sm text-gray-subtext mt-1">Healthy Connections</p>
          </div>
          <div className="text-center p-4 bg-dark-surface rounded-lg">
            <p className="text-2xl font-bold text-primary-teal">
              {cacheStats ? (
                ((parseInt(cacheStats.balance.hitRate) + parseInt(cacheStats.txHistory.hitRate) + parseInt(cacheStats.ipfs.hitRate)) / 3).toFixed(1)
              ) : '0'}%
            </p>
            <p className="text-sm text-gray-subtext mt-1">Avg Cache Hit Rate</p>
          </div>
        </div>
      </Card>
    </div>
  );
};
