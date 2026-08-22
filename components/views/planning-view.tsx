"use client";

import { FormEvent, useMemo, useState } from "react";
import Image from "next/image";
import {
  AirplaneTilt,
  ArrowRight,
  CalendarBlank,
  Check,
  Heart,
  HouseLine,
  LinkSimple,
  PaperPlaneTilt,
  PiggyBank,
  Plus,
  Robot,
  ShieldCheck,
  Sparkle,
  Target,
} from "@phosphor-icons/react";
import { Modal } from "@/components/ui/modal";
import { calculateGoal, fullDate, money, parseMoney, refreshGoal, totalsByCurrency } from "@/lib/finance";
import type { Currency, FinanceData, Frequency, PurchaseGoal, Vault, WishlistItem } from "@/lib/types";

type Tab = "vaults" | "goals" | "wishlist" | "assistant";

const tabs = [
  { id: "vaults" as const, label: "Cofrinhos", icon: PiggyBank },
  { id: "goals" as const, label: "Metas", icon: Target },
  { id: "wishlist" as const, label: "Desejos", icon: Heart },
  { id: "assistant" as const, label: "Instrutor", icon: Robot },
];

const frequencyLabel: Record<Frequency, string> = { DAILY: "por dia", WEEKLY: "por semana", MONTHLY: "por mês" };

export function PlanningView({ data, updateData, accessToken }: { data: FinanceData; updateData: (updater: (current: FinanceData) => FinanceData) => void; accessToken?: string }) {
  const [tab, setTab] = useState<Tab>("vaults");
  const [modal, setModal] = useState<"vault" | "goal" | "wish" | "contribution" | null>(null);
  const [activeVault, setActiveVault] = useState<Vault | null>(null);

  return (
    <div className="stack">
      <div className="page-heading"><div><h2>Planeje o que vem depois</h2><p>Transforme intenção em um valor possível de guardar.</p></div>{tab !== "assistant" && <button className="button primary" type="button" aria-label={`Adicionar ${tab === "vaults" ? "cofrinho" : tab === "goals" ? "meta" : "desejo"}`} onClick={() => setModal(tab === "vaults" ? "vault" : tab === "goals" ? "goal" : "wish")}><Plus size={19} /><span>Adicionar</span></button>}</div>
      <div className="tab-bar" role="tablist" aria-label="Planejamento">{tabs.map((item) => <button role="tab" aria-selected={tab === item.id} className={tab === item.id ? "active" : ""} key={item.id} type="button" onClick={() => setTab(item.id)}><item.icon size={19} />{item.label}</button>)}</div>

      {tab === "vaults" && <Vaults data={data} onContribution={(vault) => { setActiveVault(vault); setModal("contribution"); }} />}
      {tab === "goals" && <Goals goals={data.goals} />}
      {tab === "wishlist" && <Wishlist items={data.wishlist} onCreateGoal={(item) => updateData((current) => ({ ...current, goals: [...current.goals, refreshGoal({ id: crypto.randomUUID(), name: item.title, priceCents: item.priceCents, savedCents: 0, contributionCents: item.contributionCents, currency: item.currency, frequency: item.frequency })] }))} />}
      {tab === "assistant" && <FinancialAssistant data={data} accessToken={accessToken} />}

      <VaultForm open={modal === "vault"} onClose={() => setModal(null)} onSubmit={(vault) => { updateData((current) => ({ ...current, vaults: [...current.vaults, vault] })); setModal(null); }} />
      <GoalForm open={modal === "goal"} onClose={() => setModal(null)} onSubmit={(goal) => { updateData((current) => ({ ...current, goals: [...current.goals, goal] })); setModal(null); }} />
      <WishForm open={modal === "wish"} accessToken={accessToken} onClose={() => setModal(null)} onSubmit={(item) => { updateData((current) => ({ ...current, wishlist: [...current.wishlist, item] })); setModal(null); }} />
      <ContributionForm vault={activeVault} open={modal === "contribution"} onClose={() => setModal(null)} onSubmit={(cents) => { if (!activeVault) return; updateData((current) => ({ ...current, vaults: current.vaults.map((item) => item.id === activeVault.id ? { ...item, savedCents: item.savedCents + cents, contributions: [...item.contributions, { id: crypto.randomUUID(), amountCents: cents, date: new Date().toISOString().slice(0, 10) }] } : item) })); setModal(null); }} />
    </div>
  );
}

