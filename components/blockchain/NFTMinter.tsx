import React, { useState, useCallback } from 'react';
import { Card } from '../ui/Card';
import { nftService } from '../../services/nftService';

interface NFTMetadata {
  title: string;
  description: string;
  quantity: number;
}

interface UploadProgress {
  ipfsUpload: number;
  minting: number;
}

interface NFTMinterProps {
  onMintComplete?: (assetId: string) => void;
}

export const NFTMinter: React.FC<NFTMinterProps> = ({ onMintComplete }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [metadata, setMetadata] = useState<NFTMetadata>({
    title: '',
    description: '',
    quantity: 1
  });
  const [currentStep, setCurrentStep] = useState<'upload' | 'metadata' | 'minting' | 'success'>('upload');
  const [progress, setProgress] = useState<UploadProgress>({ ipfsUpload: 0, minting: 0 });
  const [isProcessing, setIsProcessing] = useState(false);
  const [assetId, setAssetId] = useState<string>('');
  const [error, setError] = useState<string>('');

  const handleFileDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    const file = files[0];
    
    if (file && file.type.startsWith('image/')) {
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      setCurrentStep('metadata');
      setError('');
    } else {
      setError('Please select a valid image file');
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      setCurrentStep('metadata');
      setError('');
    }
  };

  const handleMetadataChange = (field: keyof NFTMetadata, value: string | number) => {
    setMetadata(prev => ({ ...prev, [field]: value }));
  };

  const handleMint = async () => {
    if (!selectedFile || !metadata.title) {
      setError('Please provide all required information');
      return;
    }

    setIsProcessing(true);
    setCurrentStep('minting');
    setError('');

    try {
      const result = await nftService.mint(
        selectedFile,
        metadata,
        (step, progressValue) => {
          if (step === 'ipfs') {
            setProgress(prev => ({ ...prev, ipfsUpload: progressValue }));
          } else if (step === 'minting') {
            setProgress(prev => ({ ...prev, minting: progressValue }));
          }
        }
      );

      setAssetId(result.assetId);
      setCurrentStep('success');
      
      onMintComplete?.(result.assetId);
    } catch (err) {
      setError('Failed to mint NFT. Please try again.');
      setCurrentStep('metadata');
    } finally {
      setIsProcessing(false);
    }
  };

  const resetMinter = () => {
    setSelectedFile(null);
    setPreviewUrl('');
    setMetadata({ title: '', description: '', quantity: 1 });
    setCurrentStep('upload');
    setProgress({ ipfsUpload: 0, minting: 0 });
    setAssetId('');
    setError('');
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <Card className="p-6">
        <h2 className="text-2xl font-bold mb-6">Mint NFT</h2>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {/* Step 1: File Upload */}
        {currentStep === 'upload' && (
          <div className="space-y-4">
            <div
              className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors cursor-pointer"
              onDrop={handleFileDrop}
              onDragOver={(e) => e.preventDefault()}
              onClick={() => document.getElementById('file-input')?.click()}
            >
              <div className="space-y-2">
                <div className="text-gray-500">
                  <svg className="mx-auto h-12 w-12" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                    <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <div className="text-lg font-medium text-gray-900">Drop your image here</div>
                <div className="text-sm text-gray-500">or click to browse</div>
              </div>
            </div>
            <input
              id="file-input"
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>
        )}

        {/* Step 2: Metadata */}
        {currentStep === 'metadata' && (
          <div className="space-y-6">
            {previewUrl && (
              <div className="text-center">
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="max-w-xs max-h-64 mx-auto rounded-lg shadow-md"
                />
              </div>
            )}
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  value={metadata.title}
                  onChange={(e) => handleMetadataChange('title', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter NFT title"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={metadata.description}
                  onChange={(e) => handleMetadataChange('description', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Describe your NFT"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Quantity
                </label>
                <input
                  type="number"
                  min="1"
                  value={metadata.quantity}
                  onChange={(e) => handleMetadataChange('quantity', parseInt(e.target.value) || 1)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={() => setCurrentStep('upload')}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Back
              </button>
              <button
                onClick={handleMint}
                disabled={!metadata.title}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Mint NFT
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Minting Progress */}
        {currentStep === 'minting' && (
          <div className="space-y-6">
            <div className="text-center">
              <div className="text-lg font-medium mb-4">Minting your NFT...</div>
              
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span>Uploading to IPFS</span>
                    <span>{progress.ipfsUpload}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${progress.ipfsUpload}%` }}
                    />
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span>Minting on Blockchain</span>
                    <span>{progress.minting}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${progress.minting}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Success */}
        {currentStep === 'success' && (
          <div className="text-center space-y-4">
            <div className="text-green-600">
              <svg className="mx-auto h-16 w-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">NFT Minted Successfully!</h3>
              <p className="text-gray-600 mb-4">Your NFT has been created and is now available on the blockchain.</p>
              <div className="bg-gray-100 p-3 rounded-md">
                <div className="text-sm text-gray-600">Asset ID:</div>
                <div className="font-mono text-sm break-all">{assetId}</div>
              </div>
            </div>
            <button
              onClick={resetMinter}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Mint Another NFT
            </button>
          </div>
        )}
      </Card>
    </div>
  );
};