export type Currency = "BRL" | "USD";
export type TransactionKind = "PIX" | "CARD" | "BOLETO" | "RECURRING" | "OTHER";
export type TransactionFlow = "EXPENSE" | "INCOME";
export type PaymentStatus = "PENDING" | "PAID" | "OVERDUE";
export type Frequency = "DAILY" | "WEEKLY" | "MONTHLY";

export interface Account {
  id: string;
  institution: string;
  name: string;
  type: "BANK" | "CREDIT";
  balanceCents: number;
  currency: Currency;
  color: string;
}

export interface Transaction {
  id: string;
  accountId: string;
  description: string;
  merchant?: string;
  amountCents: number;
  currency: Currency;
  date: string;
  flow: TransactionFlow;
  kind: TransactionKind;
  category: string;
  originalCategory: string;
  note?: string;
  tags?: string[];
  installment?: { current: number; total: number };
}

export interface RecurringPayment {
  id: string;
  description: string;
  averageAmountCents: number;
  currency: Currency;
  nextDate: string;
  confidence: number;
  confirmed: boolean;
}

export interface Boleto {
  id: string;
  description: string;
  issuer: string;
  amountCents: number;
  currency: Currency;
  dueDate: string;
  status: PaymentStatus;
  digitableLine?: string;
  source: "PLUGGY" | "MANUAL";
}

export interface SharedExpense {
  id: string;
  transactionId: string;
  person: string;
  amountCents: number;
  currency: Currency;
  dueDate: string;
  installments: number;
  note?: string;
  status: PaymentStatus;
}

export interface Investment {
  id: string;
  institution: string;
  name: string;
  type: string;
  balanceCents: number;
  amountOriginalCents?: number;
  profitCents?: number;
  currency: Currency;
  annualRate?: number;
}

export interface VaultContribution {
  id: string;
  amountCents: number;
  date: string;
}

export interface Vault {
  id: string;
  name: string;
  icon: "TRAVEL" | "SAFETY" | "HOME" | "OTHER";
  targetCents: number;
  savedCents: number;
  currency: Currency;
  contributions: VaultContribution[];
}

export interface PurchaseGoal {
  id: string;
  name: string;
  priceCents: number;
  savedCents: number;
  contributionCents: number;
  currency: Currency;
  frequency: Frequency;
  estimatedDate: string;
  status: "ACTIVE" | "COMPLETED";
}

export interface WishlistItem {
  id: string;
  url: string;
  title: string;
  image?: string;
  priceCents: number;
  currency: Currency;
  contributionCents: number;
  frequency: Frequency;
  createdAt: string;
}

export interface Connection {
  id: string;
  itemId?: string;
  institution: string;
  status: "CONNECTED" | "SYNCING" | "ERROR";
  lastSyncAt?: string;
  products: string[];
}

export interface NotificationPreferences {
  inApp: boolean;
  email: boolean;
  push: boolean;
  daysBefore: number;
}

export interface FinanceData {
  accounts: Account[];
  transactions: Transaction[];
  recurring: RecurringPayment[];
  boletos: Boleto[];
  sharedExpenses: SharedExpense[];
  investments: Investment[];
  vaults: Vault[];
  goals: PurchaseGoal[];
  wishlist: WishlistItem[];
  connections: Connection[];
  notifications: NotificationPreferences;
}
