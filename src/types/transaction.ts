export enum TransactionCategory {
  PAYMENT = 'payment',
  TOKEN = 'token',
  NFT = 'nft',
  CONTRACT = 'contract',
  OTHER = 'other',
}

export interface Transaction {
  id: string;
  type: string;
  category: TransactionCategory;
  timestamp: string;
  account: string;
  amount?: string;
  asset?: string;
  from?: string;
  to?: string;
  data: any;
}

export interface CategoryStats {
  category: TransactionCategory;
  count: number;
  percentage: number;
}
