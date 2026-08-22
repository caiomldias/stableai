import type { SupabaseClient } from "@supabase/supabase-js";
import { classifyTransaction, normalizeDescription } from "@/lib/finance";
import { loadFinanceState, saveFinanceState } from "@/lib/server-finance";
import { getServerEnv } from "@/lib/server-env";
import type { Account, Boleto, Connection, Investment, RecurringPayment, Transaction } from "@/lib/types";

const PLUGGY_API = "https://api.pluggy.ai";
let apiKeyCache: { value: string; expiresAt: number } | null = null;

type JsonRecord = Record<string, unknown>;

const record = (value: unknown): JsonRecord => value && typeof value === "object" && !Array.isArray(value) ? value as JsonRecord : {};
const text = (value: unknown, fallback = "") => typeof value === "string" ? value : fallback;
const number = (value: unknown, fallback = 0) => typeof value === "number" && Number.isFinite(value) ? value : fallback;
const array = (value: unknown): unknown[] => Array.isArray(value) ? value : [];

export async function getPluggyApiKey() {
  if (apiKeyCache && apiKeyCache.expiresAt > Date.now() + 60_000) return apiKeyCache.value;
  const clientId = getServerEnv("PLUGGY_CLIENT_ID");
  const clientSecret = getServerEnv("PLUGGY_CLIENT_SECRET");
  if (!clientId || !clientSecret) throw new Error("Credenciais da Pluggy não configuradas no servidor.");
  const response = await fetch(`${PLUGGY_API}/auth`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ clientId, clientSecret }),
    cache: "no-store",
  });
  const result = await response.json() as JsonRecord;
  if (!response.ok || !text(result.apiKey)) throw new Error(text(result.message, "Falha ao autenticar na Pluggy."));
  apiKeyCache = { value: text(result.apiKey), expiresAt: Date.now() + 110 * 60_000 };
  return apiKeyCache.value;
}

export async function createConnectToken(userId: string) {
  const apiKey = await getPluggyApiKey();
  const response = await fetch(`${PLUGGY_API}/connect_token`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-API-KEY": apiKey },
    body: JSON.stringify({
      options: {
        clientUserId: userId,
        avoidDuplicates: true,
      },
    }),
    cache: "no-store",
  });
  const result = await response.json() as JsonRecord;
  if (!response.ok) throw new Error(text(result.message, "Não foi possível criar o token de conexão."));
  return result;
}

export async function deletePluggyItem(itemId: string) {
  const apiKey = await getPluggyApiKey();
  const response = await fetch(`${PLUGGY_API}/items/${encodeURIComponent(itemId)}`, {
    method: "DELETE",
    headers: { "X-API-KEY": apiKey },
    cache: "no-store",
  });
  if (!response.ok && response.status !== 404) {
    const result = await response.json().catch(() => ({})) as JsonRecord;
    throw new Error(text(result.message, "Não foi possível desconectar a instituição na Pluggy."));
  }
}

async function pluggyGet(path: string, apiKey: string) {
  const response = await fetch(`${PLUGGY_API}${path}`, { headers: { "X-API-KEY": apiKey }, cache: "no-store" });
  const result = await response.json() as JsonRecord;
  if (!response.ok) throw new Error(text(result.message, `Falha ao consultar ${path}.`));
  return result;
}

async function listAll(path: string, apiKey: string, maxPages = 20): Promise<JsonRecord[]> {
  const output: JsonRecord[] = [];
  let next: string | null = path;
  let page = 0;
  while (next && page < maxPages) {
    const response: JsonRecord = await pluggyGet(next, apiKey);
    output.push(...array(response.results).map(record));
    const rawNext = text(response.next);
    next = rawNext ? (rawNext.startsWith("/") ? rawNext : `${new URL(path, PLUGGY_API).pathname}${rawNext.startsWith("?") ? rawNext : `?${rawNext}`}`) : null;
    page += 1;
  }
  return output;
}

function institutionName(item: JsonRecord) {
  const connector = record(item.connector);
  return text(connector.name, text(item.connectorName, "Instituição financeira"));
}

function mapAccount(raw: JsonRecord, institution: string): Account {
  const type = text(raw.type) === "CREDIT" ? "CREDIT" : "BANK";
  return {
    id: text(raw.id),
    institution,
    name: text(raw.marketingName, text(raw.name, type === "CREDIT" ? "Cartão" : "Conta")),
    type,
    balanceCents: Math.round(number(raw.balance) * 100),
    currency: text(raw.currencyCode) === "USD" ? "USD" : "BRL",
    color: type === "CREDIT" ? "#B9A6F4" : "#7CCCF4",
  };
}

