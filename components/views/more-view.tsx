"use client";

import { FormEvent, useEffect, useState } from "react";
import {
  Bank,
  Barcode,
  Bell,
  Check,
  ClockCounterClockwise,
  CloudArrowDown,
  CreditCard,
  DownloadSimple,
  Info,
  LockKey,
  SignOut,
  Trash,
  UserCircle,
  UserPlus,
  Warning,
} from "@phosphor-icons/react";
import { PluggyConnectButton } from "@/components/pluggy-connect-button";
import {
  currentPushSubscription,
  subscribeToPush,
  supportsWebPush,
  unsubscribeFromPush,
} from "@/components/service-worker-registration";
import { Modal } from "@/components/ui/modal";
import { useLocale } from "@/components/locale-provider";
import { getStoredCurrency } from "@/lib/locale";
import { fullDate, money, parseMoney, shortDate } from "@/lib/finance";
import type { Boleto, Connection, Currency, FinanceData, NoticeTone } from "@/lib/types";

type Tab = "bills" | "recurring" | "charges" | "connections" | "settings";

const tabs = [
  { id: "bills" as const, label: "Boletos", icon: Barcode },
  { id: "recurring" as const, label: "Recorrentes", icon: ClockCounterClockwise },
  { id: "charges" as const, label: "Cobranças", icon: UserPlus },
  { id: "connections" as const, label: "Conexões", icon: Bank },
  { id: "settings" as const, label: "Ajustes", icon: UserCircle },
];

export function MoreView({ data, updateData, accessToken, demo, onSignOut, onAccountDeleted, onNotice }: { data: FinanceData; updateData: (updater: (current: FinanceData) => FinanceData) => void; accessToken?: string; demo: boolean; onSignOut: () => void; onAccountDeleted: () => void; onNotice: (message: string, tone?: NoticeTone) => void }) {
  const { t } = useLocale();
  const [tab, setTab] = useState<Tab>("bills");
  const [billOpen, setBillOpen] = useState(false);
  const [disconnect, setDisconnect] = useState<Connection | null>(null);

  async function disconnectInstitution(deleteData: boolean) {
    if (!disconnect) return;
    if (!demo && accessToken && disconnect.itemId) {
      const response = await fetch("/api/pluggy/connection", {
        method: "DELETE",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ itemId: disconnect.itemId, deleteData }),
      });
      const result = await response.json() as { error?: string };
      if (!response.ok) { onNotice(result.error || "Não foi possível desconectar.", "error"); return; }
    }
    const accountIds = data.accounts.filter((item) => item.institution === disconnect.institution).map((item) => item.id);
    updateData((current) => ({
      ...current,
      connections: current.connections.filter((item) => item.id !== disconnect.id),
      accounts: deleteData ? current.accounts.filter((item) => !accountIds.includes(item.id)) : current.accounts,
      transactions: deleteData ? current.transactions.filter((item) => !accountIds.includes(item.accountId)) : current.transactions,
      investments: deleteData ? current.investments.filter((item) => item.institution !== disconnect.institution) : current.investments,
    }));
    setDisconnect(null);
    onNotice(deleteData ? "Instituição e dados importados foram removidos." : "Instituição desconectada. O histórico foi mantido.", "success");
  }

  return <div className="stack">
    <div className="page-heading"><div><h2>{t("more.title")}</h2><p>{t("more.subtitle")}</p></div>{tab === "bills" && <button className="button primary" type="button" aria-label={t("more.newBill")} onClick={() => setBillOpen(true)}><Barcode size={18} /><span>{t("more.newBill")}</span></button>}</div>
    <div className="tab-bar more-tabs" role="tablist" aria-label="Mais recursos">{tabs.map((item) => { const locked = demo && (item.id === "connections" || item.id === "settings"); return <button role="tab" aria-selected={tab === item.id} aria-label={locked ? `${item.label}, disponível após criar uma conta` : item.label} className={tab === item.id ? "active" : ""} key={item.id} type="button" onClick={() => setTab(item.id)}><item.icon size={19} />{item.label}{locked && <LockKey className="tab-lock" size={14} />}</button>; })}</div>

    {tab === "bills" && <Bills data={data} />}
    {tab === "recurring" && <Recurring data={data} updateData={updateData} onNotice={onNotice} />}
    {tab === "charges" && <Charges data={data} updateData={updateData} onNotice={onNotice} />}
    {tab === "connections" && (demo ? <GuestLocked title="Conectar bancos" description="Crie uma conta para conectar Nubank, Itaú e outras instituições com segurança." onSignOut={onSignOut} /> : <Connections data={data} accessToken={accessToken} onStatus={onNotice} onDisconnect={setDisconnect} />)}
    {tab === "settings" && (demo ? <GuestLocked title="Ajustes da conta" description="Personalização, notificações e dados pessoais ficam disponíveis depois do cadastro." onSignOut={onSignOut} /> : <Settings data={data} updateData={updateData} accessToken={accessToken} demo={demo} onSignOut={onSignOut} onAccountDeleted={onAccountDeleted} onNotice={onNotice} />)}

    <BoletoForm open={billOpen} onClose={() => setBillOpen(false)} onSubmit={(item) => { updateData((current) => ({ ...current, boletos: [...current.boletos, item] })); onNotice("Boleto salvo com sucesso.", "success"); setBillOpen(false); }} />
    <DisconnectModal connection={disconnect} onClose={() => setDisconnect(null)} onKeep={() => disconnectInstitution(false)} onDelete={() => disconnectInstitution(true)} />
  </div>;
}

