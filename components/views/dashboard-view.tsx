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
import { categoryExpenses, money, monthlyExpenses, shortDate, totalsByCurrency } from "@/lib/finance";
import type { FinanceData } from "@/lib/types";

const palette = ["#7CCCF4", "#B9E4FA", "#5997BA", "#3C718F", "#A8C0CF"];

export function DashboardView({ data, setView, demo, onNotice }: { data: FinanceData; setView: (view: AppView) => void; demo: boolean; onNotice: (message: string) => void }) {
  const totals = totalsByCurrency(data.transactions);
  const brl = totals.find((item) => item.currency === "BRL")!;
  const usd = totals.find((item) => item.currency === "USD")!;
  const trend = monthlyExpenses(data.transactions, "BRL");
  const categories = categoryExpenses(data.transactions, "BRL");
  const upcoming = [
    ...data.boletos.filter((item) => item.status !== "PAID").map((item) => ({ id: item.id, name: item.description, date: item.dueDate, amount: item.amountCents, icon: Barcode })),
    ...data.recurring.filter((item) => item.confirmed).map((item) => ({ id: item.id, name: item.description, date: item.nextDate, amount: item.averageAmountCents, icon: BellRinging })),
  ].sort((a, b) => a.date.localeCompare(b.date)).slice(0, 4);

  return (
    <div className="stack">
      <section className="welcome-block">
        <div>
          <span className="eyebrow">Visão financeira</span>
          <h2>Seu dinheiro em um só lugar.</h2>
          <p>Dados demonstrativos para você explorar todos os recursos.</p>
        </div>
        <button className={`button primary${demo ? " guest-locked" : ""}`} type="button" onClick={() => demo ? onNotice("Conectar bancos está disponível apenas para contas reais.") : setView("more")} aria-disabled={demo}><Plus size={19} />{demo && <LockKey size={16} />}<span>Conectar banco</span></button>
      </section>

      <section className="metric-strip" aria-label="Resumo financeiro">
        <article><span><Wallet size={19} /> Saldo em contas</span><strong>{money(data.accounts.filter((item) => item.currency === "BRL" && item.type === "BANK").reduce((sum, item) => sum + item.balanceCents, 0))}</strong><small>BRL consolidado</small></article>
        <article><span><ArrowDown size={19} /> Gastos no período</span><strong>{money(brl.expenseCents)}</strong><small>{data.transactions.filter((item) => item.flow === "EXPENSE" && item.currency === "BRL").length} lançamentos</small></article>
        <article><span><ArrowUp size={19} /> Receitas no período</span><strong>{money(brl.incomeCents)}</strong><small>Histórico de 6 meses</small></article>
        <article><span><CurrencyDollar size={19} /> Conta em dólar</span><strong>{money(data.accounts.filter((item) => item.currency === "USD").reduce((sum, item) => sum + item.balanceCents, 0), "USD")}</strong><small>Gastos: {money(usd.expenseCents, "USD")}</small></article>
      </section>

      <section>
        <div className="section-heading-row"><h3 className="section-title">Suas contas</h3><button type="button" onClick={() => setView("more")}>Gerenciar <ArrowRight size={16} /></button></div>
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
          <div className="panel-header"><div><h3>Evolução dos gastos</h3><p>Total mensal em reais</p></div></div>
          <div className="chart-area" aria-label="Gráfico de gastos mensais">
            {trend.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trend} margin={{ top: 12, right: 16, left: -12, bottom: 0 }}>
                  <defs><linearGradient id="expenseFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#7CCCF4" stopOpacity={0.34} /><stop offset="100%" stopColor="#7CCCF4" stopOpacity={0} /></linearGradient></defs>
                  <CartesianGrid vertical={false} stroke="#24465C" strokeDasharray="3 5" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "#A8C0CF", fontSize: 12 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: "#A8C0CF", fontSize: 11 }} tickFormatter={(value) => `${Math.round(value / 1000)}k`} />
                  <Tooltip contentStyle={{ background: "#0D2538", border: "1px solid #24465C", borderRadius: 12 }} formatter={(value) => money(Number(value) * 100)} />
                  <Area type="monotone" dataKey="value" stroke="#7CCCF4" strokeWidth={2.5} fill="url(#expenseFill)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : <ChartEmpty />}
          </div>
        </article>

        <article className="panel chart-panel">
          <div className="panel-header"><div><h3>Por categoria</h3><p>Onde o dinheiro foi usado</p></div></div>
          <div className="donut-layout">
            <div className="donut-chart">
              {categories.length ? <ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={categories} dataKey="value" nameKey="name" innerRadius="63%" outerRadius="88%" paddingAngle={3} stroke="none">{categories.map((_item, index) => <Cell key={index} fill={palette[index % palette.length]} />)}</Pie><Tooltip contentStyle={{ background: "#0D2538", border: "1px solid #24465C", borderRadius: 12 }} formatter={(value) => money(Number(value) * 100)} /></PieChart></ResponsiveContainer> : <ChartEmpty />}
            </div>
            <div className="chart-legend">{categories.map((item, index) => <div key={item.name}><span style={{ background: palette[index % palette.length] }} /><p><strong>{item.name}</strong><small>{money(item.value * 100)}</small></p></div>)}</div>
          </div>
        </article>
      </section>

      <section className="grid-two lower-grid">
        <article className="panel upcoming-panel">
          <div className="panel-header"><div><h3>Próximos compromissos</h3><p>Boletos e contas recorrentes</p></div><button className="inline-action" type="button" onClick={() => setView("more")}>Ver todos</button></div>
          <div className="compact-list">
            {upcoming.map((item) => <div key={item.id}><span className="row-icon"><item.icon size={20} /></span><p><strong>{item.name}</strong><small>Vence em {shortDate(item.date)}</small></p><b>{money(item.amount)}</b></div>)}
            {!upcoming.length && <div className="mini-empty">Nenhum compromisso próximo.</div>}
          </div>
        </article>

        <article className="assistant-card">
          <span className="assistant-symbol"><HandCoins size={28} /></span>
          <div><h3>Planeje sem adivinhar</h3><p>Simule quanto guardar e descubra quando sua próxima compra cabe no bolso.</p></div>
          <button className="button primary" type="button" onClick={() => setView("plan")}>Criar um plano <ArrowRight size={18} /></button>
        </article>
      </section>
    </div>
  );
}

function ChartEmpty() {
  return <div className="chart-empty"><Wallet size={28} /><span>Dados aparecem após a primeira sincronização.</span></div>;
}
