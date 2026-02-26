import React from 'react';
import { TransactionQueueManager } from './TransactionQueueManager';
import { Package } from 'lucide-react';
import '../utils/demo';

export const StagingDock: React.FC = () => {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Package className="w-6 h-6 text-primary-teal" />
        <h1 className="text-2xl font-bold text-white">Staging Dock</h1>
      </div>

      <div className="grid gap-6">
        <TransactionQueueManager />
      </div>
    </div>
  );
};
