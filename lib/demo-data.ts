import type { FinanceData, Transaction } from "@/lib/types";

const dateFromNow = (days: number) => {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
};

const monthDate = (monthsAgo: number, day: number) => {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  date.setMonth(date.getMonth() - monthsAgo, day);
  return date.toISOString().slice(0, 10);
};

const transaction = (
  id: string,
  description: string,
  amountCents: number,
  date: string,
  kind: Transaction["kind"],
  category: string,
  accountId = "nubank-checking",
  flow: Transaction["flow"] = "EXPENSE",
): Transaction => ({
  id,
  source: "PLUGGY",
  accountId,
  description,
  merchant: description,
  amountCents,
  currency: "BRL",
  date,
  flow,
  kind,
  category,
  originalCategory: category,
});

const monthlyTransactions: Transaction[] = Array.from({ length: 6 }).flatMap((_, index) => [
  transaction(`market-${index}`, "Mercado Santa Rita", 48670 + index * 1230, monthDate(index, 8), "CARD", "Alimentação", "nubank-card"),
  transaction(`internet-${index}`, "Vivo Fibra", 11990, monthDate(index, 12), "RECURRING", "Casa"),
  transaction(`energy-${index}`, "Boleto Energia Elétrica", 18430 + index * 380, monthDate(index, 16), "BOLETO", "Casa"),
  transaction(`transport-${index}`, "Mobilidade urbana", 7350 + index * 240, monthDate(index, 21), "CARD", "Transporte", "nubank-card"),
]);

