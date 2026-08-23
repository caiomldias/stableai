"use client";

import { FormEvent, useMemo, useState } from "react";
import {
  ArrowsLeftRight,
  Barcode,
  CreditCard,
  Gauge,
  MagnifyingGlass,
  NotePencil,
  PencilSimple,
  Plus,
  Repeat,
  SlidersHorizontal,
  Trash,
  UserPlus,
  Wallet,
} from "@phosphor-icons/react";
import { Modal } from "@/components/ui/modal";
import { useLocale } from "@/components/locale-provider";
import { getStoredCurrency } from "@/lib/locale";
import { classifyTransaction, computeBudgetUsage, filterTransactions, fullDate, money, parseMoney, shortDate, totalsByCurrency } from "@/lib/finance";
import type { Budget, Currency, FinanceData, SharedExpense, Transaction, TransactionKind } from "@/lib/types";

const filters: { id: "ALL" | TransactionKind; label: string }[] = [
  { id: "ALL", label: "Todos" },
  { id: "PIX", label: "PIX" },
  { id: "CARD", label: "Cartão" },
  { id: "BOLETO", label: "Boleto" },
  { id: "RECURRING", label: "Recorrentes" },
];

const categories = ["Alimentação", "Assinaturas", "Casa", "Compras", "Educação", "Lazer", "Saúde", "Trabalho", "Transferência", "Transporte", "Outros"];

const kindIcon = (kind: TransactionKind) => {
  if (kind === "PIX") return ArrowsLeftRight;
  if (kind === "CARD") return CreditCard;
  if (kind === "BOLETO") return Barcode;
  if (kind === "RECURRING") return Repeat;
  return Wallet;
};

