import React, { useState } from 'react';
import { Card } from './ui/Card';
import { ipfsService } from '../services/ipfsService';
import { ViewProps } from '../types';

const MaterialIcon = ({ name, className }: { name: string, className?: string }) => (
  <span className={`material-symbols-outlined ${className}`}>{name}</span>
);

export const IPFSUploader: React.FC<ViewProps> = () => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<{ cid: string; size: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);
    setProgress(0);

    try {
      const apiKey = process.env.PINATA_API_KEY || '';
      
      // Simulate progress for large files
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90));
      }, 500);

      const uploadResult = await ipfsService.upload(file, apiKey);
      
      clearInterval(progressInterval);
      setProgress(100);
      setResult(uploadResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="p-7 h-full flex flex-col animate-fade-in">
      <h2 className="text-2xl font-bold text-white mb-7">IPFS Upload</h2>

      <Card className="p-6 max-w-2xl">
        <div className="space-y-6">
          <div className="border-2 border-dashed border-dark-border rounded-2xl p-8 text-center hover:border-primary-blue/50 transition-colors">
            <MaterialIcon name="cloud_upload" className="text-5xl text-gray-subtext mb-4" />
            <p className="text-white mb-2">Drop files here or click to upload</p>
            <p className="text-sm text-gray-subtext mb-4">
              Files over 10MB will be chunked automatically
            </p>
            <input
              type="file"
              onChange={handleUpload}
              disabled={uploading}
              className="hidden"
              id="ipfs-upload"
            />
            <label
              htmlFor="ipfs-upload"
              className="inline-flex items-center gap-2 bg-primary-blue hover:bg-blue-700 text-white px-4 py-2 rounded-2xl cursor-pointer transition-colors"
            >
              <MaterialIcon name="upload_file" />
              Select File
            </label>
          </div>

          {uploading && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-subtext">Uploading...</span>
                <span className="text-white">{progress}%</span>
              </div>
              <div className="w-full h-2 bg-dark-surface rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary-blue to-primary-teal transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {result && (
            <div className="bg-green-500/10 border border-green-500/30 rounded-2xl p-4">
              <div className="flex items-start gap-3">
                <MaterialIcon name="check_circle" className="text-green-500 text-2xl" />
                <div className="flex-1">
                  <p className="text-white font-medium mb-2">Upload Successful</p>
                  <p className="text-sm text-gray-subtext mb-1">CID: {result.cid}</p>
                  <p className="text-sm text-gray-subtext">Size: {(result.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4">
              <div className="flex items-start gap-3">
                <MaterialIcon name="error" className="text-red-500 text-2xl" />
                <div className="flex-1">
                  <p className="text-white font-medium mb-1">Upload Failed</p>
                  <p className="text-sm text-gray-subtext">{error}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};
