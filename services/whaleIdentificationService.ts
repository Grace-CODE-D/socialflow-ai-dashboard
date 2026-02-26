// Whale Identification and Tracking Service

export interface WhaleProfile {
  walletAddress: string;
  portfolioValue: number;
  totalTransactions: number;
  avgTransactionValue: number;
  engagementScore: number;
  followingSince: Date;
  lastActive: Date;
  topTokens: { symbol: string; value: number }[];
  riskScore: number;
  influenceScore: number;
}

export interface WhaleTransaction {
  id: string;
  walletAddress: string;
  type: 'buy' | 'sell' | 'transfer';
  tokenSymbol: string;
  amount: number;
  value: number;
  timestamp: Date;
  fromAddress?: string;
  toAddress?: string;
}

export interface WhaleEngagementPattern {
  walletAddress: string;
  postsViewed: number;
  postsLiked: number;
  postsShared: number;
  commentsLeft: number;
  avgSessionDuration: number;
  lastEngagement: Date;
  engagementTrend: 'increasing' | 'stable' | 'decreasing';
}

export interface WhaleAlert {
  id: string;
  walletAddress: string;
  alertType: 'large_transaction' | 'new_whale' | 'whale_exit' | 'high_engagement';
  severity: 'low' | 'medium' | 'high';
  message: string;
  timestamp: Date;
  metadata: Record<string, any>;
}

const WHALE_THRESHOLD = 100000; // $100k portfolio value

// Mock data generators
const generateMockWhaleProfile = (address: string): WhaleProfile => {
  const portfolioValue = WHALE_THRESHOLD + Math.random() * 900000;
  const topTokens = ['ETH', 'BTC', 'SOL', 'MATIC', 'LINK'].map(symbol => ({
    symbol,
    value: Math.random() * portfolioValue * 0.3
  })).sort((a, b) => b.value - a.value).slice(0, 3);

  return {
    walletAddress: address,
    portfolioValue,
    totalTransactions: Math.floor(Math.random() * 500) + 50,
    avgTransactionValue: portfolioValue / 10,
    engagementScore: Math.random() * 100,
    followingSince: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000),
    lastActive: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
    topTokens,
    riskScore: Math.random() * 100,
    influenceScore: Math.random() * 100
  };
};

const generateMockTransactions = (address: string, count: number): WhaleTransaction[] => {
  const types: ('buy' | 'sell' | 'transfer')[] = ['buy', 'sell', 'transfer'];
  const tokens = ['ETH', 'BTC', 'SOL', 'MATIC', 'USDC'];
  
  return Array.from({ length: count }, (_, i) => ({
    id: `tx_${i}_${Math.random().toString(36).substr(2, 9)}`,
    walletAddress: address,
    type: types[Math.floor(Math.random() * types.length)],
    tokenSymbol: tokens[Math.floor(Math.random() * tokens.length)],
    amount: Math.random() * 1000,
    value: Math.random() * 50000,
    timestamp: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
    fromAddress: `0x${Math.random().toString(16).substr(2, 40)}`,
    toAddress: `0x${Math.random().toString(16).substr(2, 40)}`
  })).sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
};

export const detectWhales = async (): Promise<WhaleProfile[]> => {
  await new Promise(resolve => setTimeout(resolve, 400));
  
  const whaleCount = Math.floor(Math.random() * 20) + 10;
  return Array.from({ length: whaleCount }, (_, i) => 
    generateMockWhaleProfile(`0x${Math.random().toString(16).substr(2, 40)}`)
  ).sort((a, b) => b.portfolioValue - a.portfolioValue);
};

export const getWhaleTransactionHistory = async (
  walletAddress: string
): Promise<WhaleTransaction[]> => {
  await new Promise(resolve => setTimeout(resolve, 200));
  return generateMockTransactions(walletAddress, 20);
};

export const trackWhaleEngagement = (walletAddress: string): WhaleEngagementPattern => {
  const trends: ('increasing' | 'stable' | 'decreasing')[] = ['increasing', 'stable', 'decreasing'];
  
  return {
    walletAddress,
    postsViewed: Math.floor(Math.random() * 100),
    postsLiked: Math.floor(Math.random() * 50),
    postsShared: Math.floor(Math.random() * 20),
    commentsLeft: Math.floor(Math.random() * 30),
    avgSessionDuration: Math.random() * 600,
    lastEngagement: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000),
    engagementTrend: trends[Math.floor(Math.random() * trends.length)]
  };
};

export const generateWhaleAlerts = (whales: WhaleProfile[]): WhaleAlert[] => {
  const alerts: WhaleAlert[] = [];
  const alertTypes: WhaleAlert['alertType'][] = [
    'large_transaction', 'new_whale', 'whale_exit', 'high_engagement'
  ];
  const severities: WhaleAlert['severity'][] = ['low', 'medium', 'high'];

  whales.slice(0, 5).forEach((whale, i) => {
    const alertType = alertTypes[Math.floor(Math.random() * alertTypes.length)];
    
    alerts.push({
      id: `alert_${i}_${Date.now()}`,
      walletAddress: whale.walletAddress,
      alertType,
      severity: severities[Math.floor(Math.random() * severities.length)],
      message: getAlertMessage(alertType, whale),
      timestamp: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000),
      metadata: { portfolioValue: whale.portfolioValue }
    });
  });

  return alerts.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
};

const getAlertMessage = (type: WhaleAlert['alertType'], whale: WhaleProfile): string => {
  const shortAddress = `${whale.walletAddress.slice(0, 6)}...${whale.walletAddress.slice(-4)}`;
  
  switch (type) {
    case 'large_transaction':
      return `Whale ${shortAddress} executed large transaction worth $${(whale.avgTransactionValue).toLocaleString()}`;
    case 'new_whale':
      return `New whale detected: ${shortAddress} with portfolio value $${whale.portfolioValue.toLocaleString()}`;
    case 'whale_exit':
      return `Whale ${shortAddress} showing exit signals - portfolio decreased`;
    case 'high_engagement':
      return `Whale ${shortAddress} showing high engagement (score: ${whale.engagementScore.toFixed(1)})`;
    default:
      return `Alert for whale ${shortAddress}`;
  }
};

export const generateWhaleEngagementReport = (whales: WhaleProfile[]) => {
  const totalWhales = whales.length;
  const avgPortfolio = whales.reduce((sum, w) => sum + w.portfolioValue, 0) / totalWhales;
  const avgEngagement = whales.reduce((sum, w) => sum + w.engagementScore, 0) / totalWhales;
  const highEngagement = whales.filter(w => w.engagementScore > 70).length;
  
  return {
    totalWhales,
    avgPortfolio,
    avgEngagement,
    highEngagementCount: highEngagement,
    highEngagementPercentage: (highEngagement / totalWhales) * 100,
    topWhales: whales.slice(0, 10)
  };
};
