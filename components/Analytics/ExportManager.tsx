import React, { useState } from 'react';
import { exportToPDF, exportToCSV } from '/home/afolarinwa-soleye/socialflow-ai-dashboard/components/Tokens/TokenDetailView.tsx';

export const ExportManager: React.FC = () => {
  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleExport = async (type: 'PDF' | 'CSV') => {
    setIsExporting(true);
    setProgress(20); // Initial progress
    
    try {
      if (type === 'PDF') {
        await exportToPDF('report-container', setProgress);
      } else {
        await exportToCSV(setProgress);
      }
      setProgress(100);
      setTimeout(() => setIsExporting(false), 1000);
    } catch (error) {
      console.error("Export failed", error);
      setIsExporting(false);
    }
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow border border-gray-100">
      <h3 className="text-lg font-bold mb-4">Export Performance Report</h3>
      <div className="flex gap-4 items-center">
        <input type="date" className="border p-2 rounded" title="Start Date" />
        <input type="date" className="border p-2 rounded" title="End Date" />
        
        <button 
          onClick={() => handleExport('PDF')}
          disabled={isExporting}
          className="bg-red-600 text-white px-4 py-2 rounded disabled:bg-gray-400"
        >
          Export PDF
        </button>
        <button 
          onClick={() => handleExport('CSV')}
          disabled={isExporting}
          className="bg-green-600 text-white px-4 py-2 rounded disabled:bg-gray-400"
        >
          Export CSV
        </button>
      </div>

      {isExporting && (
        <div className="mt-4 w-full bg-gray-200 rounded-full h-2">
          <div className="bg-blue-600 h-2 rounded-full transition-all" style={{ width: `${progress}%` }}></div>
          <p className="text-xs mt-1">Exporting... {progress}%</p>
        </div>
      )}
    </div>
  );
};