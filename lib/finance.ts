import type {
  Budget,
  Currency,
  Frequency,
  PurchaseGoal,
  Transaction,
  TransactionKind,
} from "@/lib/types";

export const money = (amountCents: number, currency: Currency = "BRL") =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(amountCents / 100);

export const shortDate = (isoDate: string) => {
  const date = safeDate(isoDate);
  return date ? new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" }).format(date) : "data não informada";
};

export const fullDate = (isoDate: string) => {
  const date = safeDate(isoDate);
  return date ? new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date) : "data não informada";
};

function safeDate(isoDate: string) {
  if (!isoDate) return null;
  const value = new Date(`${isoDate.slice(0, 10)}T12:00:00`);
  return Number.isNaN(value.getTime()) ? null : value;
}

export function parseMoney(value: string): number {
  const normalized = value
    .trim()
    .replace(/[^\d,.-]/g, "")
    .replace(/\.(?=\d{3}(?:\D|$))/g, "")
    .replace(",", ".");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? Math.round(parsed * 100) : 0;
}

export function classifyTransaction(description: string, accountType?: string): TransactionKind {
  const text = description.toLocaleLowerCase("pt-BR");
  if (text.includes("pix")) return "PIX";
  if (text.includes("boleto") || text.includes("linha digitável")) return "BOLETO";
  if (accountType === "CREDIT" || text.includes("cartão")) return "CARD";
  return "OTHER";
}

const periodsPerMonth: Record<Frequency, number> = {
  DAILY: 30,
  WEEKLY: 52 / 12,
  MONTHLY: 1,
};

export function calculateGoal(
  priceCents: number,
  savedCents: number,
  contributionCents: number,
  frequency: Frequency,
  start = new Date(),
): { periods: number; months: number; estimatedDate: string } {
  const remaining = Math.max(0, priceCents - savedCents);
  if (remaining === 0) {
    return { periods: 0, months: 0, estimatedDate: start.toISOString().slice(0, 10) };
  }
  if (contributionCents <= 0) {
    return { periods: Infinity, months: Infinity, estimatedDate: "" };
  }

  const periods = Math.ceil(remaining / contributionCents);
  const months = Math.ceil(periods / periodsPerMonth[frequency]);
  const estimated = new Date(start);
  if (frequency === "DAILY") estimated.setDate(estimated.getDate() + periods);
  if (frequency === "WEEKLY") estimated.setDate(estimated.getDate() + periods * 7);
  if (frequency === "MONTHLY") estimated.setMonth(estimated.getMonth() + periods);
  return { periods, months, estimatedDate: estimated.toISOString().slice(0, 10) };
}

export function refreshGoal(goal: Omit<PurchaseGoal, "estimatedDate" | "status">): PurchaseGoal {
  const result = calculateGoal(
    goal.priceCents,
    goal.savedCents,
    goal.contributionCents,
    goal.frequency,
  );
  return {
    ...goal,
    estimatedDate: result.estimatedDate,
    status: goal.savedCents >= goal.priceCents ? "COMPLETED" : "ACTIVE",
  };
}

export function monthlyExpenses(transactions: Transaction[], currency: Currency) {
  const formatter = new Intl.DateTimeFormat("pt-BR", { month: "short" });
  const grouped = new Map<string, { timestamp: number; value: number }>();

  transactions
    .filter((item) => item.flow === "EXPENSE" && item.currency === currency)
    .forEach((item) => {
      const date = new Date(`${item.date.slice(0, 10)}T12:00:00`);
      const key = `${date.getFullYear()}-${date.getMonth()}`;
      const current = grouped.get(key) ?? {
        timestamp: new Date(date.getFullYear(), date.getMonth(), 1).getTime(),
        value: 0,
      };
      current.value += item.amountCents / 100;
      grouped.set(key, current);
    });

  return [...grouped.values()]
    .sort((a, b) => a.timestamp - b.timestamp)
    .slice(-6)
    .map((item) => ({
      month: formatter.format(new Date(item.timestamp)).replace(".", ""),
      value: Number(item.value.toFixed(2)),
    }));
}

export function categoryExpenses(transactions: Transaction[], currency: Currency) {
  const grouped = new Map<string, number>();
  transactions
    .filter((item) => item.flow === "EXPENSE" && item.currency === currency)
    .forEach((item) => grouped.set(item.category, (grouped.get(item.category) ?? 0) + item.amountCents));

  return [...grouped.entries()]
    .map(([name, cents]) => ({ name, value: Math.round(cents) / 100 }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);
}

export function totalsByCurrency(transactions: Transaction[]) {
  return (["BRL", "USD"] as Currency[]).map((currency) => {
    const scoped = transactions.filter((item) => item.currency === currency);
    return {
      currency,
      incomeCents: scoped
        .filter((item) => item.flow === "INCOME")
        .reduce((sum, item) => sum + item.amountCents, 0),
      expenseCents: scoped
        .filter((item) => item.flow === "EXPENSE")
        .reduce((sum, item) => sum + item.amountCents, 0),
    };
  });
}

export function computeBudgetUsage(transactions: Transaction[], budgets: Budget[], refDate = new Date()) {
  const year = refDate.getFullYear();
  const month = refDate.getMonth();
  return budgets.map((budget) => {
    const spentCents = transactions
      .filter((item) => {
        const date = safeDate(item.date);
        return item.flow === "EXPENSE"
          && item.currency === budget.currency
          && item.category === budget.category
          && date?.getFullYear() === year
          && date.getMonth() === month;
      })
      .reduce((sum, item) => sum + item.amountCents, 0);
    return {
      ...budget,
      spentCents,
      percentage: budget.monthlyLimitCents > 0 ? (spentCents / budget.monthlyLimitCents) * 100 : 0,
    };
  });
}

export function normalizeDescription(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR")
    .replace(/\d+/g, "")
    .replace(/[^a-z ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
