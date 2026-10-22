export type Language = 'en' | 'ur';

export type MarketType = 'live' | 'otc';

export interface CurrencyPair {
  id: string;
  name: string;
  payout: number;
  market: MarketType;
  basePrice: number;
  spread: number;
  flags: string;
  assetCategory: 'Forex' | 'Crypto' | 'Commodity';
  tvSymbol?: string;
}

export interface SignalData {
  id: string;
  pair: string;
  market: MarketType;
  timeframe: string;
  direction: 'CALL' | 'PUT';
  accuracy: number;
  entryPrice: number;
  expirySeconds: number;
  remainingSeconds: number;
  timestamp: number;
  result?: 'WIN' | 'LOSS' | 'PENDING';
  payoutAmount?: number;
  flags?: string;
  confidenceLevels?: {
    rsi: number;
    trend: string;
    volatility: string;
    macd: string;
  };
}

export interface TraderVerificationState {
  traderId: string;
  userToken: string;
  status: 'idle' | 'pending' | 'accepted' | 'rejected';
  submittedAt?: number;
  decidedAt?: number;
  message?: string;
  isLifetimeActive?: boolean;
}

export interface AdminStats {
  totalAccepted: number;
  totalRejected: number;
  totalPending: number;
  adminChatIds: (string | number)[];
  botInfo?: {
    username?: string;
    first_name?: string;
  };
  requests?: Array<{
    id: string;
    traderId: string;
    status: 'pending' | 'accepted' | 'rejected';
    submittedAt: number;
    decidedAt?: number;
    decisionReason?: string;
    lockedToUserToken?: string;
  }>;
}
