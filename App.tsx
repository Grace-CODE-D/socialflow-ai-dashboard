import React, { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { Analytics } from './components/Analytics';
import { WealthAnalytics } from './components/WealthAnalytics';
import { Calendar } from './components/Calendar';
import { CreatePost } from './components/CreatePost';
import { MediaLibrary } from './components/MediaLibrary';
import { Inbox } from './components/Inbox';
import { Rewards } from './components/Rewards';
import { Settings } from './components/Settings';
import { StagingDock } from './components/dashboard/StagingDock';
import { View, Transaction, TransactionType, Platform } from './types';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>(View.DASHBOARD);
  const [transactions, setTransactions] = useState<Transaction[]>([
    {
      id: '1',
      type: TransactionType.POST,
      platform: Platform.INSTAGRAM,
      title: 'Summer Collection Launch',
      description: 'New product line announcement with carousel images',
      createdAt: new Date(),
    },
    {
      id: '2',
      type: TransactionType.SCHEDULE,
      platform: Platform.YOUTUBE,
      title: 'Tutorial Video Upload',
      description: 'How to use our new features',
      scheduledTime: new Date(Date.now() + 86400000),
      createdAt: new Date(),
    },
    {
      id: '3',
      type: TransactionType.REPLY,
      platform: Platform.X,
      title: 'Customer Support Response',
      description: 'Reply to @user about product inquiry',
      relatedTransactions: ['4'],
      createdAt: new Date(),
    },
    {
      id: '4',
      type: TransactionType.UPDATE,
      platform: Platform.FACEBOOK,
      title: 'Event Details Update',
      description: 'Update venue information for upcoming event',
      relatedTransactions: ['3'],
      createdAt: new Date(),
    },
  ]);

  const handleRemoveTransaction = (id: string) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
  };

  const handleReorderTransactions = (newTransactions: Transaction[]) => {
    setTransactions(newTransactions);
  };

  const renderView = () => {
    const props = { onNavigate: setCurrentView };

    switch (currentView) {
      case View.DASHBOARD: return <Dashboard {...props} />;
      case View.ANALYTICS: return <Analytics {...props} />;
      case View.WEALTH_ANALYTICS: return <WealthAnalytics {...props} />;
      case View.CALENDAR: return <Calendar {...props} />;
      case View.CREATE_POST: return <CreatePost {...props} />;
      case View.MEDIA_LIBRARY: return <MediaLibrary {...props} />;
      case View.INBOX: return <Inbox {...props} />;
      case View.REWARDS: return <RewardsDemo />;
      case View.SETTINGS: return <Settings {...props} />;
      case View.BLOCKCHAIN_MONITOR: return <BlockchainMonitor />;
      case View.TRANSACTION_HISTORY: return <TransactionHistory />;
      default: return <Dashboard {...props} />;
      case View.DASHBOARD:
        return <Dashboard {...props} />;
      case View.ANALYTICS:
        return <Analytics {...props} />;
      case View.CALENDAR:
        return <Calendar {...props} />;
      case View.CREATE_POST:
        return <CreatePost {...props} />;
      case View.MEDIA_LIBRARY:
        return <MediaLibrary {...props} />;
      case View.INBOX:
        return <Inbox {...props} />;
      case View.REWARDS_CONFIG:
        return <RewardsConfig {...props} />;
      case View.PORTFOLIO:
        return <PortfolioView />;
      case View.TRANSACTION_HISTORY:
        return <TransactionHistory {...props} />;
      case View.ACCOUNT_PERFORMANCE:
        return <AccountPerformance {...props} />;
      case View.SETTINGS:
        return <Settings {...props} />;
      default:
        return <Dashboard {...props} />;
    }
  };

  return (
    <div className="flex h-screen bg-dark-bg text-white font-sans overflow-hidden selection:bg-primary-blue/30">
      <Sidebar currentView={currentView} onNavigate={setCurrentView} />
      
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Abstract Background Blobs */}
        <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-primary-blue/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-primary-teal/10 rounded-full blur-[120px] pointer-events-none" />

        <Header />
        
        <main className="flex-1 overflow-y-auto overflow-x-hidden relative z-10 scroll-smooth pb-20">
          {renderView()}
        </main>

        <StagingDock
          transactions={transactions}
          onRemoveTransaction={handleRemoveTransaction}
          onReorderTransactions={handleReorderTransactions}
        />
      </div>
    </ToastProvider>
  );
};

export default App;
