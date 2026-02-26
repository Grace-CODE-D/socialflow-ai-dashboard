import React, { useState } from 'react';
import { Check, Copy, ExternalLink } from 'lucide-react';
import { Card } from '../ui/Card';

type Platform = 'instagram' | 'tiktok' | 'facebook' | 'youtube' | 'linkedin' | 'x';

interface VerificationWizardProps {
  onComplete: (platform: Platform, postUrl: string) => void;
}

export const VerificationWizard: React.FC<VerificationWizardProps> = ({ onComplete }) => {
  const [step, setStep] = useState(1);
  const [selectedPlatform, setSelectedPlatform] = useState<Platform | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [postUrl, setPostUrl] = useState('');
  const [copied, setCopied] = useState(false);

  const platforms = [
    { id: 'instagram' as Platform, name: 'Instagram', icon: '📷', color: 'bg-pink-600' },
    { id: 'tiktok' as Platform, name: 'TikTok', icon: '🎵', color: 'bg-black' },
    { id: 'facebook' as Platform, name: 'Facebook', icon: '👥', color: 'bg-blue-600' },
    { id: 'youtube' as Platform, name: 'YouTube', icon: '▶️', color: 'bg-red-600' },
    { id: 'linkedin' as Platform, name: 'LinkedIn', icon: '💼', color: 'bg-blue-700' },
    { id: 'x' as Platform, name: 'X (Twitter)', icon: '𝕏', color: 'bg-gray-900' }
  ];

  const generateCode = () => {
    const code = `VERIFY-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
    setVerificationCode(code);
    setStep(2);
  };

  const handlePlatformSelect = (platform: Platform) => {
    setSelectedPlatform(platform);
    generateCode();
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(verificationCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = () => {
    if (selectedPlatform && postUrl) {
      onComplete(selectedPlatform, postUrl);
    }
  };

  return (
    <Card className="max-w-3xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center flex-1">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${step >= s ? 'bg-primary-blue text-white' : 'bg-dark-bg text-gray-subtext'}`}>
                {step > s ? <Check size={20} /> : s}
              </div>
              {s < 3 && <div className={`flex-1 h-1 mx-2 ${step > s ? 'bg-primary-blue' : 'bg-dark-bg'}`} />}
            </div>
          ))}
        </div>
        <div className="text-center">
          <h3 className="text-xl font-bold text-white">
            {step === 1 && 'Select Platform'}
            {step === 2 && 'Post Verification Code'}
            {step === 3 && 'Submit Post URL'}
          </h3>
        </div>
      </div>

      {step === 1 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {platforms.map((platform) => (
            <button
              key={platform.id}
              onClick={() => handlePlatformSelect(platform.id)}
              className="p-6 bg-dark-bg hover:bg-dark-surface border-2 border-dark-border hover:border-primary-blue rounded-xl transition-all text-center"
            >
              <div className="text-4xl mb-2">{platform.icon}</div>
              <div className="text-white font-semibold">{platform.name}</div>
            </button>
          ))}
        </div>
      )}

      {step === 2 && selectedPlatform && (
        <div className="space-y-6">
          <div className="bg-dark-bg p-6 rounded-xl">
            <h4 className="text-white font-semibold mb-4">Your Verification Code:</h4>
            <div className="flex items-center gap-3 bg-dark-surface p-4 rounded-lg">
              <code className="flex-1 text-primary-teal font-mono text-lg">{verificationCode}</code>
              <button onClick={copyToClipboard} className="px-4 py-2 bg-primary-blue hover:bg-primary-teal text-white rounded-lg transition-colors flex items-center gap-2">
                {copied ? <Check size={18} /> : <Copy size={18} />}
                <span>{copied ? 'Copied!' : 'Copy'}</span>
              </button>
            </div>
          </div>

          <div className="bg-dark-bg p-6 rounded-xl">
            <h4 className="text-white font-semibold mb-3">Instructions:</h4>
            <ol className="text-gray-subtext space-y-2 list-decimal list-inside">
              <li>Copy the verification code above</li>
              <li>Create a new post on {platforms.find(p => p.id === selectedPlatform)?.name}</li>
              <li>Include the verification code in your post</li>
              <li>Publish the post and copy its URL</li>
              <li>Return here and paste the URL in the next step</li>
            </ol>
          </div>

          <button onClick={() => setStep(3)} className="w-full px-6 py-3 bg-primary-blue hover:bg-primary-teal text-white rounded-lg transition-colors">
            Continue to Next Step
          </button>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-6">
          <div>
            <label className="block text-sm text-gray-subtext mb-2">Post URL *</label>
            <input
              type="url"
              value={postUrl}
              onChange={(e) => setPostUrl(e.target.value)}
              placeholder={`https://${selectedPlatform}.com/...`}
              className="w-full bg-dark-bg text-white px-4 py-3 rounded-lg border border-dark-border focus:border-primary-blue outline-none"
            />
            <p className="text-sm text-gray-subtext mt-2">Paste the URL of your post containing the verification code</p>
          </div>

          <div className="flex gap-3">
            <button onClick={() => setStep(2)} className="flex-1 px-6 py-3 bg-dark-bg hover:bg-gray-700 text-white rounded-lg transition-colors">
              Back
            </button>
            <button onClick={handleSubmit} disabled={!postUrl} className="flex-1 px-6 py-3 bg-primary-blue hover:bg-primary-teal text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
              <span>Verify Account</span>
              <ExternalLink size={18} />
            </button>
          </div>
        </div>
      )}
    </Card>
  );
};
