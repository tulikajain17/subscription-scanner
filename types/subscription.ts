export type BillingFrequency = 'monthly' | 'annual' | 'weekly' | 'quarterly' | 'one-time' | 'unknown';

export type SubscriptionCategory =
  | 'streaming'
  | 'software'
  | 'fitness'
  | 'news'
  | 'gaming'
  | 'productivity'
  | 'cloud'
  | 'food'
  | 'shopping'
  | 'finance'
  | 'education'
  | 'other';

export interface Subscription {
  id: string;
  serviceName: string;
  cost: number;
  currency: string;
  frequency: BillingFrequency;
  renewalDate: string | null;
  senderDomain: string;
  category: SubscriptionCategory;
  lastEmailDate: string;
  emailCount: number;
  confidence: number; // 0-1 confidence score from AI parsing
  status: 'active' | 'cancelled' | 'unknown';
  rawEmails?: EmailSummary[];
}

export interface EmailSummary {
  id: string;
  subject: string;
  snippet: string;
  date: string;
  from: string;
}

export interface ScanProgress {
  status: 'idle' | 'authenticating' | 'searching' | 'fetching' | 'parsing' | 'complete' | 'error';
  totalEmails: number;
  processedEmails: number;
  foundSubscriptions: number;
  currentService?: string;
  error?: string;
}

export interface ScanResult {
  subscriptions: Subscription[];
  totalMonthly: number;
  totalAnnual: number;
  scanDate: string;
  emailsScanned: number;
}

export interface CategorySummary {
  category: SubscriptionCategory;
  subscriptions: Subscription[];
  totalMonthly: number;
  count: number;
}

export const CATEGORY_LABELS: Record<SubscriptionCategory, string> = {
  streaming: 'Streaming & Entertainment',
  software: 'Software & Apps',
  fitness: 'Fitness & Health',
  news: 'News & Media',
  gaming: 'Gaming',
  productivity: 'Productivity',
  cloud: 'Cloud & Storage',
  food: 'Food & Delivery',
  shopping: 'Shopping & Retail',
  finance: 'Finance & Banking',
  education: 'Education & Learning',
  other: 'Other',
};

export const CATEGORY_ICONS: Record<SubscriptionCategory, string> = {
  streaming: '🎬',
  software: '💻',
  fitness: '🏃',
  news: '📰',
  gaming: '🎮',
  productivity: '📊',
  cloud: '☁️',
  food: '🍕',
  shopping: '🛒',
  finance: '💳',
  education: '📚',
  other: '📦',
};