function Vaults({ data, onContribution }: { data: FinanceData; onContribution: (vault: Vault) => void }) {
  if (!data.vaults.length) return <Empty icon={PiggyBank} title="Seu primeiro cofrinho" text="Separe virtualmente um valor para uma reserva ou objetivo." />;
  return <section className="vault-grid">{data.vaults.map((vault) => {
    const progress = Math.min(100, Math.round((vault.savedCents / Math.max(1, vault.targetCents)) * 100));
    const Icon = vault.icon === "TRAVEL" ? AirplaneTilt : vault.icon === "HOME" ? HouseLine : ShieldCheck;
    return <article className="vault-card" key={vault.id}><div className="vault-top"><span className="feature-icon"><Icon size={25} /></span><span className="progress-number">{progress}%</span></div><div><h3>{vault.name}</h3><strong>{money(vault.savedCents, vault.currency)}</strong><p>Meta de {money(vault.targetCents, vault.currency)}</p></div><div className="progress-line" aria-label={`${progress}% concluído`}><span style={{ width: `${progress}%` }} /></div><button className="button ghost" type="button" onClick={() => onContribution(vault)}><Plus size={17} /> Adicionar valor</button></article>;
  })}</section>;
}

function Goals({ goals }: { goals: PurchaseGoal[] }) {
  if (!goals.length) return <Empty icon={Target} title="Planeje uma compra" text="Diga o preço e quanto consegue guardar. O prazo aparece na hora." />;
  return <section className="goal-list">{goals.map((goal) => {
    const calculation = calculateGoal(goal.priceCents, goal.savedCents, goal.contributionCents, goal.frequency);
    const progress = Math.min(100, Math.round((goal.savedCents / Math.max(1, goal.priceCents)) * 100));
    return <article className="goal-row" key={goal.id}><div className="goal-visual"><Target size={25} /><span>{progress}%</span></div><div className="goal-copy"><span className="status-label">{goal.status === "COMPLETED" ? "Concluída" : "Em andamento"}</span><h3>{goal.name}</h3><p>Guardando <strong>{money(goal.contributionCents, goal.currency)} {frequencyLabel[goal.frequency]}</strong>, faltam cerca de <strong>{calculation.months} meses</strong>.</p></div><div className="goal-meta"><strong>{money(goal.savedCents, goal.currency)}</strong><small>de {money(goal.priceCents, goal.currency)}</small>{goal.estimatedDate && <span><CalendarBlank size={16} /> {fullDate(calculation.estimatedDate)}</span>}</div></article>;
  })}</section>;
}

function Wishlist({ items, onCreateGoal }: { items: WishlistItem[]; onCreateGoal: (item: WishlistItem) => void }) {
  if (!items.length) return <Empty icon={Heart} title="Guarde um desejo" text="Cole um link de produto e transforme vontade em um plano real." />;
  return <section className="wishlist-grid">{items.map((item) => {
    const result = calculateGoal(item.priceCents, 0, item.contributionCents, item.frequency);
    return <article className="wish-card" key={item.id}>{item.image ? <Image src={item.image} alt="" width={140} height={210} unoptimized /> : <div className="wish-placeholder"><Heart size={32} /></div>}<div><h3>{item.title}</h3><strong>{money(item.priceCents, item.currency)}</strong><p>{money(item.contributionCents, item.currency)} {frequencyLabel[item.frequency]}: cerca de {result.months} meses.</p><div className="wish-actions"><a href={item.url} target="_blank" rel="noreferrer"><LinkSimple size={17} /> Ver produto</a><button type="button" onClick={() => onCreateGoal(item)}>Criar meta <ArrowRight size={16} /></button></div></div></article>;
  })}</section>;
}

