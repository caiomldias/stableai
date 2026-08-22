import type { FinanceData } from "@/lib/types";

export const emptyFinanceData: FinanceData = {
  accounts: [],
  transactions: [],
  budgets: [],
  recurring: [],
  boletos: [],
  sharedExpenses: [],
  investments: [],
  vaults: [],
  goals: [],
  wishlist: [],
  connections: [],
  notifications: { inApp: true, email: false, push: false, daysBefore: 3 },
};
