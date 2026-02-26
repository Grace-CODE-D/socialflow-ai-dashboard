import React, { useState } from 'react';

interface PromotionControlsProps {
  promotionId: string;
  status: 'active' | 'paused' | 'ended';
  budget: number;
  onUpdate: () => void; // Refresh data after blockchain tx
}

export const PromotionControls: React.FC<PromotionControlsProps> = ({ 
  promotionId, status, budget, onUpdate 
}) => {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleAction = async (actionType: 'pause' | 'resume' | 'end') => {
    setIsProcessing(true);
    try {
      // Logic for calling your blockchain service layer
      console.log(`Triggering ${actionType} for ${promotionId}`);
      // await blockchainService.updateStatus(promotionId, actionType);
      onUpdate();
    } catch (error) {
      console.error("Blockchain transaction failed:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="p-4 border rounded-lg bg-gray-50 shadow-sm">
      <h4 className="font-bold mb-2">Promotion Management</h4>
      <div className="flex flex-wrap gap-2">
        {status !== 'ended' && (
          <button 
            onClick={() => handleAction(status === 'active' ? 'pause' : 'resume')}
            disabled={isProcessing}
            className="px-4 py-2 bg-blue-600 text-white rounded disabled:bg-gray-400"
          >
            {status === 'active' ? 'Pause Promotion' : 'Resume Promotion'}
          </button>
        )}
        
        <button 
          onClick={() => handleAction('end')}
          disabled={isProcessing || status === 'ended'}
          className="px-4 py-2 bg-red-500 text-white rounded disabled:bg-gray-400"
        >
          End & Refund Unused
        </button>
      </div>
      <p className="mt-2 text-sm text-gray-600">Current Budget: **{budget} XLM**</p>
    </div>
  );
};

