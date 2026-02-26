import React, { useState, useRef, useEffect } from 'react';
import { Card } from './ui/Card';
import { Platform, ViewProps, View, MonetizationSettings } from '../types';
import { generateCaption } from '../services/geminiService';
import { uploadToIPFS } from '../services/nftService';
import { SiInstagram, SiFacebook, SiLinkedin } from 'react-icons/si';
import { FaXTwitter } from 'react-icons/fa6';

const MaterialIcon = ({ name, className }: { name: string, className?: string }) => (
  <span className={`material-symbols-outlined ${className}`}>{name}</span>
);

export const CreatePost: React.FC<ViewProps> = ({ onNavigate }) => {
  const [selectedPlatforms, setSelectedPlatforms] = useState<Platform[]>([Platform.INSTAGRAM]);
  const [caption, setCaption] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [topic, setTopic] = useState('');
  const [isEditingTopic, setIsEditingTopic] = useState(false);
  const [tempTopic, setTempTopic] = useState('');
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [saveStatus, setSaveStatus] = useState('');
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('10:00');
  const [monetization, setMonetization] = useState<MonetizationSettings>({
    enableTips: false,
    payPerView: false,
    subscriptionOnly: false,
    tipAmount: 0,
    accessPrice: 0,
    selectedToken: 'XLM'
  });

  const getTodayString = () => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  useEffect(() => {
    const savedDraft = localStorage.getItem('socialflow-draft');
    if (savedDraft) {
      const draft = JSON.parse(savedDraft);
      setCaption(draft.caption || '');
      setSelectedPlatforms(draft.selectedPlatforms || [Platform.INSTAGRAM]);
      setMediaPreview(draft.mediaPreview || null);
      setTopic(draft.topic || '');
      setScheduleDate(draft.scheduleDate || getTodayString());
      setScheduleTime(draft.scheduleTime || '10:00');
      setMonetization(draft.monetization || {
        enableTips: false,
        payPerView: false,
        subscriptionOnly: false,
        tipAmount: 0,
        accessPrice: 0,
        selectedToken: 'XLM'
      });
      setSaveStatus('Draft loaded');
      setTimeout(() => setSaveStatus(''), 2000);
    } else {
      setScheduleDate(getTodayString());
    }
  }, []);

  const togglePlatform = (p: Platform) => {
    if (selectedPlatforms.includes(p)) {
      setSelectedPlatforms(prev => prev.filter(item => item !== p));
    } else {
      setSelectedPlatforms(prev => [...prev, p]);
    }
  };

  const handleAiGenerate = async () => {
    if (!topic) return;
    setIsGenerating(true);
    const generatedText = await generateCaption(topic, selectedPlatforms[0]);
    setCaption(generatedText);
    setIsGenerating(false);
  };

  const handleMediaClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setMediaFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        const url = reader.result as string;
        setMediaPreview(url);
      };
      reader.readAsDataURL(file);
    }
  };

  const insertAtCursor = (text: string) => {
    setCaption(prev => prev + text);
  };

  const handleSaveDraft = () => {
    const draft = { caption, selectedPlatforms, mediaPreview, topic, scheduleDate, scheduleTime, monetization };
    localStorage.setItem('socialflow-draft', JSON.stringify(draft));
    setSaveStatus('Draft saved!');
    setTimeout(() => setSaveStatus(''), 2000);
  };

  const handleClearDraft = () => {
    localStorage.removeItem('socialflow-draft');
    setCaption('');
    setSelectedPlatforms([Platform.INSTAGRAM]);
    setMediaPreview(null);
    setTopic('');
    setMediaFile(null);
    setScheduleDate(getTodayString());
    setScheduleTime('10:00');
    setMonetization({
      enableTips: false,
      payPerView: false,
      subscriptionOnly: false,
      tipAmount: 0,
      accessPrice: 0,
      selectedToken: 'XLM'
    });
    if(fileInputRef.current) fileInputRef.current.value = '';
    setSaveStatus('Draft cleared!');
    setTimeout(() => setSaveStatus(''), 2000);
  }

  const handleSchedule = async () => {
    if (!caption && !mediaFile) {
      alert("Please add some content to schedule.");
      return;
    }

    const button = document.getElementById('schedule-btn');
    if(button) button.innerText = "Scheduling...";
    
    try {
      let ipfsHash = '';
      
      // If monetization is enabled, upload metadata to IPFS
      if (monetization.enableTips || monetization.payPerView || monetization.subscriptionOnly) {
        const metadata = {
          postId: `post-${Date.now()}`,
          monetization: monetization,
          caption: caption,
          platforms: selectedPlatforms,
          timestamp: new Date().toISOString()
        };
        
        ipfsHash = await uploadToIPFS(JSON.stringify(metadata));
        console.log("Monetization metadata uploaded to IPFS:", ipfsHash);
      }

      const postData = {
        caption,
        selectedPlatforms,
        mediaFile,
        scheduleDate,
        scheduleTime,
        monetization: {
          ...monetization,
          ipfsMetadataHash: ipfsHash
        }
      };

      console.log("Post scheduled:", postData);
      handleClearDraft();
      alert("Post scheduled successfully! Check console for details.");
      onNavigate(View.CALENDAR);
    } catch (error) {
      console.error("Error scheduling post:", error);
      alert("Error scheduling post. Please try again.");
      if(button) button.innerText = "Schedule Post";
    }
  };

  const handlePromotePost = () => {
    if (!caption && !mediaFile) {
      alert("Please add some content before promoting.");
      return;
    }
    setIsPromotionModalOpen(true);
  };

  const handlePaymentComplete = (transaction: PaymentTransaction) => {
    setPromotionTransaction(transaction);
    setIsPromoted(true);
    setIsPromotionModalOpen(false);
    setSaveStatus('Post promoted successfully!');
    setTimeout(() => setSaveStatus(''), 3000);
  };

  const handleTopicEdit = () => {
    setTempTopic(topic);
    setIsEditingTopic(true);
  }

  const handleTopicSave = () => {
    setTopic(tempTopic);
    setIsEditingTopic(false);
  }

  return (
    <div className="p-7 max-w-5xl mx-auto animate-fade-in">
      <div className="flex justify-between items-center mb-7">
        <h2 className="text-2xl font-bold text-white">Create New Post</h2>
        <div className="flex gap-4 items-center">
           {saveStatus && (
             <div className="text-green-400 text-sm font-medium flex items-center gap-2">
               <MaterialIcon name="check_circle" className="text-base" />
               {saveStatus}
             </div>
           )}
           {isPromoted && promotionTransaction && (
             <div className="flex items-center gap-2">
               <SponsoredBadge tier={promotionTransaction.sponsorshipTier} />
               <span className="text-xs text-gray-400">
                 Tx: {promotionTransaction.transactionHash?.slice(0, 8)}...
               </span>
             </div>
           )}
           <button 
             onClick={handlePromotePost}
             disabled={isPromoted}
             className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-sm font-medium transition-all ${
               isPromoted 
                 ? 'bg-green-500/20 text-green-400 cursor-not-allowed' 
                 : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:opacity-90 shadow-lg shadow-purple-500/20'
             }`}
           >
             <MaterialIcon name={isPromoted ? "check_circle" : "campaign"} className="text-base" />
             {isPromoted ? 'Promoted' : 'Promote Post'}
           </button>
           <button 
             onClick={handleSaveDraft}
             className="text-gray-subtext hover:text-white text-sm font-medium px-4 py-2"
           >
             Save Draft
           </button>
            <button 
             onClick={handleClearDraft}
             className="text-gray-subtext hover:text-red-500 text-sm font-medium px-4 py-2"
           >
             Clear Draft
           </button>
           <button 
             id="schedule-btn"
             onClick={handleSchedule}
             className="bg-primary-blue text-white px-6 py-3 rounded-2xl text-sm font-medium hover:bg-blue-700 shadow-lg shadow-blue-500/20 transition-all"
           >
             Schedule Post
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <span className="text-sm font-medium text-gray-subtext mr-2">Post to:</span>
            <div className="flex gap-4 items-center mt-2">
            {[
              { id: Platform.INSTAGRAM, icon: <SiInstagram size={20} />, label: 'Instagram' },
              { id: Platform.FACEBOOK, icon: <SiFacebook size={20} />, label: 'Facebook' },
              { id: Platform.X, icon: <FaXTwitter size={20} />, label: 'X' },
              { id: Platform.LINKEDIN, icon: <SiLinkedin size={20} />, label: 'LinkedIn' },
            ].map(p => (
              <button
                key={p.id}
                onClick={() => togglePlatform(p.id)}
                className={`p-3 rounded-2xl border-2 transition-all duration-200 ${
                  selectedPlatforms.includes(p.id) 
                  ? 'border-primary-blue bg-primary-blue/10 text-white' 
                  : 'border-dark-border bg-dark-bg text-gray-subtext hover:border-gray-500'
                }`}
                title={p.label}
              >
                {p.icon}
              </button>
            ))}
            </div>
          </Card>

          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            className="hidden" 
            accept="image/*,video/*"
          />
          <div 
            onClick={handleMediaClick}
            className={`h-64 border-2 border-dashed rounded-3xl flex flex-col items-center justify-center transition-all cursor-pointer group relative overflow-hidden ${
                mediaPreview ? 'border-primary-blue/50 bg-dark-bg' : 'border-dark-border bg-dark-surface/50 hover:bg-dark-surface hover:border-primary-blue/30'
            }`}
          >
             {mediaPreview ? (
                <>
                    <img src={mediaPreview} alt="Preview" className="w-full h-full object-contain" />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="text-white font-medium">Click to change</span>
                    </div>
                </>
             ) : (
                <>
                    <div className="w-16 h-16 rounded-full bg-dark-bg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <MaterialIcon name="image" className="text-gray-subtext group-hover:text-primary-blue text-3xl" />
                    </div>
                    <p className="text-gray-subtext font-medium">Drag and drop media here</p>
                    <p className="text-gray-600 text-sm mt-1">or click to browse</p>
                </>
             )}
          </div>

          <Card>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-white">Caption</h3>
              <div className="flex items-center gap-2">
                {isEditingTopic ? (
                  <>
                    <input 
                      type="text"
                      value={tempTopic}
                      onChange={(e) => setTempTopic(e.target.value)}
                      className="bg-dark-bg border border-dark-border rounded-md px-2 py-1 text-xs text-white focus:outline-none focus:ring-1 focus:ring-primary-blue/50"
                      placeholder="Enter topic"
                    />
                    <button onClick={handleTopicSave} className="text-xs text-green-400 hover:text-green-300">Save</button>
                    <button onClick={() => setIsEditingTopic(false)} className="text-xs text-gray-subtext hover:text-white">Cancel</button>
                  </>
                ) : (
                  <button 
                    onClick={handleTopicEdit}
                    className="flex items-center gap-2 text-xs text-primary-blue hover:text-blue-300"
                  >
                     <MaterialIcon name="edit" className="text-sm" />
                     {topic ? `Topic: ${topic}` : "Set Topic for AI"}
                  </button>
                )}
              </div>
            </div>
            
            <div className="relative">
              <textarea 
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                className="w-full h-40 bg-dark-bg border border-dark-border rounded-2xl p-4 text-white focus:outline-none focus:ring-1 focus:ring-primary-blue/50 resize-none"
                placeholder="Write your caption here..."
              />
              <div className="absolute bottom-3 right-3 flex gap-2">
                 <button onClick={() => insertAtCursor('😊')} className="p-2 hover:bg-white/10 rounded-lg text-gray-subtext"><MaterialIcon name="mood" /></button>
                 <button onClick={() => insertAtCursor('#')} className="p-2 hover:bg-white/10 rounded-lg text-gray-subtext"><MaterialIcon name="tag" /></button>
              </div>
            </div>

            <div className="mt-4 flex justify-between items-center">
               <div className="text-xs text-gray-subtext">
                  {caption.length} characters • {30 - (caption.match(/#/g) || []).length} hashtags remaining
               </div>
               <button 
                  onClick={handleAiGenerate}
                  disabled={!topic || isGenerating}
                  className="flex items-center gap-2 bg-gradient-to-r from-primary-blue to-primary-teal text-white px-4 py-2 rounded-2xl text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity shadow-lg shadow-blue-500/20"
               >
                 <MaterialIcon name="auto_awesome" className={`text-base ${isGenerating ? "animate-spin" : ""}`} />
                 {isGenerating ? 'Generating...' : 'AI Generate'}
               </button>
            </div>
          </Card>

          <Card>
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <MaterialIcon name="account_balance_wallet" className="text-primary-teal" />
              Web3 Monetization
            </h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-dark-bg rounded-xl border border-dark-border hover:border-primary-blue/30 transition-colors">
                <div className="flex items-center gap-3">
                  <MaterialIcon name="volunteer_activism" className="text-primary-teal" />
                  <div>
                    <p className="text-white font-medium text-sm">Enable Tips</p>
                    <p className="text-gray-subtext text-xs">Allow viewers to send tips</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={monetization.enableTips}
                    onChange={(e) => setMonetization({...monetization, enableTips: e.target.checked})}
                    className="sr-only peer" 
                  />
                  <div className="w-11 h-6 bg-dark-border peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-blue"></div>
                </label>
              </div>

              {monetization.enableTips && (
                <div className="ml-4 p-3 bg-dark-bg rounded-xl border border-dark-border">
                  <label className="block text-xs font-medium text-gray-subtext mb-2">Suggested Tip Amount</label>
                  <div className="flex items-center gap-2">
                    <input 
                      type="number"
                      min="0"
                      step="0.01"
                      value={monetization.tipAmount || 0}
                      onChange={(e) => setMonetization({...monetization, tipAmount: parseFloat(e.target.value)})}
                      className="flex-1 bg-dark-surface border border-dark-border rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-1 focus:ring-primary-blue/50"
                      placeholder="0.00"
                    />
                    <span className="text-gray-subtext text-sm">{monetization.selectedToken}</span>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between p-3 bg-dark-bg rounded-xl border border-dark-border hover:border-primary-blue/30 transition-colors">
                <div className="flex items-center gap-3">
                  <MaterialIcon name="lock" className="text-primary-teal" />
                  <div>
                    <p className="text-white font-medium text-sm">Pay-per-View (XLM)</p>
                    <p className="text-gray-subtext text-xs">Charge for content access</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={monetization.payPerView}
                    onChange={(e) => setMonetization({...monetization, payPerView: e.target.checked})}
                    className="sr-only peer" 
                  />
                  <div className="w-11 h-6 bg-dark-border peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-blue"></div>
                </label>
              </div>

              {monetization.payPerView && (
                <div className="ml-4 p-3 bg-dark-bg rounded-xl border border-dark-border">
                  <label className="block text-xs font-medium text-gray-subtext mb-2">Access Price</label>
                  <div className="flex items-center gap-2">
                    <input 
                      type="number"
                      min="0"
                      step="0.01"
                      value={monetization.accessPrice || 0}
                      onChange={(e) => setMonetization({...monetization, accessPrice: parseFloat(e.target.value)})}
                      className="flex-1 bg-dark-surface border border-dark-border rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-1 focus:ring-primary-blue/50"
                      placeholder="0.00"
                    />
                    <span className="text-gray-subtext text-sm">{monetization.selectedToken}</span>
                  </div>
                  <p className="text-xs text-gray-600 mt-2">⚠️ Wallet signature required for on-chain access control</p>
                </div>
              )}

              <div className="flex items-center justify-between p-3 bg-dark-bg rounded-xl border border-dark-border hover:border-primary-blue/30 transition-colors">
                <div className="flex items-center gap-3">
                  <MaterialIcon name="card_membership" className="text-primary-teal" />
                  <div>
                    <p className="text-white font-medium text-sm">Subscription Only</p>
                    <p className="text-gray-subtext text-xs">Exclusive for subscribers</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={monetization.subscriptionOnly}
                    onChange={(e) => setMonetization({...monetization, subscriptionOnly: e.target.checked})}
                    className="sr-only peer" 
                  />
                  <div className="w-11 h-6 bg-dark-border peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-blue"></div>
                </label>
              </div>

              <div className="p-3 bg-dark-bg rounded-xl border border-dark-border">
                <label className="block text-xs font-medium text-gray-subtext mb-2">Asset Selector</label>
                <select 
                  value={monetization.selectedToken}
                  onChange={(e) => setMonetization({...monetization, selectedToken: e.target.value})}
                  className="w-full bg-dark-surface border border-dark-border rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-1 focus:ring-primary-blue/50"
                >
                  <option value="XLM">XLM (Stellar Lumens)</option>
                  <option value="USDC">USDC (USD Coin)</option>
                  <option value="ETH">ETH (Ethereum)</option>
                  <option value="CUSTOM">Custom Token</option>
                </select>
              </div>

              {(monetization.enableTips || monetization.payPerView || monetization.subscriptionOnly) && (
                <div className="p-3 bg-gradient-to-r from-primary-blue/10 to-primary-teal/10 rounded-xl border border-primary-blue/30">
                  <div className="flex items-start gap-2">
                    <MaterialIcon name="info" className="text-primary-teal text-base mt-0.5" />
                    <div>
                      <p className="text-white text-xs font-medium">Monetization Active</p>
                      <p className="text-gray-subtext text-xs mt-1">Metadata will be stored on IPFS and linked to your post</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <h3 className="text-lg font-semibold text-white mb-4">Scheduling</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-subtext mb-1">Date</label>
                <div className="flex items-center gap-2 bg-dark-bg p-3 rounded-2xl border border-dark-border text-white">
                   <MaterialIcon name="calendar_today" className="text-base" />
                   <input 
                     type="date"
                     value={scheduleDate}
                     min={getTodayString()}
                     onChange={(e) => setScheduleDate(e.target.value)}
                     className="bg-transparent focus:outline-none w-full text-sm text-white" 
                     style={{ colorScheme: 'dark' }}
                   />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-subtext mb-1">Time</label>
                <div className="flex gap-2">
                  <div className="flex-1 bg-dark-bg p-3 rounded-2xl border border-dark-border text-white text-center text-sm">
                    <input 
                      type="time"
                      value={scheduleTime}
                      onChange={(e) => setScheduleTime(e.target.value)}
                      className="bg-transparent focus:outline-none w-full text-sm text-white text-center"
                      style={{ colorScheme: 'dark' }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </Card>

          <Card noPadding>
            <h3 className="text-lg font-semibold text-white mb-2 p-6 pb-0">Preview</h3>
            <div className="bg-white rounded-b-3xl overflow-hidden aspect-[4/5] relative group">
               {mediaPreview ? (
                  <img src={mediaPreview} className="w-full h-full object-cover" alt="Preview" />
               ) : (
                  <div className="h-full bg-gray-100 flex items-center justify-center text-gray-400">
                     Media Preview
                  </div>
               )}
               <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                  <div className="flex items-center gap-2 mb-2">
                     <div className="w-6 h-6 rounded-full bg-gray-300"></div>
                     <span className="text-white text-xs font-semibold">your_account</span>
                  </div>
                  <p className="text-white text-xs line-clamp-2 opacity-90">{caption || "Caption preview..."}</p>
               </div>
            </div>
          </Card>
        </div>
      </div>

      <PaymentModal
        isOpen={isPromotionModalOpen}
        onClose={() => setIsPromotionModalOpen(false)}
        onPaymentComplete={handlePaymentComplete}
        postId={`post_${Date.now()}`}
      />
    </div>
  );
};