export function ExpensesView({ data, updateData }: { data: FinanceData; updateData: (updater: (current: FinanceData) => FinanceData) => void }) {
  const { t } = useLocale();
  const [filter, setFilter] = useState<(typeof filters)[number]["id"]>("ALL");
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [accountFilter, setAccountFilter] = useState("");
  const [selected, setSelected] = useState<Transaction | null>(null);
  const [budgetEditor, setBudgetEditor] = useState<Budget | "new" | null>(null);
  const [manualOpen, setManualOpen] = useState(false);

  const visible = useMemo(() => filterTransactions(data.transactions, {
    search,
    kind: filter,
    dateFrom,
    dateTo,
    category: categoryFilter,
    accountId: accountFilter,
  }).sort((a, b) => b.date.localeCompare(a.date)), [accountFilter, categoryFilter, data.transactions, dateFrom, dateTo, filter, search]);

  const expenseTotals = totalsByCurrency(visible).filter((item) => item.currency === "BRL" || item.expenseCents > 0);
  const budgetUsage = useMemo(() => computeBudgetUsage(data.transactions, data.budgets), [data.transactions, data.budgets]);
  const availableCategories = useMemo(() => [...new Set(data.transactions.map((item) => item.category))].sort((a, b) => a.localeCompare(b, "pt-BR")), [data.transactions]);
  const hasManualAccount = data.transactions.some((item) => item.accountId === "manual");
  const filtersActive = Boolean(search || filter !== "ALL" || dateFrom || dateTo || categoryFilter || accountFilter);

  return (
    <div className="stack">
      <div className="page-heading"><div><h2>{t("expenses.title")}</h2><p>{t("expenses.subtitle")}</p></div><div className="expense-heading-actions"><span className="period-total"><small>Despesas filtradas</small>{expenseTotals.map((total) => <strong key={total.currency}>{money(total.expenseCents, total.currency)}</strong>)}</span><button className="button primary" type="button" aria-label={t("expenses.add")} onClick={() => setManualOpen(true)}><Plus size={18} /><span>{t("expenses.add")}</span></button></div></div>

      <section className="budget-section">
        <div className="section-heading"><div><h3>{t("expenses.budget")}</h3><p>Defina tetos por categoria e acompanhe o consumo.</p></div><button className="button small ghost" type="button" onClick={() => setBudgetEditor("new")}><Plus size={17} /> {t("expenses.newBudget")}</button></div>
        <div className="budget-grid">
          {budgetUsage.map((budget) => {
            const tone = budget.percentage >= 100 ? "danger" : budget.percentage >= 80 ? "warning" : "success";
            return <article className="panel budget-card" key={budget.id}><div className="budget-top"><span className={`row-icon budget-${tone}`}><Gauge size={21} /></span><div><strong>{budget.category}</strong><small>{budget.currency}</small></div><div className="budget-actions"><button type="button" aria-label={`Editar teto de ${budget.category}`} onClick={() => setBudgetEditor(budget)}><PencilSimple size={17} /></button><button type="button" aria-label={`Excluir teto de ${budget.category}`} onClick={() => updateData((current) => ({ ...current, budgets: current.budgets.filter((item) => item.id !== budget.id) }))}><Trash size={17} /></button></div></div><div className="budget-values"><strong>{money(budget.spentCents, budget.currency)} de {money(budget.monthlyLimitCents, budget.currency)}</strong><span>{Math.round(budget.percentage)}%</span></div><div className={`budget-progress ${tone}`}><span style={{ width: `${Math.min(budget.percentage, 100)}%` }} /></div></article>;
          })}
          {!budgetUsage.length && <div className="panel budget-empty"><Gauge size={24} /><span>Crie seu primeiro teto mensal.</span></div>}
        </div>
      </section>

      <section className="expense-toolbar">
        <div className="search-box"><MagnifyingGlass size={20} /><label className="sr-only" htmlFor="expense-search">Buscar gasto</label><input id="expense-search" type="search" placeholder="Buscar descrição, estabelecimento ou categoria" value={search} onChange={(event) => setSearch(event.target.value)} /></div>
        <div className="filter-scroll" aria-label="Filtrar meio de pagamento">{filters.map((item) => <button key={item.id} type="button" className={filter === item.id ? "active" : ""} onClick={() => setFilter(item.id)}>{item.label}</button>)}</div>
        <div className="advanced-filters"><label><span>De</span><input className="input" type="date" value={dateFrom} max={dateTo || undefined} onChange={(event) => setDateFrom(event.target.value)} /></label><label><span>Até</span><input className="input" type="date" value={dateTo} min={dateFrom || undefined} onChange={(event) => setDateTo(event.target.value)} /></label><label><span>Categoria</span><select className="select" value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}><option value="">Todas</option>{availableCategories.map((item) => <option key={item}>{item}</option>)}</select></label><label><span>Conta</span><select className="select" value={accountFilter} onChange={(event) => setAccountFilter(event.target.value)}><option value="">Todas</option>{hasManualAccount && <option value="manual">Dinheiro / manual</option>}{data.accounts.map((item) => <option key={item.id} value={item.id}>{item.institution} • {item.name}</option>)}</select></label>{filtersActive && <button className="button small ghost clear-filters" type="button" onClick={() => { setSearch(""); setFilter("ALL"); setDateFrom(""); setDateTo(""); setCategoryFilter(""); setAccountFilter(""); }}>Limpar</button>}</div>
      </section>

      <section className="panel transaction-panel">
        <div className="transaction-head"><span><SlidersHorizontal size={18} /> {visible.length} movimentações</span><small>{filtersActive ? "Filtros combinados" : "Últimos 6 meses"}</small></div>
        <div className="transaction-list">
          {visible.map((item) => {
            const Icon = kindIcon(item.kind);
            const shared = data.sharedExpenses.find((entry) => entry.transactionId === item.id && entry.status !== "PAID");
            return (
              <button key={item.id} type="button" className="transaction-row" onClick={() => setSelected(item)}>
                <span className={`row-icon kind-${item.kind.toLocaleLowerCase()}`}><Icon size={21} /></span>
                <span className="transaction-copy"><strong>{item.description}{item.source === "MANUAL" && <span className="manual-badge">Manual</span>}</strong><small>{shortDate(item.date)}<span>•</span>{item.category}{item.installment && <><span>•</span>{item.installment.current}/{item.installment.total}</>}</small>{shared && <em><UserPlus size={14} /> Cobrar {shared.person}</em>}</span>
                <span className={`transaction-value ${item.flow === "INCOME" ? "income" : ""}`}>{item.flow === "INCOME" ? "+" : "-"}{money(item.amountCents, item.currency)}</span>
              </button>
            );
          })}
          {!visible.length && <div className="empty-state"><div><span className="feature-icon"><MagnifyingGlass size={27} /></span><h3>Nenhum lançamento encontrado</h3><p>Ajuste a busca ou escolha outro filtro.</p></div></div>}
        </div>
      </section>

      <TransactionEditor key={`transaction-${selected?.id ?? "none"}`} transaction={selected} shared={selected ? data.sharedExpenses.find((item) => item.transactionId === selected.id) : undefined} onClose={() => setSelected(null)} onSave={(transaction, shared) => {
        updateData((current) => ({
          ...current,
          transactions: current.transactions.map((item) => item.id === transaction.id ? transaction : item),
          sharedExpenses: shared
            ? [...current.sharedExpenses.filter((item) => item.transactionId !== transaction.id), shared]
            : current.sharedExpenses,
        }));
        setSelected(null);
      }} />
      <BudgetForm key={`budget-${budgetEditor === "new" ? "new" : budgetEditor?.id ?? "none"}`} budget={budgetEditor === "new" ? undefined : budgetEditor ?? undefined} open={Boolean(budgetEditor)} onClose={() => setBudgetEditor(null)} onSave={(budget) => {
        updateData((current) => ({ ...current, budgets: [...current.budgets.filter((item) => item.id !== budget.id), budget] }));
        setBudgetEditor(null);
      }} />
      {manualOpen && <ManualTransactionForm open accounts={data.accounts} onClose={() => setManualOpen(false)} onSave={(transaction) => {
        updateData((current) => ({ ...current, transactions: [transaction, ...current.transactions] }));
        setManualOpen(false);
      }} />}
    </div>
  );
}