function GuestLocked({ title, description, onSignOut }: { title: string; description: string; onSignOut: () => void }) {
  return <section className="panel guest-locked-panel"><LockKey size={34} /><h3>{title}</h3><p>{description}</p><button className="button primary" type="button" onClick={onSignOut}>Criar conta para liberar</button></section>;
}

function Bills({ data }: { data: FinanceData }) {
  const pending = data.boletos.filter((item) => item.status !== "PAID").reduce((sum, item) => sum + item.amountCents, 0);
  return <section className="stack"><div className="module-summary"><span className="feature-icon"><Barcode size={26} /></span><div><small>Boletos em aberto</small><strong>{money(pending)}</strong><p>{data.boletos.filter((item) => item.status !== "PAID").length} compromissos encontrados</p></div><span className="coverage-note"><Info size={17} /> A cobertura DDA depende do banco conectado.</span></div><div className="panel item-list">{data.boletos.map((item) => <article key={item.id}><span className="row-icon"><Barcode size={21} /></span><div><strong>{item.description}</strong><small>{item.issuer}<span>•</span>Vence {shortDate(item.dueDate)}<span>•</span>{item.source === "PLUGGY" ? "Importado" : "Manual"}</small></div><div className="item-actions"><strong>{money(item.amountCents, item.currency)}</strong><span className={`status ${item.status.toLocaleLowerCase()}`}>{item.status === "PENDING" ? "Pendente" : item.status === "PAID" ? "Pago" : "Vencido"}</span></div></article>)}{!data.boletos.length && <ListEmpty icon={Barcode} text="Nenhum boleto disponível. Você pode adicionar um manualmente." />}</div></section>;
}

function Recurring({ data, updateData, onNotice }: { data: FinanceData; updateData: (updater: (current: FinanceData) => FinanceData) => void; onNotice: (message: string, tone?: NoticeTone) => void }) {
  return <section className="panel item-list">{data.recurring.map((item) => <article key={item.id}><span className="row-icon"><ClockCounterClockwise size={21} /></span><div><strong>{item.description}</strong><small>Próxima cobrança em {fullDate(item.nextDate)}<span>•</span>{Math.round(item.confidence * 100)}% de regularidade</small></div><div className="item-actions"><strong>{money(item.averageAmountCents, item.currency)}</strong><button className={item.confirmed ? "confirmed" : "confirm"} type="button" onClick={() => { const next = !item.confirmed; updateData((current) => ({ ...current, recurring: current.recurring.map((entry) => entry.id === item.id ? { ...entry, confirmed: next } : entry) })); onNotice(next ? "Conta recorrente confirmada." : "Conta recorrente desmarcada.", "success"); }}>{item.confirmed ? <><Check size={15} /> Confirmada</> : "Confirmar"}</button></div></article>)}{!data.recurring.length && <ListEmpty icon={ClockCounterClockwise} text="Recorrências aparecem depois de pelo menos três cobranças semelhantes." />}</section>;
}

