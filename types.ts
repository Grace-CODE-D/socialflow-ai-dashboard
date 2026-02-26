export enum View {
  DASHBOARD = "DASHBOARD",
  ANALYTICS = "ANALYTICS",
  CALENDAR = "CALENDAR",
  CREATE_POST = "CREATE_POST",
  MEDIA_LIBRARY = "MEDIA_LIBRARY",
  INBOX = "INBOX",
  REWARDS = "REWARDS",
  SETTINGS = "SETTINGS",
  BLOCKCHAIN_MONITOR = "BLOCKCHAIN_MONITOR",
  PORTFOLIO = "PORTFOLIO",
  TRANSACTION_HISTORY = "TRANSACTION_HISTORY",
  ACCOUNT_PERFORMANCE = "ACCOUNT_PERFORMANCE",
  REWARDS_CONFIG = "REWARDS_CONFIG",
}

export interface NavItem {
  id: View;
  label: string;
  icon: any;
}

export interface ViewProps {
  onNavigate: (view: View) => void;
}
51

export interface MonetizationSettings {
  enableTips: boolean;
  payPerView: boolean;
  subscriptionOnly: boolean;
  tipAmount?: number;
  accessPrice?: number;
  selectedToken?: string;
  ipfsMetadataHash?: string;
  accessControlContract?: string;
}

export interface Post {
  id: string;
  platform: "instagram" | "tiktok" | "facebook" | "youtube" | "linkedin" | "x";
  content: string;
  image?: string;
  date: Date;
  status: "scheduled" | "published" | "draft";
  stats?: {
    likes: number;
    views: number;
  };
  monetization?: MonetizationSettings;
}

export interface Message {
  id: string;
  sender: string;
  avatar: string;
  text: string;
  timestamp: string;
  isMe: boolean;
}

export interface Conversation {
  id: string;
  platform: "instagram" | "facebook" | "x";
  user: string;
  avatar: string;
  lastMessage: string;
  unread: boolean;
  status: "new" | "pending" | "resolved";
  messages: Message[];
}

export enum Platform {
  INSTAGRAM = 'instagram',
  TIKTOK = 'tiktok',
  FACEBOOK = 'facebook',
  YOUTUBE = 'youtube',
  LINKEDIN = 'linkedin',
  X = 'x'
}

export enum TransactionStatus {
  PENDING = 'pending',
  SIGNING = 'signing',
  SUBMITTED = 'submitted',
  CONFIRMED = 'confirmed',
  FAILED = 'failed'
}

export enum TransactionType {
  PAYMENT = 'payment',
  TOKEN_MINT = 'token_mint',
  NFT_MINT = 'nft_mint',
  SMART_CONTRACT = 'smart_contract',
  TRUSTLINE = 'trustline'
export enum TransactionType {
  POST = 'post',
  SCHEDULE = 'schedule',
  UPDATE = 'update',
  DELETE = 'delete',
  REPLY = 'reply'
}

export interface Transaction {
  id: string;
  type: TransactionType;
  status: TransactionStatus;
  description: string;
  amount?: string;
  asset?: string;
  recipient?: string;
  timestamp: number;
  hash?: string;
  error?: string;
  requiresSignature: boolean;
  signatures?: string[];
  requiredSignatures?: number;
}

export interface NotificationPreferences {
  enabled: boolean;
  sound: boolean;
  soundType: 'default' | 'subtle' | 'alert';
  grouping: boolean;
  showOnNewItem: boolean;
  showOnSignature: boolean;
  showOnConfirmation: boolean;
  platform: Platform;
  title: string;
  description?: string;
  scheduledTime?: Date;
  relatedTransactions?: string[];
  createdAt: Date;
  data?: any;
}

// Wealth Analytics Types
export interface WalletData {
  address: string;
  balance: number;
  tokens: TokenHolding[];
  firstSeen: Date;
  lastActive: Date;
  transactionCount: number;
  category: 'whale' | 'dolphin' | 'fish' | 'shrimp';
}

export interface TokenHolding {
  symbol: string;
  amount: number;
  value: number;
  percentOfPortfolio: number;
}

export interface WealthSnapshot {
  timestamp: Date;
  totalValue: number;
  walletCount: number;
  averageValue: number;
  medianValue: number;
  topHolders: WalletData[];
}

export interface WealthTrend {
  period: string;
  totalValue: number;
  change: number;
  changePercent: number;
  newWallets: number;
  activeWallets: number;
}

export interface WealthSegment {
  category: string;
  count: number;
  totalValue: number;
  averageValue: number;
  percentage: number;
}

export interface WealthMigration {
  from: string;
  to: string;
  value: number;
  walletCount: number;
  timestamp: Date;
}

// Token Holder Analysis Types
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

export interface TokenLoyaltyMetrics {
  tokenSymbol: string;
  totalHolders: number;
  loyalHolders: number;
  churnRate: number;
  avgHoldingPeriod: number;
  retentionRate: number;
}

// Whale Identification Types
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

export interface WhaleAlert {
  id: string;
  walletAddress: string;
  alertType: 'large_transaction' | 'new_whale' | 'whale_exit' | 'high_engagement';
  severity: 'low' | 'medium' | 'high';
  message: string;
  timestamp: Date;
  metadata: Record<string, any>;
}
