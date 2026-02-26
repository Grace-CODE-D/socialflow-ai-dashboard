import React, { useState } from 'react';
import { UnifiedOverview } from './UnifiedFlow';

export const AccountPerformance: React.FC = () => {
  // Widget visibility preferences
  const [visibleWidgets, setVisibleWidgets] = useState(['overview', 'rewards', 'tokens']);
  
  const toggleWidget = (id: string) => {
    setVisibleWidgets(prev => 
      prev.includes(id) ? prev.filter(w => w !== id) : [...prev, id]
    );
  };

  return (
    <div className="p-4 md:p-8 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900">Account Performance</h1>
        <div className="flex gap-2">
          {/* Widget Toggle Controls */}
          {['overview', 'rewards', 'tokens'].map(id => (
            <button 
              key={id}
              onClick={() => toggleWidget(id)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                visibleWidgets.includes(id) ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-600'
              }`}
            >
              {id.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Responsive Widget Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {visibleWidgets.includes('overview') && (
          <div className="lg:col-span-3 cursor-move">
             <UnifiedOverview />
          </div>
        )}
        
        {/* Placeholder for future widgets like RewardTimeline or TokenDetail */}
        {visibleWidgets.includes('rewards') && (
          <div className="bg-white p-6 rounded-xl shadow-sm h-64 flex items-center justify-center text-gray-400 border-2 border-dashed">
            Rewards Widget (Drag to Reorder)
          </div>
        )}
      </div>
    </div>
  );
};