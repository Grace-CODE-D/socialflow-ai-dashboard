import React, { useState } from 'react';

export const PromotionBudgetSetup: React.FC<{ post: any; onClose: () => void }> = ({ post, onClose }) => {
  const [budget, setBudget] = useState(10);
  const [goal, setGoal] = useState('engagement');
  const [duration, setDuration] = useState(7);

  // Requirement 13.2: Display estimated reach
  const estimatedReach = budget * 50; // Simple logic: 1 XLM = 50 views

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white p-8 rounded-xl w-full max-w-md shadow-2xl">
        <h3 className="text-xl font-bold mb-4">Setup Promotion</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Budget (XLM)</label>
            <input 
              type="number" 
              value={budget} 
              onChange={(e) => setBudget(Number(e.target.value))}
              className="w-full border rounded p-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Campaign Goal</label>
            <select value={goal} onChange={(e) => setGoal(e.target.value)} className="w-full border rounded p-2">
              <option value="views">Maximize Views</option>
              <option value="clicks">Maximize Clicks</option>
              <option value="engagement">Maximize Engagement</option>
            </select>
          </div>

          <div className="bg-indigo-50 p-4 rounded-lg">
            <p className="text-sm text-indigo-800">**Estimated Reach:** {estimatedReach.toLocaleString()} people</p>
            <p className="text-xs text-indigo-600 mt-1">Budget Breakdown: {budget * 0.9} XLM for reach, {budget * 0.1} XLM network fees.</p>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button onClick={onClose} className="text-gray-600 px-4 py-2">Cancel</button>
          <button className="bg-indigo-600 text-white px-6 py-2 rounded font-bold">Launch Promotion</button>
        </div>
      </div>
    </div>
  );
};