function Charges({ data, updateData, onNotice }: { data: FinanceData; updateData: (updater: (current: FinanceData) => FinanceData) => void; onNotice: (message: string, tone?: NoticeTone) => void }) {
  const pending = data.sharedExpenses.filter((item) => item.status !== "PAID");
  return <section className="stack"><div className="module-summary charge-summary"><span className="feature-icon"><UserPlus size={26} /></span><div><small>Total para receber</small><strong>{money(pending.reduce((sum, item) => sum + item.amountCents, 0))}</strong><p>Você marca o pagamento manualmente.</p></div></div><div className="panel item-list">{data.sharedExpenses.map((item) => { const transaction = data.transactions.find((entry) => entry.id === item.transactionId); return <article key={item.id}><span className="row-icon"><CreditCard size={21} /></span><div><strong>{item.person}</strong><small>{transaction?.description || "Compra no cartão"}<span>•</span>Lembrar {shortDate(item.dueDate)}</small></div><div className="item-actions"><strong>{money(item.amountCents, item.currency)}</strong><button className={item.status === "PAID" ? "confirmed" : "confirm"} type="button" onClick={() => { const paid = item.status !== "PAID"; updateData((current) => ({ ...current, sharedExpenses: current.sharedExpenses.map((entry) => entry.id === item.id ? { ...entry, status: paid ? "PAID" : "PENDING" } : entry) })); onNotice(paid ? `Cobrança de ${item.person} marcada como paga.` : `Cobrança de ${item.person} reaberta.`, "success"); }}>{item.status === "PAID" ? <><Check size={15} /> Pago</> : "Marcar como pago"}</button></div></article>; })}{!data.sharedExpenses.length && <ListEmpty icon={UserPlus} text="Marque uma compra do cartão como valor a cobrar." />}</div></section>;
}

function Connections({ data, accessToken, onStatus, onDisconnect }: { data: FinanceData; accessToken?: string; onStatus: (message: string) => void; onDisconnect: (item: Connection) => void }) {
  return <section className="stack"><div className="connection-hero"><div><span className="feature-icon"><CloudArrowDown size={27} /></span><h3>Conecte suas instituições com segurança</h3><p>A autenticação acontece dentro do Pluggy Connect. O StableAI recebe somente os dados autorizados.</p></div><PluggyConnectButton accessToken={accessToken} onStatus={onStatus} /></div><div className="panel item-list connection-list">{data.connections.map((item) => <article key={item.id}><span className="row-icon"><Bank size={21} /></span><div><strong>{item.institution}</strong><small>{item.products.join(", ")}<span>•</span>{item.lastSyncAt ? `Sincronizado ${shortDate(item.lastSyncAt)}` : "Aguardando sincronização"}</small></div><div className="item-actions"><span className={`connection-status ${item.status.toLocaleLowerCase()}`}>{item.status === "CONNECTED" ? "Conectado" : item.status === "SYNCING" ? "Sincronizando" : "Atenção"}</span><button className="inline-danger" type="button" onClick={() => onDisconnect(item)}>Desconectar</button></div></article>)}{!data.connections.length && <ListEmpty icon={Bank} text="Nenhuma instituição conectada." />}</div></section>;
}

