import React from 'react';

export const TokenDetailView: React.FC<{ token: any }> = ({ token }) => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">{token.code} Performance</h2>
        <span className="text-xl font-mono">{token.balance} {token.code}</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Token Metrics */}
        <div className="p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-600">Total Transactions</p>
          <p className="text-2xl font-bold">{token.txCount}</p>
        </div>
        <div className="p-4 bg-purple-50 rounded-lg">
          <p className="text-sm text-purple-600">Holder Count</p>
          <p className="text-2xl font-bold">{token.holders || 'N/A'}</p>
        </div>
        <div className="p-4 bg-green-50 rounded-lg">
          <p className="text-sm text-green-600">Current Price</p>
          <p className="text-2xl font-bold">${token.price || '0.00'}</p>
        </div>
      </div>

      {/* Placeholder for Balance History Chart */}
      <div className="h-64 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200 flex items-center justify-center">
        
      </div>
    </div>
  );
};