import React, { useState } from 'react';

export const BudgetModal: React.FC<{ promotionId: string; isOpen: boolean; onClose: () => void }> = ({
  promotionId, isOpen, onClose
}) => {
  const [amount, setAmount] = useState<number>(0);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleDeposit = async () => {
    if (amount <= 0) return alert("Enter a valid amount");
    setLoading(true);
    try {
      // await blockchainService.depositFunds(promotionId, amount);
      alert(`Successfully added ${amount} XLM to promotion!`);
      onClose();
    } catch (error) {
      console.error("Deposit failed", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white p-6 rounded-lg w-96">
        <h2 className="text-xl font-bold mb-4">Add Budget</h2>
        <input 
          type="number" 
          value={amount} 
          onChange={(e) => setAmount(Number(e.target.value))}
          className="w-full border p-2 mb-4"
          placeholder="Amount in XLM"
        />
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2">Cancel</button>
          <button 
            onClick={handleDeposit} 
            className="px-4 py-2 bg-green-600 text-white rounded"
            disabled={loading}
          >
            {loading ? 'Processing...' : 'Confirm Deposit'}
          </button>
        </div>
      </div>
    </div>
  );
};