function Settings({ data, updateData, accessToken, demo, onSignOut, onAccountDeleted, onNotice }: { data: FinanceData; updateData: (updater: (current: FinanceData) => FinanceData) => void; accessToken?: string; demo: boolean; onSignOut: () => void; onAccountDeleted: () => void; onNotice: (message: string, tone?: NoticeTone) => void }) {
  const [installInfo, setInstallInfo] = useState(false);
  const [pushSupported, setPushSupported] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(false);
  const [pushBusy, setPushBusy] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const supported = supportsWebPush() && !demo && Boolean(accessToken);
    Promise.resolve().then(() => setPushSupported(supported));
    if (supported) currentPushSubscription().then((value) => setPushEnabled(Boolean(value))).catch(() => undefined);
  }, [accessToken, demo]);

  function toggle(key: "inApp" | "email", checked: boolean) {
    updateData((current) => ({ ...current, notifications: { ...current.notifications, [key]: checked } }));
    onNotice(`${key === "inApp" ? "Avisos no aplicativo" : "Avisos por e-mail"} ${checked ? "ativados" : "desativados"}.`, "success");
  }

  async function togglePush(checked: boolean) {
    if (!accessToken || pushBusy) return;
    setPushBusy(true);
    try {
      const testSent = checked ? await subscribeToPush(accessToken) : (await unsubscribeFromPush(accessToken), false);
      setPushEnabled(checked);
      updateData((current) => ({ ...current, notifications: { ...current.notifications, push: checked } }));
      onNotice(checked ? (testSent ? "Notificações ativadas. Enviamos um teste." : "Notificações ativadas.") : "Notificações desativadas.", "success");
    } catch (error) {
      onNotice(error instanceof Error ? error.message : "Não foi possível alterar as notificações.", "error");
    } finally {
      setPushBusy(false);
    }
  }

  async function deleteAccount() {
    if (!accessToken || deleteConfirmation !== "EXCLUIR") return;
    setDeleting(true);
    try {
      const response = await fetch("/api/account", {
        method: "DELETE",
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error || "Não foi possível excluir sua conta.");
      await onAccountDeleted();
    } catch (error) {
      onNotice(error instanceof Error ? error.message : "Não foi possível excluir sua conta.", "error");
      setDeleting(false);
    }
  }

  return <><section className="settings-grid"><article className="panel panel-pad"><h3>Notificações</h3><p className="settings-description">Escolha como receber lembretes.</p>{([['inApp', 'Dentro do aplicativo'], ['email', 'E-mail']] as const).map(([key, label]) => <label className="settings-toggle" key={key}><span><Bell size={19} /><strong>{label}</strong></span><input type="checkbox" checked={data.notifications[key]} onChange={(event) => toggle(key, event.target.checked)} /></label>)}{pushSupported && <label className="settings-toggle"><span><Bell size={19} /><strong>Notificação do navegador</strong></span><input type="checkbox" checked={pushEnabled} disabled={pushBusy} onChange={(event) => togglePush(event.target.checked)} /></label>}<div className="field days-field"><label htmlFor="days-before">Avisar com antecedência</label><select className="select" id="days-before" value={data.notifications.daysBefore} onChange={(event) => { const days = Number(event.target.value); updateData((current) => ({ ...current, notifications: { ...current.notifications, daysBefore: days } })); onNotice(`Lembretes configurados para ${days} ${days === 1 ? "dia" : "dias"} de antecedência.`, "success"); }}><option value="1">1 dia</option><option value="3">3 dias</option><option value="7">7 dias</option></select></div></article><article className="panel panel-pad"><h3>Aplicativo e dados</h3><p className="settings-description">Instale no celular ou encerre a sessão.</p><button className="settings-action" type="button" onClick={() => setInstallInfo((value) => !value)}><span><DownloadSimple size={21} /><span><strong>Instalar StableAI</strong><small>Android e iOS</small></span></span></button>{installInfo && <div className="install-guide"><strong>No iPhone</strong><p>Abra no Safari, toque em Compartilhar e escolha “Adicionar à Tela de Início”.</p><strong>No Android</strong><p>Abra no Chrome, toque no menu e escolha “Instalar app”.</p></div>}<button className="settings-action" type="button" onClick={() => { const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }); const url = URL.createObjectURL(blob); const anchor = document.createElement("a"); anchor.href = url; anchor.download = "stable-ia-dados.json"; anchor.click(); URL.revokeObjectURL(url); onNotice("Seus dados foram exportados com sucesso.", "success"); }}><span><CloudArrowDown size={21} /><span><strong>Exportar meus dados</strong><small>Arquivo JSON</small></span></span></button><button className="settings-action danger-action" type="button" onClick={onSignOut}><span><SignOut size={21} /><span><strong>{demo ? "Sair da demonstração" : "Encerrar sessão"}</strong><small>Nenhum dado é apagado</small></span></span></button>{!demo && <button className="settings-action danger-action" type="button" onClick={() => setDeleteOpen(true)}><span><Trash size={21} /><span><strong>Excluir minha conta</strong><small>Remove permanentemente seus dados e conexões</small></span></span></button>}</article></section><Modal open={deleteOpen} title="Excluir minha conta" description="Esta ação é permanente. Exporte seus dados antes se quiser guardar uma cópia." onClose={() => { if (!deleting) { setDeleteOpen(false); setDeleteConfirmation(""); } }}><div className="form-grid"><p>Suas conexões bancárias serão encerradas e seus dados financeiros serão apagados. Digite <strong>EXCLUIR</strong> para confirmar.</p><div className="field"><label htmlFor="delete-account-confirmation">Confirmação</label><input className="input" id="delete-account-confirmation" autoComplete="off" value={deleteConfirmation} onChange={(event) => setDeleteConfirmation(event.target.value)} /></div><div className="form-actions"><button className="button ghost" type="button" disabled={deleting} onClick={() => { setDeleteOpen(false); setDeleteConfirmation(""); }}>Cancelar</button><button className="button danger" type="button" disabled={deleteConfirmation !== "EXCLUIR" || deleting} onClick={deleteAccount}>{deleting ? "Excluindo…" : "Excluir permanentemente"}</button></div></div></Modal></>;
}

