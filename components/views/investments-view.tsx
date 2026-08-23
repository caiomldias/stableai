"use client";

import { Bank, ChartDonut, Coins, TrendDown, TrendUp, Wallet } from "@phosphor-icons/react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { useLocale } from "@/components/locale-provider";
import { money } from "@/lib/finance";
import type { Currency, FinanceData } from "@/lib/types";

const colors = ["#7CCCF4", "#6FD3A2", "#B9A6F4", "#F1C77C", "#5997BA"];

export function InvestmentsView({ data }: { data: FinanceData }) {
  const { currency } = useLocale();
  const totals = (["BRL", "USD"] as Currency[]).map((currency) => ({
    currency,
    balance: data.investments.filter((item) => item.currency === currency).reduce((sum, item) => sum + item.balanceCents, 0),
    original: data.investments.filter((item) => item.currency === currency).reduce((sum, item) => sum + (item.amountOriginalCents ?? 0), 0),
  }));
  const selectedTypes = new Map<string, number>();
  data.investments.filter((item) => item.currency === currency).forEach((item) => selectedTypes.set(item.type, (selectedTypes.get(item.type) ?? 0) + item.balanceCents / 100));
  const allocation = [...selectedTypes.entries()].map(([name, value]) => ({ name, value }));

  return <div className="stack">
    <div className="page-heading"><div><h2>Investimentos</h2><p>Patrimônio importado das instituições conectadas.</p></div><span className="coverage-badge"><Bank size={17} /> Dados da Pluggy</span></div>

    <section className="investment-summary">
      {totals.map((item) => {
        const profit = item.balance - item.original;
        return <article key={item.currency}><span>{item.currency === "BRL" ? "Patrimônio em reais" : "Patrimônio em dólar"}</span><strong>{money(item.balance, item.currency)}</strong><small className={profit >= 0 ? "positive" : "negative"}>{profit >= 0 ? <TrendUp size={16} /> : <TrendDown size={16} />} {money(Math.abs(profit), item.currency)} sobre o valor aplicado</small></article>;
      })}
    </section>

    <section className="grid-two">
      <article className="panel allocation-panel">
        <div className="panel-header"><div><h3>Distribuição por tipo</h3><p>Investimentos em {currency}</p></div><ChartDonut size={23} color="#7CCCF4" /></div>
        <div className="allocation-layout">
          <div className="allocation-chart">{allocation.length ? <ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={allocation} dataKey="value" nameKey="name" innerRadius="58%" outerRadius="87%" paddingAngle={4} stroke="none">{allocation.map((_item, index) => <Cell key={index} fill={colors[index % colors.length]} />)}</Pie><Tooltip contentStyle={{ background: "#0D2538", border: "1px solid #24465C", borderRadius: 12 }} formatter={(value) => money(Number(value) * 100, currency)} /></PieChart></ResponsiveContainer> : <div className="chart-empty"><Coins size={27} />Sem investimentos em {currency}.</div>}</div>
          <div className="allocation-legend">{allocation.map((item, index) => <div key={item.name}><span style={{ background: colors[index % colors.length] }} /><p><strong>{item.name}</strong><small>{money(item.value * 100, currency)}</small></p></div>)}</div>
        </div>
      </article>

      <article className="investment-note"><span className="feature-icon"><Wallet size={26} /></span><h3>Visão consolidada, sem movimentação</h3><p>O StableAI mostra os investimentos disponíveis na instituição. Compras, vendas e recomendações ficam fora do aplicativo.</p><small>Valores e rentabilidade dependem dos campos fornecidos por cada conector.</small></article>
    </section>

    <section>
      <h3 className="section-title">Seus ativos</h3>
      <div className="investment-list">
        {data.investments.map((item) => {
          const profit = item.profitCents ?? ((item.balanceCents) - (item.amountOriginalCents ?? item.balanceCents));
          return <article key={item.id}><span className="row-icon"><Coins size={21} /></span><div><strong>{item.name}</strong><small>{item.institution}<span>•</span>{item.type}</small></div><div className="investment-values"><strong>{money(item.balanceCents, item.currency)}</strong><small className={profit >= 0 ? "positive" : "negative"}>{profit >= 0 ? "+" : "-"}{money(Math.abs(profit), item.currency)}</small></div></article>;
        })}
        {!data.investments.length && <div className="empty-state panel"><div><span className="feature-icon"><Coins size={28} /></span><h3>Nenhum investimento encontrado</h3><p>Conecte uma instituição com cobertura de investimentos.</p></div></div>}
      </div>
    </section>
  </div>;
}
