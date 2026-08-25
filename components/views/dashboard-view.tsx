"use client";

import {
  ArrowDown,
  ArrowRight,
  ArrowUp,
  Bank,
  Barcode,
  BellRinging,
  CreditCard,
  CurrencyDollar,
  HandCoins,
  LockKey,
  Plus,
  Wallet,
} from "@phosphor-icons/react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { AppView } from "@/components/finance-app";
import { useLocale } from "@/components/locale-provider";
import { categoryExpenses, money, monthlyExpenses, shortDate, totalsByCurrency } from "@/lib/finance";
import type { FinanceData } from "@/lib/types";

const palette = ["#7CCCF4", "#B9E4FA", "#5997BA", "#3C718F", "#A8C0CF"];

export function DashboardView({ data, setView, demo, onNotice }: { data: FinanceData; setView: (view: AppView) => void; demo: boolean; onNotice: (message: string) => void }) {
  const { currency, t } = useLocale();
  const totals = totalsByCurrency(data.transactions);
  const brl = totals.find((item) => item.currency === "BRL")!;
  const usd = totals.find((item) => item.currency === "USD")!;
  const selectedTotals = currency === "BRL" ? brl : usd;
  const trend = monthlyExpenses(data.transactions, currency);
  const categories = categoryExpenses(data.transactions, currency);
  const upcoming = [
    ...data.boletos.filter((item) => item.status !== "PAID").map((item) => ({ id: item.id, name: item.description, date: item.dueDate, amount: item.amountCents, currency: item.currency, icon: Barcode })),
    ...data.recurring.filter((item) => item.confirmed).map((item) => ({ id: item.id, name: item.description, date: item.nextDate, amount: item.averageAmountCents, currency: item.currency, icon: BellRinging })),
  ].sort((a, b) => a.date.localeCompare(b.date)).slice(0, 4);

  return (
    <div className="stack">
      <section className="welcome-block">
        <div>
          <span className="eyebrow">{t("dashboard.eyebrow")}</span>
          <h2>{t("dashboard.title")}</h2>
          <p>{t("dashboard.subtitle")}</p>
        </div>
        <button className={`button primary${demo ? " guest-locked" : ""}`} type="button" onClick={() => demo ? onNotice("Conectar bancos está disponível apenas para contas reais.") : setView("more")} aria-disabled={demo}><Plus size={19} />{demo && <LockKey size={16} />}<span>{t("dashboard.connect")}</span></button>
      </section>

      <section className="metric-strip" aria-label="Resumo financeiro">
        <article><span><Wallet size={19} /> {t("dashboard.balance")}</span><strong>{money(data.accounts.filter((item) => item.currency === currency && item.type === "BANK").reduce((sum, item) => sum + item.balanceCents, 0), currency)}</strong><small>{currency} {t("dashboard.consolidated")}</small></article>
        <article><span><ArrowDown size={19} /> {t("dashboard.expenses")}</span><strong>{money(selectedTotals.expenseCents, currency)}</strong><small>{data.transactions.filter((item) => item.flow === "EXPENSE" && item.currency === currency).length} {languageLabel(currency, "entries")}</small></article>
        <article><span><ArrowUp size={19} /> {t("dashboard.income")}</span><strong>{money(selectedTotals.incomeCents, currency)}</strong><small>{t("dashboard.history")}</small></article>
        <article><span><CurrencyDollar size={19} /> {t("dashboard.dollarAccount")}</span><strong>{money(data.accounts.filter((item) => item.currency === "USD").reduce((sum, item) => sum + item.balanceCents, 0), "USD")}</strong><small>{languageLabel(currency, "expenses")}: {money(usd.expenseCents, "USD")}</small></article>
      </section>

      <section>
        <div className="section-heading-row"><h3 className="section-title">{t("dashboard.accounts")}</h3><button type="button" onClick={() => setView("more")}>{t("dashboard.manage")} <ArrowRight size={16} /></button></div>
        <div className="account-scroll">
          {data.accounts.map((account) => (
            <article className="account-card" key={account.id} style={{ "--account-accent": account.color } as React.CSSProperties}>
              <div><span className="account-icon">{account.type === "CREDIT" ? <CreditCard size={22} /> : <Bank size={22} />}</span><small>{account.institution}</small></div>
              <strong>{money(account.balanceCents, account.currency)}</strong>
              <p>{account.name}</p>
            </article>
          ))}
          {data.accounts.length === 0 && <article className="account-card empty-account"><Bank size={28} /><strong>Nenhuma conta</strong><p>Conecte uma instituição para começar.</p></article>}
        </div>
      </section>

      <section className="grid-two">
        <article className="panel chart-panel">
          <div className="panel-header"><div><h3>{t("dashboard.monthlyTrend")}</h3><p>{t("dashboard.monthlyTotal")} {currency}</p></div></div>
          <div className="chart-area" aria-label="Gráfico de gastos mensais">
            {trend.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trend} margin={{ top: 12, right: 16, left: -12, bottom: 0 }}>
                  <defs><linearGradient id="expenseFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#7CCCF4" stopOpacity={0.34} /><stop offset="100%" stopColor="#7CCCF4" stopOpacity={0} /></linearGradient></defs>
                  <CartesianGrid vertical={false} stroke="#24465C" strokeDasharray="3 5" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "#A8C0CF", fontSize: 12 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: "#A8C0CF", fontSize: 11 }} tickFormatter={(value) => `${Math.round(value / 1000)}k`} />
                  <Tooltip contentStyle={{ background: "#0D2538", border: "1px solid #24465C", borderRadius: 12 }} formatter={(value) => money(Number(value) * 100, currency)} />
                  <Area type="monotone" dataKey="value" stroke="#7CCCF4" strokeWidth={2.5} fill="url(#expenseFill)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : <ChartEmpty />}
          </div>
        </article>

        <article className="panel chart-panel">
          <div className="panel-header"><div><h3>{t("dashboard.byCategory")}</h3><p>{t("dashboard.whereSpent")}</p></div></div>
          <div className="donut-layout">
            <div className="donut-chart">
              {categories.length ? <ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={categories} dataKey="value" nameKey="name" innerRadius="63%" outerRadius="88%" paddingAngle={3} stroke="none">{categories.map((_item, index) => <Cell key={index} fill={palette[index % palette.length]} />)}</Pie><Tooltip contentStyle={{ background: "#0D2538", border: "1px solid #24465C", borderRadius: 12 }} formatter={(value) => money(Number(value) * 100, currency)} /></PieChart></ResponsiveContainer> : <ChartEmpty />}
            </div>
            <div className="chart-legend">{categories.map((item, index) => <div key={item.name}><span style={{ background: palette[index % palette.length] }} /><p><strong>{item.name}</strong><small>{money(item.value * 100)}</small></p></div>)}</div>
          </div>
        </article>
      </section>

      <section className="grid-two lower-grid">
        <article className="panel upcoming-panel">
          <div className="panel-header"><div><h3>{t("dashboard.upcoming")}</h3><p>{t("dashboard.billsAndRecurring")}</p></div><button className="inline-action" type="button" onClick={() => setView("more")}>{t("dashboard.viewAll")}</button></div>
          <div className="compact-list">
            {upcoming.map((item) => <div key={item.id}><span className="row-icon"><item.icon size={20} /></span><p><strong>{item.name}</strong><small>Vence em {shortDate(item.date)}</small></p><b>{money(item.amount, item.currency)}</b></div>)}
            {!upcoming.length && <div className="mini-empty">Nenhum compromisso próximo.</div>}
          </div>
        </article>

        <article className="assistant-card">
          <span className="assistant-symbol"><HandCoins size={28} /></span>
          <div><h3>{t("dashboard.plan")}</h3><p>{languageLabel(currency, "planCopy")}</p></div>
          <button className="button primary" type="button" onClick={() => setView("plan")}>{t("dashboard.createPlan")} <ArrowRight size={18} /></button>
        </article>
      </section>
    </div>
  );
}

function languageLabel(currency: "BRL" | "USD", key: "entries" | "expenses" | "planCopy") {
  const english = currency === "USD";
  if (key === "entries") return english ? "entries" : "lançamentos";
  if (key === "expenses") return english ? "Expenses" : "Gastos";
  return english ? "Simulate how much to save and see when your next purchase fits your budget." : "Simule quanto guardar e descubra quando sua próxima compra cabe no bolso.";
}

function ChartEmpty() {
  return <div className="chart-empty"><Wallet size={28} /><span>Dados aparecem após a primeira sincronização.</span></div>;
}