function BudgetForm({ budget, open, onClose, onSave }: { budget?: Budget; open: boolean; onClose: () => void; onSave: (budget: Budget) => void }) {
  const [category, setCategory] = useState(budget?.category ?? categories[0]);
  const [limit, setLimit] = useState(budget ? (budget.monthlyLimitCents / 100).toFixed(2).replace(".", ",") : "");
  const [currency, setCurrency] = useState<Currency>(budget?.currency ?? getStoredCurrency());
  return <Modal open={open} title={budget ? "Editar teto mensal" : "Novo teto mensal"} description="O progresso considera as despesas do mês atual." onClose={onClose}><form className="form-grid" onSubmit={(event: FormEvent) => { event.preventDefault(); onSave({ id: budget?.id ?? crypto.randomUUID(), category, monthlyLimitCents: parseMoney(limit), currency }); }}><div className="field"><label htmlFor="budget-category">Categoria</label><select className="select" id="budget-category" value={category} onChange={(event) => setCategory(event.target.value)}>{categories.map((item) => <option key={item}>{item}</option>)}</select></div><div className="form-row"><div className="field"><label htmlFor="budget-limit">Teto mensal</label><input className="input" id="budget-limit" inputMode="decimal" value={limit} onChange={(event) => setLimit(event.target.value)} placeholder="1.000,00" required /></div><div className="field"><label htmlFor="budget-currency">Moeda</label><select className="select" id="budget-currency" value={currency} onChange={(event) => setCurrency(event.target.value as Currency)}><option value="BRL">Real (BRL)</option><option value="USD">Dólar (USD)</option></select></div></div><div className="form-actions"><button className="button ghost" type="button" onClick={onClose}>Cancelar</button><button className="button primary" type="submit">Salvar teto</button></div></form></Modal>;
}

function TransactionEditor({ transaction, shared, onClose, onSave }: { transaction: Transaction | null; shared?: SharedExpense; onClose: () => void; onSave: (transaction: Transaction, shared?: SharedExpense) => void }) {
  const [category, setCategory] = useState(transaction?.category ?? "Outros");
  const [note, setNote] = useState(transaction?.note ?? "");
  const [charge, setCharge] = useState(Boolean(shared));
  const [person, setPerson] = useState(shared?.person ?? "");
  const [amount, setAmount] = useState(shared ? money(shared.amountCents).replace("R$", "").trim() : transaction ? (transaction.amountCents / 100).toFixed(2).replace(".", ",") : "");
  const [dueDate, setDueDate] = useState(shared?.dueDate ?? addDays(transaction?.date ?? "", 14));

  return <Modal open={Boolean(transaction)} title={transaction?.description ?? "Editar gasto"} description={transaction ? `${fullDate(transaction.date)} • ${transaction.source === "MANUAL" ? "lançamento manual" : "dado bancário preservado"}` : undefined} onClose={onClose}>
    {transaction && <form className="form-grid" onSubmit={(event: FormEvent) => {
      event.preventDefault();
      const nextShared: SharedExpense | undefined = charge ? {
        id: shared?.id ?? crypto.randomUUID(),
        transactionId: transaction.id,
        person,
        amountCents: parseMoney(amount),
        currency: transaction.currency,
        dueDate,
        installments: shared?.installments ?? 1,
        note: note || undefined,
        status: shared?.status ?? "PENDING",
      } : undefined;
      onSave({ ...transaction, category, note }, nextShared);
    }}>
      <div className="original-data"><span>Valor original</span><strong>{money(transaction.amountCents, transaction.currency)}</strong></div>
      <div className="field"><label htmlFor="category">Categoria</label><select className="select" id="category" value={category} onChange={(event) => setCategory(event.target.value)}>{categories.map((item) => <option key={item}>{item}</option>)}</select></div>
      <div className="field"><label htmlFor="note">Anotação pessoal</label><textarea className="textarea" id="note" placeholder="Por que este gasto foi feito?" value={note} onChange={(event) => setNote(event.target.value)} /></div>
      {transaction.kind === "CARD" && <div className="charge-box"><label className="switch-row"><span><UserPlus size={21} /><span><strong>Alguém precisa me pagar</strong><small>Crie um lembrete de cobrança.</small></span></span><input type="checkbox" checked={charge} onChange={(event) => setCharge(event.target.checked)} /></label>{charge && <div className="charge-fields"><div className="field"><label htmlFor="person">Quem você deve cobrar</label><input className="input" id="person" value={person} onChange={(event) => setPerson(event.target.value)} required /></div><div className="form-row"><div className="field"><label htmlFor="share-amount">Valor</label><input className="input" id="share-amount" inputMode="decimal" value={amount} onChange={(event) => setAmount(event.target.value)} required /></div><div className="field"><label htmlFor="share-due">Lembrar em</label><input className="input" id="share-due" type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} required /></div></div></div>}</div>}
      <div className="form-actions"><button className="button ghost" type="button" onClick={onClose}>Cancelar</button><button className="button primary" type="submit"><NotePencil size={18} /> Salvar</button></div>
    </form>}
  </Modal>;
}