function FinancialAssistant({ data, accessToken }: { data: FinanceData; accessToken?: string }) {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [busy, setBusy] = useState(false);
  const totals = totalsByCurrency(data.transactions).find((item) => item.currency === "BRL")!;
  const monthlyMargin = Math.max(0, Math.round((totals.incomeCents - totals.expenseCents) / 6));

  async function ask(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    if (accessToken) {
      try {
        const response = await fetch("/api/assistant", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` }, body: JSON.stringify({ question, summary: { incomeCents: totals.incomeCents, expenseCents: totals.expenseCents, monthlyMarginCents: monthlyMargin, goals: data.goals.map((item) => ({ name: item.name, priceCents: item.priceCents, contributionCents: item.contributionCents })) } }) });
        const result = await response.json() as { error?: string; answer?: string };
        if (!response.ok) throw new Error(result.error);
        if (!result.answer) throw new Error("Resposta vazia.");
        setAnswer(result.answer);
        setBusy(false);
        return;
      } catch { /* Fallback matemático abaixo. */ }
    }
    const reserve = Math.round(monthlyMargin * .3);
    setAnswer(monthlyMargin > 0 ? `Pelos dados disponíveis, sua margem mensal estimada é ${money(monthlyMargin)}. Uma opção conservadora é direcionar ${money(reserve)} para uma meta e manter o restante como folga. Ajuste esse valor se houver despesas futuras ainda não registradas.` : "As despesas registradas consomem toda a receita do período. Antes de criar um novo aporte, revise as maiores categorias e escolha um valor que não comprometa contas essenciais.");
    setBusy(false);
  }

  return <section className="assistant-layout"><article className="assistant-intro"><span className="assistant-symbol"><Sparkle size={27} weight="fill" /></span><h3>Uma resposta baseada no seu cenário</h3><p>O modo matemático funciona no aparelho. Quando a IA estiver configurada, somente valores agregados e sua pergunta serão enviados.</p><ul><li><Check size={17} /> Sem CPF ou linha digitável</li><li><Check size={17} /> Sem credenciais bancárias</li><li><Check size={17} /> Sem recomendação de investimento</li></ul></article><article className="assistant-chat"><div className="assistant-example"><Robot size={22} /><p>Experimente perguntar: “Quanto posso guardar por mês sem apertar meu orçamento?”</p></div>{answer && <div className="assistant-answer" role="status"><Sparkle size={19} /><p>{answer}</p></div>}<form onSubmit={ask}><label className="sr-only" htmlFor="assistant-question">Pergunta financeira</label><textarea id="assistant-question" className="textarea" placeholder="Escreva sua pergunta" value={question} onChange={(event) => setQuestion(event.target.value)} required /><button className="button primary" type="submit" disabled={busy}>{busy ? "Analisando" : "Perguntar"}<PaperPlaneTilt size={18} /></button></form></article></section>;
}

function VaultForm({ open, onClose, onSubmit }: { open: boolean; onClose: () => void; onSubmit: (vault: Vault) => void }) {
  const [name, setName] = useState(""); const [target, setTarget] = useState(""); const [currency, setCurrency] = useState<Currency>("BRL");
  return <Modal open={open} title="Novo cofrinho" description="Uma divisão virtual para organizar seu saldo." onClose={onClose}><form className="form-grid" onSubmit={(event) => { event.preventDefault(); onSubmit({ id: crypto.randomUUID(), name, icon: "OTHER", targetCents: parseMoney(target), savedCents: 0, currency, contributions: [] }); setName(""); setTarget(""); }}><div className="field"><label htmlFor="vault-name">Nome</label><input className="input" id="vault-name" placeholder="Ex.: Reserva de emergência" value={name} onChange={(event) => setName(event.target.value)} required /></div><div className="form-row"><div className="field"><label htmlFor="vault-target">Valor da meta</label><input className="input" id="vault-target" inputMode="decimal" placeholder="10.000,00" value={target} onChange={(event) => setTarget(event.target.value)} required /></div><CurrencyField id="vault-currency" value={currency} onChange={setCurrency} /></div><Actions onClose={onClose} /></form></Modal>;
}

function GoalForm({ open, onClose, onSubmit }: { open: boolean; onClose: () => void; onSubmit: (goal: PurchaseGoal) => void }) {
  const [name, setName] = useState(""); const [price, setPrice] = useState(""); const [saved, setSaved] = useState("0"); const [contribution, setContribution] = useState(""); const [currency, setCurrency] = useState<Currency>("BRL"); const [frequency, setFrequency] = useState<Frequency>("MONTHLY");
  const preview = useMemo(() => calculateGoal(parseMoney(price), parseMoney(saved), parseMoney(contribution), frequency), [price, saved, contribution, frequency]);
  return <Modal open={open} title="Planejar uma compra" description="Informe o que cabe no seu orçamento." onClose={onClose}><form className="form-grid" onSubmit={(event) => { event.preventDefault(); onSubmit(refreshGoal({ id: crypto.randomUUID(), name, priceCents: parseMoney(price), savedCents: parseMoney(saved), contributionCents: parseMoney(contribution), currency, frequency })); }}><div className="field"><label htmlFor="goal-name">O que você quer comprar?</label><input className="input" id="goal-name" placeholder="Ex.: Novo celular" value={name} onChange={(event) => setName(event.target.value)} required /></div><div className="form-row"><div className="field"><label htmlFor="goal-price">Preço</label><input className="input" id="goal-price" inputMode="decimal" value={price} onChange={(event) => setPrice(event.target.value)} required /></div><CurrencyField id="goal-currency" value={currency} onChange={setCurrency} /></div><div className="form-row"><div className="field"><label htmlFor="goal-saved">Já guardado</label><input className="input" id="goal-saved" inputMode="decimal" value={saved} onChange={(event) => setSaved(event.target.value)} /></div><div className="field"><label htmlFor="goal-contribution">Quanto pode guardar</label><input className="input" id="goal-contribution" inputMode="decimal" value={contribution} onChange={(event) => setContribution(event.target.value)} required /></div></div><FrequencyField value={frequency} onChange={setFrequency} />{Number.isFinite(preview.months) && parseMoney(contribution) > 0 && <div className="calculation-preview"><CalendarBlank size={22} /><p><strong>Cerca de {preview.months} meses</strong><span>Previsão para {fullDate(preview.estimatedDate)}</span></p></div>}<Actions onClose={onClose} /></form></Modal>;
}

function WishForm({ open, accessToken, onClose, onSubmit }: { open: boolean; accessToken?: string; onClose: () => void; onSubmit: (item: WishlistItem) => void }) {
  const [url, setUrl] = useState(""); const [title, setTitle] = useState(""); const [price, setPrice] = useState(""); const [image, setImage] = useState(""); const [contribution, setContribution] = useState(""); const [currency, setCurrency] = useState<Currency>("BRL"); const [frequency, setFrequency] = useState<Frequency>("MONTHLY"); const [loading, setLoading] = useState(false); const [message, setMessage] = useState("");
  async function inspect() { setLoading(true); setMessage(""); try { const response = await fetch("/api/metadata", { method: "POST", headers: { "Content-Type": "application/json", ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}) }, body: JSON.stringify({ url }) }); const data = await response.json() as { error?: string; title?: string; image?: string; price?: number; currency?: string }; if (!response.ok) throw new Error(data.error); setTitle(data.title || title); setImage(data.image || ""); if (data.price) setPrice(String(data.price).replace(".", ",")); setCurrency(data.currency === "USD" ? "USD" : "BRL"); setMessage("Informações encontradas. Revise antes de salvar."); } catch (error) { setMessage(error instanceof Error ? error.message : "Preencha as informações manualmente."); } finally { setLoading(false); } }
  return <Modal open={open} title="Adicionar desejo" description="Cole um link e revise as informações encontradas." onClose={onClose}><form className="form-grid" onSubmit={(event) => { event.preventDefault(); onSubmit({ id: crypto.randomUUID(), url, title, image: image || undefined, priceCents: parseMoney(price), currency, contributionCents: parseMoney(contribution), frequency, createdAt: new Date().toISOString().slice(0, 10) }); }}><div className="field"><label htmlFor="wish-url">Link do produto</label><div className="inline-field"><input className="input" id="wish-url" type="url" placeholder="https://loja.com/produto" value={url} onChange={(event) => setUrl(event.target.value)} required /><button className="button small" type="button" onClick={inspect} disabled={loading || !url}>{loading ? "Buscando" : "Buscar"}</button></div>{message && <small>{message}</small>}</div><div className="field"><label htmlFor="wish-title">Nome do produto</label><input className="input" id="wish-title" value={title} onChange={(event) => setTitle(event.target.value)} required /></div><div className="form-row"><div className="field"><label htmlFor="wish-price">Preço</label><input className="input" id="wish-price" inputMode="decimal" value={price} onChange={(event) => setPrice(event.target.value)} required /></div><CurrencyField id="wish-currency" value={currency} onChange={setCurrency} /></div><div className="field"><label htmlFor="wish-contribution">Quanto quer guardar</label><input className="input" id="wish-contribution" inputMode="decimal" value={contribution} onChange={(event) => setContribution(event.target.value)} required /></div><FrequencyField value={frequency} onChange={setFrequency} /><Actions onClose={onClose} /></form></Modal>;
}

function ContributionForm({ vault, open, onClose, onSubmit }: { vault: Vault | null; open: boolean; onClose: () => void; onSubmit: (cents: number) => void }) { const [value, setValue] = useState(""); return <Modal open={open} title={`Adicionar em ${vault?.name ?? "cofrinho"}`} onClose={onClose}><form className="form-grid" onSubmit={(event) => { event.preventDefault(); onSubmit(parseMoney(value)); setValue(""); }}><div className="field"><label htmlFor="contribution-value">Valor</label><input className="input" id="contribution-value" inputMode="decimal" autoFocus value={value} onChange={(event) => setValue(event.target.value)} required /></div><Actions onClose={onClose} /></form></Modal>; }
function CurrencyField({ id, value, onChange }: { id: string; value: Currency; onChange: (value: Currency) => void }) { return <div className="field"><label htmlFor={id}>Moeda</label><select className="select" id={id} value={value} onChange={(event) => onChange(event.target.value as Currency)}><option value="BRL">Real (BRL)</option><option value="USD">Dólar (USD)</option></select></div>; }
function FrequencyField({ value, onChange }: { value: Frequency; onChange: (value: Frequency) => void }) { return <div className="field"><label htmlFor="frequency">Frequência</label><select className="select" id="frequency" value={value} onChange={(event) => onChange(event.target.value as Frequency)}><option value="DAILY">Por dia</option><option value="WEEKLY">Por semana</option><option value="MONTHLY">Por mês</option></select></div>; }
function Actions({ onClose }: { onClose: () => void }) { return <div className="form-actions"><button className="button ghost" type="button" onClick={onClose}>Cancelar</button><button className="button primary" type="submit">Salvar</button></div>; }
function Empty({ icon: Icon, title, text }: { icon: typeof PiggyBank; title: string; text: string }) { return <section className="panel empty-state"><div><span className="feature-icon"><Icon size={28} /></span><h3>{title}</h3><p>{text}</p></div></section>; }
