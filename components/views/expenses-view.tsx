"use client";

import { FormEvent, useMemo, useState } from "react";
import {
  ArrowsLeftRight,
  Barcode,
  CreditCard,
  MagnifyingGlass,
  NotePencil,
  Repeat,
  SlidersHorizontal,
  UserPlus,
  Wallet,
} from "@phosphor-icons/react";
import { Modal } from "@/components/ui/modal";
import { fullDate, money, parseMoney, shortDate } from "@/lib/finance";
import type { FinanceData, SharedExpense, Transaction, TransactionKind } from "@/lib/types";

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
  const [filter, setFilter] = useState<(typeof filters)[number]["id"]>("ALL");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Transaction | null>(null);

  const visible = useMemo(() => data.transactions
    .filter((item) => filter === "ALL" || item.kind === filter)
    .filter((item) => `${item.description} ${item.category}`.toLocaleLowerCase("pt-BR").includes(search.toLocaleLowerCase("pt-BR")))
    .sort((a, b) => b.date.localeCompare(a.date)), [data.transactions, filter, search]);

  const expenseTotal = visible.filter((item) => item.flow === "EXPENSE" && item.currency === "BRL").reduce((sum, item) => sum + item.amountCents, 0);

  return (
    <div className="stack">
      <div className="page-heading"><div><h2>Gastos e movimentações</h2><p>Encontre, classifique e anote cada lançamento.</p></div><span className="period-total"><small>Total filtrado</small><strong>{money(expenseTotal)}</strong></span></div>

      <section className="expense-toolbar">
        <div className="search-box"><MagnifyingGlass size={20} /><label className="sr-only" htmlFor="expense-search">Buscar gasto</label><input id="expense-search" type="search" placeholder="Buscar por nome ou categoria" value={search} onChange={(event) => setSearch(event.target.value)} /></div>
        <div className="filter-scroll" aria-label="Filtrar meio de pagamento">{filters.map((item) => <button key={item.id} type="button" className={filter === item.id ? "active" : ""} onClick={() => setFilter(item.id)}>{item.label}</button>)}</div>
      </section>

      <section className="panel transaction-panel">
        <div className="transaction-head"><span><SlidersHorizontal size={18} /> {visible.length} movimentações</span><small>Últimos 6 meses</small></div>
        <div className="transaction-list">
          {visible.map((item) => {
            const Icon = kindIcon(item.kind);
            const shared = data.sharedExpenses.find((entry) => entry.transactionId === item.id && entry.status !== "PAID");
            return (
              <button key={item.id} type="button" className="transaction-row" onClick={() => setSelected(item)}>
                <span className={`row-icon kind-${item.kind.toLocaleLowerCase()}`}><Icon size={21} /></span>
                <span className="transaction-copy"><strong>{item.description}</strong><small>{shortDate(item.date)}<span>•</span>{item.category}{item.installment && <><span>•</span>{item.installment.current}/{item.installment.total}</>}</small>{shared && <em><UserPlus size={14} /> Cobrar {shared.person}</em>}</span>
                <span className={`transaction-value ${item.flow === "INCOME" ? "income" : ""}`}>{item.flow === "INCOME" ? "+" : "-"}{money(item.amountCents, item.currency)}</span>
              </button>
            );
          })}
          {!visible.length && <div className="empty-state"><div><span className="feature-icon"><MagnifyingGlass size={27} /></span><h3>Nenhum lançamento encontrado</h3><p>Ajuste a busca ou escolha outro filtro.</p></div></div>}
        </div>
      </section>

      <TransactionEditor key={selected?.id ?? "none"} transaction={selected} shared={selected ? data.sharedExpenses.find((item) => item.transactionId === selected.id) : undefined} onClose={() => setSelected(null)} onSave={(transaction, shared) => {
        updateData((current) => ({
          ...current,
          transactions: current.transactions.map((item) => item.id === transaction.id ? transaction : item),
          sharedExpenses: shared
            ? [...current.sharedExpenses.filter((item) => item.transactionId !== transaction.id), shared]
            : current.sharedExpenses,
        }));
        setSelected(null);
      }} />
    </div>
  );
}

function TransactionEditor({ transaction, shared, onClose, onSave }: { transaction: Transaction | null; shared?: SharedExpense; onClose: () => void; onSave: (transaction: Transaction, shared?: SharedExpense) => void }) {
  const [category, setCategory] = useState(transaction?.category ?? "Outros");
  const [note, setNote] = useState(transaction?.note ?? "");
  const [charge, setCharge] = useState(Boolean(shared));
  const [person, setPerson] = useState(shared?.person ?? "");
  const [amount, setAmount] = useState(shared ? money(shared.amountCents).replace("R$", "").trim() : transaction ? (transaction.amountCents / 100).toFixed(2).replace(".", ",") : "");
  const [dueDate, setDueDate] = useState(shared?.dueDate ?? addDays(transaction?.date ?? "", 14));

  return <Modal open={Boolean(transaction)} title={transaction?.description ?? "Editar gasto"} description={transaction ? `${fullDate(transaction.date)} • dado bancário preservado` : undefined} onClose={onClose}>
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

function addDays(isoDate: string, days: number) {
  if (!isoDate) return "";
  const date = new Date(`${isoDate.slice(0, 10)}T12:00:00`);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}