function BoletoForm({ open, onClose, onSubmit }: { open: boolean; onClose: () => void; onSubmit: (item: Boleto) => void }) { const [description, setDescription] = useState(""); const [issuer, setIssuer] = useState(""); const [amount, setAmount] = useState(""); const [dueDate, setDueDate] = useState(""); const [currency, setCurrency] = useState<Currency>(getStoredCurrency()); const [line, setLine] = useState(""); return <Modal open={open} title="Adicionar boleto" description="Use quando seu banco não fornecer este dado pelo DDA." onClose={onClose}><form className="form-grid" onSubmit={(event: FormEvent) => { event.preventDefault(); onSubmit({ id: crypto.randomUUID(), description, issuer, amountCents: parseMoney(amount), currency, dueDate, digitableLine: line || undefined, status: "PENDING", source: "MANUAL" }); }}><div className="field"><label htmlFor="bill-description">Descrição</label><input className="input" id="bill-description" value={description} onChange={(event) => setDescription(event.target.value)} required /></div><div className="field"><label htmlFor="bill-issuer">Beneficiário</label><input className="input" id="bill-issuer" value={issuer} onChange={(event) => setIssuer(event.target.value)} required /></div><div className="form-row"><div className="field"><label htmlFor="bill-amount">Valor</label><input className="input" id="bill-amount" inputMode="decimal" value={amount} onChange={(event) => setAmount(event.target.value)} required /></div><div className="field"><label htmlFor="bill-currency">Moeda</label><select className="select" id="bill-currency" value={currency} onChange={(event) => setCurrency(event.target.value as Currency)}><option value="BRL">BRL</option><option value="USD">USD</option></select></div></div><div className="field"><label htmlFor="bill-due">Vencimento</label><input className="input" id="bill-due" type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} required /></div><div className="field"><label htmlFor="bill-line">Linha digitável (opcional)</label><input className="input" id="bill-line" inputMode="numeric" value={line} onChange={(event) => setLine(event.target.value)} /></div><div className="form-actions"><button className="button ghost" type="button" onClick={onClose}>Cancelar</button><button className="button primary" type="submit">Salvar</button></div></form></Modal>; }

function DisconnectModal({ connection, onClose, onKeep, onDelete }: { connection: Connection | null; onClose: () => void; onKeep: () => void; onDelete: () => void }) { return <Modal open={Boolean(connection)} title={`Desconectar ${connection?.institution ?? "instituição"}`} description="Escolha o que deve acontecer com o histórico importado." onClose={onClose}><div className="disconnect-options"><button type="button" onClick={onKeep}><ClockCounterClockwise size={24} /><span><strong>Manter histórico</strong><small>A instituição é removida, mas os lançamentos continuam visíveis.</small></span></button><button type="button" className="delete-option" onClick={onDelete}><Trash size={24} /><span><strong>Apagar dados importados</strong><small>Contas, transações e investimentos desta instituição serão removidos.</small></span></button><p><Warning size={18} /> Anotações que dependem de uma transação apagada também podem perder contexto.</p></div></Modal>; }
function ListEmpty({ icon: Icon, text }: { icon: typeof Barcode; text: string }) { return <div className="list-empty"><Icon size={27} /><span>{text}</span></div>; }
