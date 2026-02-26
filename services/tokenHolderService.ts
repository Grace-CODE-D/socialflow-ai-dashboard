// Token Holder Analysis Service

export interface TokenHolder {
  walletAddress: string;
  tokenSymbol: string;
  amount: number;
  value: number;
  holdingDuration: number;
  firstPurchaseDate: Date;
  lastTransactionDate: Date;
  engagementScore: number;
}

export interface TokenHolderCohort {
  cohortId: string;
  tokenSymbol: string;
  holderCount: number;
  avgHoldingDuration: number;
  avgEngagement: number;
  totalValue: number;
  loyaltyScore: number;
}

export interface TokenOverlapAnalysis {
  token1: string;
  token2: string;
  overlapCount: number;
  overlapPercentage: number;
  avgPortfolioValue: number;
}

export interface TokenLoyaltyMetrics {
  tokenSymbol: string;
  totalHolders: number;
  loyalHolders: number; // held > 90 days
  churnRate: number;
  avgHoldingPeriod: number;
  retentionRate: number;
}

// Mock data generator
const generateMockTokenHolders = (tokenSymbol: string, count: number): TokenHolder[] => {
  const holders: TokenHolder[] = [];
  
  for (let i = 0; i < count; i++) {
    const holdingDuration = Math.floor(Math.random() * 365);
    const firstPurchase = new Date(Date.now() - holdingDuration * 24 * 60 * 60 * 1000);
    
    holders.push({
      walletAddress: `0x${Math.random().toString(16).substr(2, 40)}`,
      tokenSymbol,
      amount: Math.random() * 10000,
      value: Math.random() * 100000,
      holdingDuration,
      firstPurchaseDate: firstPurchase,
      lastTransactionDate: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
      engagementScore: Math.random() * 100
    });
  }
  
  return holders;
};

export const identifyTokenHolders = async (tokenSymbol: string): Promise<TokenHolder[]> => {
  await new Promise(resolve => setTimeout(resolve, 300));
  return generateMockTokenHolders(tokenSymbol, Math.floor(Math.random() * 200) + 50);
};

export const analyzeTokenHoldingPatterns = (holders: TokenHolder[]) => {
  const patterns = {
    shortTerm: holders.filter(h => h.holdingDuration < 30).length,
    mediumTerm: holders.filter(h => h.holdingDuration >= 30 && h.holdingDuration < 90).length,
    longTerm: holders.filter(h => h.holdingDuration >= 90).length,
    avgHoldingDuration: holders.reduce((sum, h) => sum + h.holdingDuration, 0) / holders.length
  };
  
  return patterns;
};

export const calculateTokenOverlap = (
  holders1: TokenHolder[],
  holders2: TokenHolder[]
): TokenOverlapAnalysis => {
  const addresses1 = new Set(holders1.map(h => h.walletAddress));
  const addresses2 = new Set(holders2.map(h => h.walletAddress));
  
  const overlap = [...addresses1].filter(addr => addresses2.has(addr));
  const overlapCount = overlap.length;
  const overlapPercentage = (overlapCount / Math.min(addresses1.size, addresses2.size)) * 100;
  
  const overlappingHolders = holders1.filter(h => overlap.includes(h.walletAddress));
  const avgPortfolioValue = overlappingHolders.reduce((sum, h) => sum + h.value, 0) / overlapCount || 0;
  
  return {
    token1: holders1[0]?.tokenSymbol || '',
    token2: holders2[0]?.tokenSymbol || '',
    overlapCount,
    overlapPercentage,
    avgPortfolioValue
  };
};

export const calculateTokenLoyalty = (holders: TokenHolder[]): TokenLoyaltyMetrics => {
  const loyalHolders = holders.filter(h => h.holdingDuration > 90);
  const avgHoldingPeriod = holders.reduce((sum, h) => sum + h.holdingDuration, 0) / holders.length;
  
  return {
    tokenSymbol: holders[0]?.tokenSymbol || '',
    totalHolders: holders.length,
    loyalHolders: loyalHolders.length,
    churnRate: ((holders.length - loyalHolders.length) / holders.length) * 100,
    avgHoldingPeriod,
    retentionRate: (loyalHolders.length / holders.length) * 100
  };
};

export const createTokenHolderCohorts = (holders: TokenHolder[]): TokenHolderCohort[] => {
  const cohorts: TokenHolderCohort[] = [
    {
      cohortId: 'new-holders',
      tokenSymbol: holders[0]?.tokenSymbol || '',
      holderCount: 0,
      avgHoldingDuration: 0,
      avgEngagement: 0,
      totalValue: 0,
      loyaltyScore: 0
    },
    {
      cohortId: 'active-holders',
      tokenSymbol: holders[0]?.tokenSymbol || '',
      holderCount: 0,
      avgHoldingDuration: 0,
      avgEngagement: 0,
      totalValue: 0,
      loyaltyScore: 0
    },
    {
      cohortId: 'loyal-holders',
      tokenSymbol: holders[0]?.tokenSymbol || '',
      holderCount: 0,
      avgHoldingDuration: 0,
      avgEngagement: 0,
      totalValue: 0,
      loyaltyScore: 0
    }
  ];

  holders.forEach(holder => {
    let cohort;
    if (holder.holdingDuration < 30) cohort = cohorts[0];
    else if (holder.holdingDuration < 90) cohort = cohorts[1];
    else cohort = cohorts[2];

    cohort.holderCount++;
    cohort.avgHoldingDuration += holder.holdingDuration;
    cohort.avgEngagement += holder.engagementScore;
    cohort.totalValue += holder.value;
  });

  cohorts.forEach(cohort => {
    if (cohort.holderCount > 0) {
      cohort.avgHoldingDuration /= cohort.holderCount;
      cohort.avgEngagement /= cohort.holderCount;
      cohort.loyaltyScore = (cohort.avgHoldingDuration / 365) * 100;
    }
  });

  return cohorts;
};