function mapTransaction(raw: JsonRecord, account: Account): Transaction {
  const description = text(raw.description, text(raw.descriptionRaw, "Movimentação"));
  const rawAmount = number(raw.amount);
  const pluggyType = text(raw.type);
  const flow = account.type === "CREDIT"
    ? (rawAmount >= 0 ? "EXPENSE" : "INCOME")
    : (pluggyType === "CREDIT" ? "INCOME" : "EXPENSE");
  const kind = classifyTransaction(description, account.type);
  return {
    id: text(raw.id),
    source: "PLUGGY",
    accountId: account.id,
    description,
    merchant: text(record(raw.merchant).name) || undefined,
    amountCents: Math.abs(Math.round(rawAmount * 100)),
    currency: account.currency,
    date: text(raw.date).slice(0, 10),
    flow,
    kind,
    category: text(raw.category, "Outros"),
    originalCategory: text(raw.category, "Outros"),
    installment: number(record(raw.creditCardMetadata).totalInstallments) > 1 ? {
      current: number(record(raw.creditCardMetadata).installmentNumber, 1),
      total: number(record(raw.creditCardMetadata).totalInstallments, 1),
    } : undefined,
  };
}

function mapInvestment(raw: JsonRecord, institution: string): Investment {
  return {
    id: text(raw.id),
    institution: text(record(raw.institution).name, institution),
    name: text(raw.name, text(raw.code, "Investimento")),
    type: text(raw.subtype, text(raw.type, "Investimento")).replaceAll("_", " "),
    balanceCents: Math.round(number(raw.balance, number(raw.amount)) * 100),
    amountOriginalCents: raw.amountOriginal == null ? undefined : Math.round(number(raw.amountOriginal) * 100),
    profitCents: raw.amountProfit == null ? undefined : Math.round(number(raw.amountProfit) * 100),
    currency: text(raw.currencyCode) === "USD" ? "USD" : "BRL",
    annualRate: raw.annualRate == null ? undefined : number(raw.annualRate),
  };
}

function boletoFromTransaction(raw: JsonRecord, transaction: Transaction): Boleto | null {
  const paymentData = record(raw.paymentData);
  const metadata = record(paymentData.boletoMetadata);
  const digitableLine = text(metadata.digitableLine);
  if (!digitableLine && transaction.kind !== "BOLETO") return null;
  return {
    id: `boleto-${transaction.id}`,
    description: transaction.description,
    issuer: text(record(raw.merchant).name, "Beneficiário não informado"),
    amountCents: Math.round(number(metadata.baseAmount, transaction.amountCents / 100) * 100),
    currency: transaction.currency,
    dueDate: text(paymentData.dueDate, transaction.date).slice(0, 10),
    status: text(raw.status) === "POSTED" ? "PAID" : "PENDING",
    digitableLine: digitableLine || undefined,
    source: "PLUGGY",
  };
}

function detectRecurring(transactions: Transaction[]): RecurringPayment[] {
  const grouped = new Map<string, Transaction[]>();
  transactions.filter((item) => item.flow === "EXPENSE").forEach((item) => {
    const key = `${item.currency}:${normalizeDescription(item.description)}`;
    if (!key.split(":")[1]) return;
    grouped.set(key, [...(grouped.get(key) ?? []), item]);
  });
  return [...grouped.entries()].flatMap(([key, items]) => {
    if (items.length < 3) return [];
    const average = items.reduce((sum, item) => sum + item.amountCents, 0) / items.length;
    const variance = Math.max(...items.map((item) => Math.abs(item.amountCents - average) / Math.max(average, 1)));
    if (variance > .1) return [];
    const latest = [...items].sort((a, b) => b.date.localeCompare(a.date))[0];
    const next = new Date(`${latest.date}T12:00:00`); next.setMonth(next.getMonth() + 1);
    return [{ id: `rec-${key}`, description: latest.description, averageAmountCents: Math.round(average), currency: latest.currency, nextDate: next.toISOString().slice(0, 10), confidence: Math.max(.7, 1 - variance), confirmed: false }];
  });
}