export const demoData: FinanceData = {
  accounts: [
    {
      id: "nubank-checking",
      institution: "Nubank",
      name: "Conta principal",
      type: "BANK",
      balanceCents: 1287640,
      currency: "BRL",
      color: "#7CCCF4",
    },
    {
      id: "nubank-card",
      institution: "Nubank",
      name: "Cartão Platinum",
      type: "CREDIT",
      balanceCents: -347892,
      currency: "BRL",
      color: "#A98BEF",
    },
    {
      id: "usd-wallet",
      institution: "Conta global",
      name: "Carteira em dólar",
      type: "BANK",
      balanceCents: 184760,
      currency: "USD",
      color: "#87D7B0",
    },
  ],
  transactions: [
    transaction("salary", "Pagamento mensal", 985000, monthDate(0, 5), "OTHER", "Receita", "nubank-checking", "INCOME"),
    transaction("pix-dra", "PIX Clínica Horizonte", 28000, dateFromNow(-2), "PIX", "Saúde"),
    transaction("card-shoes", "Tênis Esporte Central", 45990, dateFromNow(-3), "CARD", "Compras", "nubank-card"),
    transaction("restaurant", "Restaurante Ipê", 18640, dateFromNow(-5), "CARD", "Alimentação", "nubank-card"),
    transaction("pix-family", "PIX recebido de Renata", 23000, dateFromNow(-6), "PIX", "Transferência", "nubank-checking", "INCOME"),
    transaction("streaming", "Streaming Aurora", 4590, dateFromNow(-8), "RECURRING", "Assinaturas", "nubank-card"),
    transaction("book", "Livraria Travessia", 8790, dateFromNow(-10), "CARD", "Educação", "nubank-card"),
    ...monthlyTransactions,
    {
      id: "usd-software",
      source: "PLUGGY",
      accountId: "usd-wallet",
      description: "Software subscription",
      merchant: "Design Tools",
      amountCents: 2400,
      currency: "USD",
      date: dateFromNow(-4),
      flow: "EXPENSE",
      kind: "RECURRING",
      category: "Trabalho",
      originalCategory: "Trabalho",
    },
  ],
  budgets: [
    { id: "budget-food", category: "Alimentação", monthlyLimitCents: 100_000, currency: "BRL" },
    { id: "budget-home", category: "Casa", monthlyLimitCents: 80_000, currency: "BRL" },
    { id: "budget-transport", category: "Transporte", monthlyLimitCents: 30_000, currency: "BRL" },
  ],
  recurring: [
    {
      id: "rec-internet",
      description: "Vivo Fibra",
      averageAmountCents: 11990,
      currency: "BRL",
      nextDate: dateFromNow(11),
      confidence: 0.98,
      confirmed: true,
    },
    {
      id: "rec-streaming",
      description: "Streaming Aurora",
      averageAmountCents: 4590,
      currency: "BRL",
      nextDate: dateFromNow(22),
      confidence: 0.94,
      confirmed: true,
    },
    {
      id: "rec-gym",
      description: "Academia Movimento",
      averageAmountCents: 13990,
      currency: "BRL",
      nextDate: dateFromNow(7),
      confidence: 0.88,
      confirmed: false,
    },
  ],
  boletos: [
    {
      id: "bill-condo",
      description: "Condomínio Residencial",
      issuer: "Residencial Parque Azul",
      amountCents: 68420,
      currency: "BRL",
      dueDate: dateFromNow(5),
      status: "PENDING",
      digitableLine: "34191.79001 01043.510047 91020.150008 8 93450000068420",
      source: "PLUGGY",
    },
    {
      id: "bill-course",
      description: "Curso de especialização",
      issuer: "Instituto Horizonte",
      amountCents: 32900,
      currency: "BRL",
      dueDate: dateFromNow(13),
      status: "PENDING",
      source: "MANUAL",
    },
  ],
  sharedExpenses: [
    {
      id: "shared-shoes",
      transactionId: "card-shoes",
      person: "Mãe",
      amountCents: 45990,
      currency: "BRL",
      dueDate: dateFromNow(12),
      installments: 1,
      note: "Compra feita no meu cartão",
      status: "PENDING",
    },
  ],
  investments: [
    {
      id: "inv-cdb",
      institution: "Itaú",
      name: "CDB Liquidez Diária",
      type: "Renda fixa",
      balanceCents: 2468730,
      amountOriginalCents: 2200000,
      profitCents: 268730,
      currency: "BRL",
      annualRate: 12.1,
    },
    {
      id: "inv-fund",
      institution: "Nubank",
      name: "Fundo Reserva Imediata",
      type: "Fundo",
      balanceCents: 894560,
      amountOriginalCents: 850000,
      profitCents: 44560,
      currency: "BRL",
    },
    {
      id: "inv-us",
      institution: "Conta global",
      name: "US Treasury ETF",
      type: "ETF",
      balanceCents: 327850,
      amountOriginalCents: 310000,
      profitCents: 17850,
      currency: "USD",
    },
  ],
  vaults: [
    {
      id: "vault-emergency",
      name: "Reserva de emergência",
      icon: "SAFETY",
      targetCents: 3000000,
      savedCents: 1264500,
      currency: "BRL",
      contributions: [{ id: "vc-1", amountCents: 50000, date: monthDate(0, 5) }],
    },
    {
      id: "vault-trip",
      name: "Viagem",
      icon: "TRAVEL",
      targetCents: 850000,
      savedCents: 238000,
      currency: "BRL",
      contributions: [{ id: "vc-2", amountCents: 20000, date: monthDate(0, 8) }],
    },
  ],
  goals: [
    {
      id: "goal-phone",
      name: "Novo celular",
      priceCents: 639900,
      savedCents: 160000,
      contributionCents: 40000,
      currency: "BRL",
      frequency: "MONTHLY",
      estimatedDate: dateFromNow(365),
      status: "ACTIVE",
    },
  ],
  wishlist: [
    {
      id: "wish-headphones",
      url: "https://example.com/fone",
      title: "Fone com cancelamento de ruído",
      priceCents: 189900,
      currency: "BRL",
      contributionCents: 10000,
      frequency: "WEEKLY",
      createdAt: dateFromNow(-12),
    },
  ],
  connections: [
    {
      id: "conn-nubank",
      institution: "Nubank",
      status: "CONNECTED",
      lastSyncAt: new Date().toISOString(),
      products: ["Contas", "Cartões", "Transações", "Investimentos"],
    },
  ],
  notifications: { inApp: true, email: false, push: false, daysBefore: 3 },
};