function ManualTransactionForm({ open, accounts, onClose, onSave }: { open: boolean; accounts: FinanceData["accounts"]; onClose: () => void; onSave: (transaction: Transaction) => void }) {
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [category, setCategory] = useState(categories[0]);
  const [flow, setFlow] = useState<Transaction["flow"]>("EXPENSE");
  const [currency, setCurrency] = useState<Currency>(getStoredCurrency());
  const [accountId, setAccountId] = useState("manual");
  const account = accounts.find((item) => item.id === accountId);

  return <Modal open={open} title="Adicionar lançamento" description="Registre dinheiro, PIX ou outra movimentação fora da importação bancária." onClose={onClose}><form className="form-grid" onSubmit={(event: FormEvent) => {
    event.preventDefault();
    const amountCents = parseMoney(amount);
    if (amountCents <= 0) return;
    onSave({
      id: crypto.randomUUID(),
      source: "MANUAL",
      accountId,
      description,
      amountCents,
      currency,
      date,
      flow,
      kind: classifyTransaction(description, account?.type),
      category,
      originalCategory: category,
    });
  }}><div className="field"><label htmlFor="manual-description">Descrição</label><input className="input" id="manual-description" value={description} onChange={(event) => setDescription(event.target.value)} required /></div><div className="form-row"><div className="field"><label htmlFor="manual-amount">Valor</label><input className="input" id="manual-amount" inputMode="decimal" value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="0,00" required /></div><div className="field"><label htmlFor="manual-currency">Moeda</label><select className="select" id="manual-currency" value={currency} onChange={(event) => setCurrency(event.target.value as Currency)}><option value="BRL">Real (BRL)</option><option value="USD">Dólar (USD)</option></select></div></div><div className="form-row"><div className="field"><label htmlFor="manual-date">Data</label><input className="input" id="manual-date" type="date" value={date} onChange={(event) => setDate(event.target.value)} required /></div><div className="field"><label htmlFor="manual-flow">Tipo</label><select className="select" id="manual-flow" value={flow} onChange={(event) => setFlow(event.target.value as Transaction["flow"])}><option value="EXPENSE">Saída</option><option value="INCOME">Entrada</option></select></div></div><div className="field"><label htmlFor="manual-category">Categoria</label><select className="select" id="manual-category" value={category} onChange={(event) => setCategory(event.target.value)}>{categories.map((item) => <option key={item}>{item}</option>)}</select></div><div className="field"><label htmlFor="manual-account">Conta</label><select className="select" id="manual-account" value={accountId} onChange={(event) => setAccountId(event.target.value)}><option value="manual">Dinheiro / fora das contas</option>{accounts.map((item) => <option key={item.id} value={item.id}>{item.institution} • {item.name}</option>)}</select></div><div className="form-actions"><button className="button ghost" type="button" onClick={onClose}>Cancelar</button><button className="button primary" type="submit">Salvar lançamento</button></div></form></Modal>;
}

function addDays(isoDate: string, days: number) {
  if (!isoDate) return "";
  const date = new Date(`${isoDate.slice(0, 10)}T12:00:00`);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}