export async function syncPluggyItem(admin: SupabaseClient, userId: string, itemId: string) {
  const apiKey = await getPluggyApiKey();
  const item = await pluggyGet(`/items/${encodeURIComponent(itemId)}`, apiKey);
  if (text(item.clientUserId) !== userId) throw new Error("Item não pertence a este usuário.");
  const institution = institutionName(item);
  const rawAccounts = await listAll(`/accounts?itemId=${encodeURIComponent(itemId)}`, apiKey);
  const accounts = rawAccounts.map((entry) => mapAccount(entry, institution));
  const sixMonthsAgo = new Date(); sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  const rawTransactionsByAccount = await Promise.all(accounts.map(async (account) => ({
    account,
    items: await listAll(`/transactions?accountId=${encodeURIComponent(account.id)}&from=${sixMonthsAgo.toISOString().slice(0, 10)}`, apiKey),
  })));
  const transactions: Transaction[] = [];
  const boletos: Boleto[] = [];
  rawTransactionsByAccount.forEach(({ account, items }) => items.forEach((entry) => {
    const transaction = mapTransaction(entry, account);
    transactions.push(transaction);
    const boleto = boletoFromTransaction(entry, transaction);
    if (boleto) boletos.push(boleto);
  }));
  const rawInvestments = await listAll(`/investments?itemId=${encodeURIComponent(itemId)}`, apiKey).catch(() => []);
  const investments = rawInvestments.map((entry) => mapInvestment(entry, institution));
  const products = [...new Set([accounts.length ? "Contas" : "", transactions.length ? "Transações" : "", accounts.some((entry) => entry.type === "CREDIT") ? "Cartões" : "", investments.length ? "Investimentos" : ""].filter(Boolean))];
  const now = new Date().toISOString();

  const { data: connectionRow, error: connectionError } = await admin.from("institution_connections").upsert({ user_id: userId, pluggy_item_id: itemId, institution, status: "CONNECTED", products, last_sync_at: now }, { onConflict: "user_id,pluggy_item_id" }).select("id").single();
  if (connectionError) throw connectionError;

  if (accounts.length) {
    const { error } = await admin.from("accounts").upsert(accounts.map((account) => ({ user_id: userId, connection_id: connectionRow.id, pluggy_account_id: account.id, institution: account.institution, name: account.name, type: account.type, currency: account.currency, balance_cents: account.balanceCents, updated_at: now })), { onConflict: "user_id,pluggy_account_id" });
    if (error) throw error;
  }
  const { data: accountRows } = await admin.from("accounts").select("id,pluggy_account_id").eq("user_id", userId);
  const accountUuid = new Map((accountRows ?? []).map((entry) => [entry.pluggy_account_id as string, entry.id as string]));
  if (transactions.length) {
    const { error } = await admin.from("transactions").upsert(transactions.map((transaction) => ({ user_id: userId, account_id: accountUuid.get(transaction.accountId), pluggy_transaction_id: transaction.id, description: transaction.description, merchant: transaction.merchant, amount_cents: transaction.amountCents, currency: transaction.currency, transaction_date: transaction.date, flow: transaction.flow, kind: transaction.kind, original_category: transaction.originalCategory, updated_at: now })), { onConflict: "user_id,pluggy_transaction_id" });
    if (error) throw error;
  }
  if (investments.length) {
    const { error } = await admin.from("investments").upsert(investments.map((investment) => ({ user_id: userId, connection_id: connectionRow.id, pluggy_investment_id: investment.id, institution: investment.institution, name: investment.name, type: investment.type, currency: investment.currency, balance_cents: investment.balanceCents, original_cents: investment.amountOriginalCents, profit_cents: investment.profitCents, updated_at: now })), { onConflict: "user_id,pluggy_investment_id" });
    if (error) throw error;
  }

  const state = await loadFinanceState(admin, userId);
  const previousAccountIds = new Set(state.accounts.filter((entry) => entry.institution === institution).map((entry) => entry.id));
  const previousTransactionIds = new Set(state.transactions.filter((entry) => previousAccountIds.has(entry.accountId)).map((entry) => entry.id));
  state.accounts = [...state.accounts.filter((entry) => entry.institution !== institution), ...accounts];
  state.transactions = mergePluggyTransactions(state.transactions, previousAccountIds, transactions);
  state.investments = [...state.investments.filter((entry) => entry.institution !== institution), ...investments];
  state.boletos = [...state.boletos.filter((entry) => entry.source !== "PLUGGY" || !previousTransactionIds.has(entry.id.replace(/^boleto-/, ""))), ...boletos];
  state.recurring = detectRecurring(state.transactions);
  const connection: Connection = { id: connectionRow.id as string, itemId, institution, status: "CONNECTED", lastSyncAt: now, products };
  state.connections = [...state.connections.filter((entry) => entry.itemId !== itemId), connection];
  await saveFinanceState(admin, userId, state);
  await admin.from("audit_events").insert({ user_id: userId, action: "pluggy.sync", target_type: "institution_connection", target_id: connection.id, metadata: { accounts: accounts.length, transactions: transactions.length, investments: investments.length } });
  return { institution, counts: { accounts: accounts.length, transactions: transactions.length, investments: investments.length, boletos: boletos.length } };
}

export function mergePluggyTransactions(
  current: Transaction[],
  replacedAccountIds: ReadonlySet<string>,
  incoming: Transaction[],
) {
  return [
    ...current.filter((entry) => entry.source === "MANUAL" || !replacedAccountIds.has(entry.accountId)),
    ...incoming,
  ];
}
