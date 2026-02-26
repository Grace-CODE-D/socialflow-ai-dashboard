// Wallet Analytics Service for Audience Wealth Analysis

export interface WalletData {
  address: string;
  portfolioValue: number;
  tokens: TokenHolding[];
  followerEngagement: number;
  lastActive: Date;
}

export interface TokenHolding {
  symbol: string;
  amount: number;
  value: number;
  holdingDuration: number; // in days
}

export interface WealthSegment {
  tier: 'whale' | 'dolphin' | 'shrimp';
  minValue: number;
  maxValue: number;
  count: number;
  engagementRate: number;
  conversionRate: number;
  growthRate: number;
}

export interface AudienceWealthMetrics {
  averagePortfolioValue: number;
  totalWallets: number;
  commonTokens: { symbol: string; holders: number; avgHoldingDuration: number }[];
  wealthTrends: { date: string; avgValue: number }[];
  segments: WealthSegment[];
}

// Mock data generator - replace with actual blockchain API integration
const generateMockWalletData = (count: number): WalletData[] => {
  const tokens = ['ETH', 'BTC', 'SOL', 'MATIC', 'USDC', 'LINK', 'UNI', 'AAVE'];
  const wallets: WalletData[] = [];

  for (let i = 0; i < count; i++) {
    const tokenCount = Math.floor(Math.random() * 5) + 1;
    const holdings: TokenHolding[] = [];
    
    for (let j = 0; j < tokenCount; j++) {
      holdings.push({
        symbol: tokens[Math.floor(Math.random() * tokens.length)],
        amount: Math.random() * 100,
        value: Math.random() * 50000,
        holdingDuration: Math.floor(Math.random() * 365)
      });
    }

    wallets.push({
      address: `0x${Math.random().toString(16).substr(2, 40)}`,
      portfolioValue: holdings.reduce((sum, h) => sum + h.value, 0),
      tokens: holdings,
      followerEngagement: Math.random() * 100,
      lastActive: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000)
    });
  }

  return wallets;
};

export const fetchWalletData = async (followerIds: string[]): Promise<WalletData[]> => {
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 500));
  return generateMockWalletData(followerIds.length);
};

export const calculateAveragePortfolioValue = (wallets: WalletData[]): number => {
  if (wallets.length === 0) return 0;
  const total = wallets.reduce((sum, w) => sum + w.portfolioValue, 0);
  return total / wallets.length;
};

export const identifyCommonTokens = (wallets: WalletData[]): { symbol: string; holders: number; avgHoldingDuration: number }[] => {
  const tokenMap = new Map<string, { holders: number; totalDuration: number }>();

  wallets.forEach(wallet => {
    wallet.tokens.forEach(token => {
      const existing = tokenMap.get(token.symbol) || { holders: 0, totalDuration: 0 };
      tokenMap.set(token.symbol, {
        holders: existing.holders + 1,
        totalDuration: existing.totalDuration + token.holdingDuration
      });
    });
  });

  return Array.from(tokenMap.entries())
    .map(([symbol, data]) => ({
      symbol,
      holders: data.holders,
      avgHoldingDuration: Math.round(data.totalDuration / data.holders)
    }))
    .sort((a, b) => b.holders - a.holders)
    .slice(0, 10);
};

export const generateWealthTrends = (wallets: WalletData[]): { date: string; avgValue: number }[] => {
  const trends = [];
  const now = new Date();
  
  for (let i = 29; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    
    // Simulate historical data with some variance
    const variance = (Math.random() - 0.5) * 0.2;
    const avgValue = calculateAveragePortfolioValue(wallets) * (1 + variance);
    
    trends.push({
      date: date.toISOString().split('T')[0],
      avgValue: Math.round(avgValue)
    });
  }
  
  return trends;
};

export const segmentByWealth = (wallets: WalletData[]): WealthSegment[] => {
  const whales = wallets.filter(w => w.portfolioValue >= 100000);
  const dolphins = wallets.filter(w => w.portfolioValue >= 10000 && w.portfolioValue < 100000);
  const shrimp = wallets.filter(w => w.portfolioValue < 10000);

  const calculateSegmentMetrics = (segment: WalletData[], tier: 'whale' | 'dolphin' | 'shrimp'): WealthSegment => {
    const avgEngagement = segment.length > 0 
      ? segment.reduce((sum, w) => sum + w.followerEngagement, 0) / segment.length 
      : 0;
    
    return {
      tier,
      minValue: tier === 'whale' ? 100000 : tier === 'dolphin' ? 10000 : 0,
      maxValue: tier === 'whale' ? Infinity : tier === 'dolphin' ? 100000 : 10000,
      count: segment.length,
      engagementRate: Math.round(avgEngagement * 100) / 100,
      conversionRate: Math.random() * 10, // Mock conversion rate
      growthRate: (Math.random() - 0.5) * 20 // Mock growth rate
    };
  };

  return [
    calculateSegmentMetrics(whales, 'whale'),
    calculateSegmentMetrics(dolphins, 'dolphin'),
    calculateSegmentMetrics(shrimp, 'shrimp')
  ];
};

export const analyzeAudienceWealth = async (followerIds: string[]): Promise<AudienceWealthMetrics> => {
  const wallets = await fetchWalletData(followerIds);
  
  return {
    averagePortfolioValue: calculateAveragePortfolioValue(wallets),
    totalWallets: wallets.length,
    commonTokens: identifyCommonTokens(wallets),
    wealthTrends: generateWealthTrends(wallets),
    segments: segmentByWealth(wallets)
  };
};
