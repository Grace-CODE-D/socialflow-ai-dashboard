import React, { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Wallet, AlertTriangle, TrendingUp, Activity, DollarSign } from 'lucide-react';
import { Card } from './ui/Card';
import {
  detectWhales,
  getWhaleTransactionHistory,
  generateWhaleAlerts,
  generateWhaleEngagementReport,
  WhaleProfile,
  WhaleTransaction,
  WhaleAlert
} from '../services/whaleIdentificationService';

export const WhaleIdentification: React.FC = () => {
  const [whales, setWhales] = useState<WhaleProfile[]>([]);
  const [selectedWhale, setSelectedWhale] = useState<WhaleProfile | null>(null);
  const [transactions, setTransactions] = useState<WhaleTransaction[]>([]);
  const [alerts, setAlerts] = useState<WhaleAlert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWhaleData();
  }, []);

  const loadWhaleData = async () => {
    setLoading(true);
    try {
      const whaleData = await detectWhales();
      setWhales(whaleData);
      setAlerts(generateWhaleAlerts(whaleData));
      if (whaleData.length > 0) {
        setSelectedWhale(whaleData[0]);
        const txHistory = await getWhaleTransactionHistory(whaleData[0].walletAddress);
        setTransactions(txHistory);
      }
    } catch (error) {
      console.error('Failed to load whale data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleWhaleSelect = async (whale: WhaleProfile) => {
    setSelectedWhale(whale);
    const txHistory = await getWhaleTransactionHistory(whale.walletAddress);
    setTransactions(txHistory);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400">Detecting whales...</div>
      </div>
    );
  }

  const report = generateWhaleEngagementReport(whales);

  const getSeverityColor = (severity: WhaleAlert['severity']) => {
    switch (severity) {
      case 'high': return 'text-red-400 bg-red-400/10';
      case 'medium': return 'text-orange-400 bg-orange-400/10';
      case 'low': return 'text-blue-400 bg-blue-400/10';
    }
  };

  const getTransactionColor = (type: WhaleTransaction['type']) => {
    switch (type) {
      case 'buy': return 'text-green-400 bg-green-400/10';
      case 'sell': return 'text-red-400 bg-red-400/10';
      case 'transfer': return 'text-blue-400 bg-blue-400/10';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Whale Identification</h2>
          <p className="text-gray-400 mt-1">Track and analyze high-value wallet activity</p>
        </div>
        <button
          onClick={loadWhaleData}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
        >
          Refresh Data
        </button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gray-800 border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Total Whales</p>
              <p className="text-2xl font-bold text-white mt-1">{report.totalWhales}</p>
            </div>
            <Wallet className="text-purple-500" size={32} />
          </div>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Avg Portfolio</p>
              <p className="text-2xl font-bold text-white mt-1">
                ${(report.avgPortfolio / 1000).toFixed(0)}k
              </p>
            </div>
            <DollarSign className="text-green-500" size={32} />
          </div>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">High Engagement</p>
              <p className="text-2xl font-bold text-white mt-1">{report.highEngagementCount}</p>
              <p className="text-xs text-blue-400 mt-1">{report.highEngagementPercentage.toFixed(1)}%</p>
            </div>
            <Activity className="text-blue-500" size={32} />
          </div>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Active Alerts</p>
              <p className="text-2xl font-bold text-white mt-1">{alerts.length}</p>
            </div>
            <AlertTriangle className="text-orange-500" size={32} />
          </div>
        </Card>
      </div>

      {/* Alerts Section */}
      <Card className="bg-gray-800 border-gray-700">
        <h3 className="text-lg font-semibold text-white mb-4">Recent Whale Alerts</h3>
        <div className="space-y-3">
          {alerts.slice(0, 5).map((alert) => (
            <div key={alert.id} className="flex items-start gap-3 p-3 bg-gray-750 rounded-lg">
              <AlertTriangle className={getSeverityColor(alert.severity).split(' ')[0].replace('text-', '')} size={20} />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-xs px-2 py-1 rounded ${getSeverityColor(alert.severity)}`}>
                    {alert.severity.toUpperCase()}
                  </span>
                  <span className="text-xs text-gray-400">
                    {new Date(alert.timestamp).toLocaleString()}
                  </span>
                </div>
                <p className="text-white text-sm">{alert.message}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Whale List and Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="bg-gray-800 border-gray-700 lg:col-span-1">
          <h3 className="text-lg font-semibold text-white mb-4">Top Whales</h3>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {whales.slice(0, 15).map((whale) => (
              <div
                key={whale.walletAddress}
                onClick={() => handleWhaleSelect(whale)}
                className={`p-3 rounded-lg cursor-pointer transition-colors ${
                  selectedWhale?.walletAddress === whale.walletAddress
                    ? 'bg-purple-600/20 border border-purple-500'
                    : 'bg-gray-750 hover:bg-gray-700'
                }`}
              >
                <p className="text-white font-mono text-sm">
                  {whale.walletAddress.slice(0, 6)}...{whale.walletAddress.slice(-4)}
                </p>
                <p className="text-gray-400 text-xs mt-1">
                  ${(whale.portfolioValue / 1000).toFixed(0)}k
                </p>
              </div>
            ))}
          </div>
        </Card>

        <Card className="bg-gray-800 border-gray-700 lg:col-span-2">
          <h3 className="text-lg font-semibold text-white mb-4">
            Whale Details: {selectedWhale?.walletAddress.slice(0, 10)}...
          </h3>
          {selectedWhale && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-gray-400 text-xs">Portfolio Value</p>
                  <p className="text-white font-bold">${selectedWhale.portfolioValue.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs">Transactions</p>
                  <p className="text-white font-bold">{selectedWhale.totalTransactions}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs">Engagement Score</p>
                  <p className="text-white font-bold">{selectedWhale.engagementScore.toFixed(1)}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs">Following Since</p>
                  <p className="text-white font-bold">
                    {new Date(selectedWhale.followingSince).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-gray-400 text-xs mb-2">Top Holdings</p>
                <div className="flex gap-2">
                  {selectedWhale.topTokens.map((token) => (
                    <div key={token.symbol} className="px-3 py-2 bg-gray-750 rounded-lg">
                      <p className="text-white font-bold text-sm">{token.symbol}</p>
                      <p className="text-gray-400 text-xs">${(token.value / 1000).toFixed(1)}k</p>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-white font-semibold mb-3">Recent Transactions</h4>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {transactions.map((tx) => (
                    <div key={tx.id} className="flex items-center justify-between p-2 bg-gray-750 rounded">
                      <div className="flex items-center gap-3">
                        <span className={`text-xs px-2 py-1 rounded ${getTransactionColor(tx.type)}`}>
                          {tx.type.toUpperCase()}
                        </span>
                        <div>
                          <p className="text-white text-sm">{tx.tokenSymbol}</p>
                          <p className="text-gray-400 text-xs">
                            {new Date(tx.timestamp).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-white text-sm">${tx.value.toLocaleString()}</p>
                        <p className="text-gray-400 text-xs">{tx.amount.toFixed(2)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};
