"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import type { Session } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import {
  Bell,
  CalendarBlank,
  ChartLineUp,
  House,
  ListBullets,
  LockKey,
  PiggyBank,
  Receipt,
  SignOut,
} from "@phosphor-icons/react";
import { Modal } from "@/components/ui/modal";
import { ProfileSettings, UserAvatar } from "@/components/profile-settings";
import { DashboardView } from "@/components/views/dashboard-view";
import { ExpensesView } from "@/components/views/expenses-view";
import { InvestmentsView } from "@/components/views/investments-view";
import { MoreView } from "@/components/views/more-view";
import { PlanningView } from "@/components/views/planning-view";
import { demoData } from "@/lib/demo-data";
import { emptyFinanceData } from "@/lib/empty-data";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import { money, shortDate } from "@/lib/finance";
import type { FinanceData } from "@/lib/types";

export type AppView = "home" | "expenses" | "plan" | "investments" | "more";

const navigation = [
  { id: "home" as const, label: "Início", icon: House },
  { id: "expenses" as const, label: "Gastos", icon: Receipt },
  { id: "plan" as const, label: "Planejar", icon: PiggyBank },
  { id: "investments" as const, label: "Investir", icon: ChartLineUp },
  { id: "more" as const, label: "Mais", icon: ListBullets },
];

function getInitialView(): AppView {
  if (typeof window === "undefined") return "home";
  const view = new URLSearchParams(window.location.search).get("view");
  return navigation.some((item) => item.id === view) ? (view as AppView) : "home";
}

export function FinanceApp({
  session,
  demo,
  onExitDemo,
}: {
  session: Session | null;
  demo: boolean;
  onExitDemo: () => void;
}) {
  const router = useRouter();
  const [view, setViewState] = useState<AppView>(getInitialView);
  const [data, setData] = useState<FinanceData>(() => {
    if (!demo || typeof window === "undefined") return demo ? demoData : emptyFinanceData;
    const saved = window.localStorage.getItem("stable-ia-demo");
    if (!saved) return demoData;
    try {
      const parsed = JSON.parse(saved) as Partial<FinanceData>;
      return {
        ...demoData,
        ...parsed,
        budgets: parsed.budgets ?? demoData.budgets,
        transactions: (parsed.transactions ?? demoData.transactions).map((transaction) => ({
          ...transaction,
          source: transaction.source ?? "PLUGGY",
        })),
      };
    }
    catch { window.localStorage.removeItem("stable-ia-demo"); return demoData; }
  });
  const [loading, setLoading] = useState(Boolean(session));
  const [notice, setNotice] = useState("");
  const [alertsOpen, setAlertsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const accessToken = session?.access_token;
  const name = useMemo(() => {
    if (demo) return "Caio";
    return session?.user.user_metadata?.full_name || session?.user.user_metadata?.name || session?.user.email?.split("@")[0] || "Olá";
  }, [demo, session]);
  const avatarUrl = demo ? undefined : (session?.user.user_metadata?.avatar_url || session?.user.user_metadata?.picture) as string | undefined;
  const alerts = useMemo(() => {
    const limit = new Date();
    limit.setHours(23, 59, 59, 999);
    limit.setDate(limit.getDate() + data.notifications.daysBefore);
    const isSoon = (value: string) => {
      const date = new Date(`${value.slice(0, 10)}T12:00:00`);
      return !Number.isNaN(date.getTime()) && date <= limit;
    };
    return [
      ...data.boletos.filter((item) => item.status !== "PAID" && isSoon(item.dueDate)).map((item) => ({ id: `bill-${item.id}`, title: item.description, detail: `Boleto vence ${shortDate(item.dueDate)}`, amount: money(item.amountCents, item.currency) })),
      ...data.recurring.filter((item) => item.confirmed && isSoon(item.nextDate)).map((item) => ({ id: `rec-${item.id}`, title: item.description, detail: `Cobrança prevista ${shortDate(item.nextDate)}`, amount: money(item.averageAmountCents, item.currency) })),
      ...data.sharedExpenses.filter((item) => item.status !== "PAID" && isSoon(item.dueDate)).map((item) => ({ id: `share-${item.id}`, title: `Cobrar ${item.person}`, detail: `Lembrete para ${shortDate(item.dueDate)}`, amount: money(item.amountCents, item.currency) })),
    ];
  }, [data]);

  const setView = useCallback((next: AppView) => {
    setViewState(next);
    const url = new URL(window.location.href);
    if (next === "home") url.searchParams.delete("view");
    else url.searchParams.set("view", next);
    window.history.replaceState({}, "", url);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  useEffect(() => {
    if (!session || !accessToken) return;
    fetch("/api/finance", { headers: { Authorization: `Bearer ${accessToken}` } })
      .then(async (response) => {
        if (!response.ok) throw new Error(((await response.json()) as { error?: string }).error || "Não foi possível carregar os dados.");
        return response.json() as Promise<FinanceData>;
      })
      .then(setData)
      .catch((error: Error) => setNotice(error.message))
      .finally(() => setLoading(false));
  }, [session, accessToken]);

  const updateData = useCallback((updater: (current: FinanceData) => FinanceData) => {
    setData((current) => {
      const next = updater(current);
      if (demo) window.localStorage.setItem("stable-ia-demo", JSON.stringify(next));
      if (!demo && accessToken) {
        fetch("/api/finance", {
          method: "PUT",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
          body: JSON.stringify(next),
        }).catch(() => setNotice("A alteração ficou no aparelho e será reenviada quando houver conexão."));
      }
      return next;
    });
  }, [accessToken, demo]);

  async function signOut() {
    const confirmed = window.confirm(demo ? "Sair da demonstração?" : "Sair desta conta? Você poderá entrar com outra conta em seguida.");
    if (!confirmed) return;
    if (demo) return onExitDemo();
    const { error } = await getSupabaseBrowser()?.auth.signOut() ?? {};
    if (error) setNotice("Não foi possível sair agora. Tente novamente.");
  }

  function openProfile() {
    if (demo) return setNotice("Entre em uma conta para editar nome, foto e senha.");
    setProfileOpen(true);
  }

  async function finishAccountDeletion() {
    await getSupabaseBrowser()?.auth.signOut();
    router.replace("/");
    router.refresh();
  }

  const activeLabel = navigation.find((item) => item.id === view)?.label ?? "Início";

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand-lockup"><span className="brand-mark"><Image src="/stableai-genie.png" alt="" width={46} height={46} priority unoptimized /></span><strong>StableAI</strong></div>
        <nav aria-label="Principal">
          {navigation.map((item) => <button key={item.id} type="button" className={view === item.id ? "active" : ""} onClick={() => setView(item.id)}><item.icon size={22} weight={view === item.id ? "fill" : "regular"} /><span>{item.label}</span></button>)}
        </nav>
        <button className="sidebar-foot" type="button" onClick={openProfile} aria-label="Abrir configurações do perfil">
          <UserAvatar name={name} url={avatarUrl} />
          <div><strong>{name}</strong><small>{demo ? "Demonstração" : "Conta pessoal"}</small></div>
          {demo && <LockKey className="sidebar-lock" size={16} aria-label="Disponível apenas para contas" />}
        </button>
      </aside>

      <main className="app-main">
        <header className="topbar">
          <div className="topbar-title"><span className="mobile-brand">StableAI</span><h1>{activeLabel}</h1>{demo && <span className="guest-badge"><LockKey size={14} /> Convidado</span>}</div>
          <div className="topbar-actions">
            <button className={`profile-shortcut${demo ? " guest-locked" : ""}`} type="button" onClick={openProfile} aria-label="Abrir configurações do perfil"><UserAvatar name={name} url={avatarUrl} />{demo && <LockKey className="profile-lock" size={14} />}</button>
            <button className="button icon-only ghost notification-button" type="button" onClick={() => setAlertsOpen(true)} aria-label={`Notificações${alerts.length ? `, ${alerts.length} pendentes` : ""}`}><Bell size={21} />{alerts.length > 0 && <span>{alerts.length}</span>}</button>
            <button className="button small ghost account-action" type="button" onClick={signOut} title="Encerra a sessão atual e volta para a tela de login"><SignOut size={19} /><span>{demo ? "Sair" : "Sair / trocar conta"}</span></button>
          </div>
        </header>

        {notice && <div className="notice" role="status"><span>{notice}</span><button onClick={() => setNotice("")} type="button">Fechar</button></div>}

        {loading ? <LoadingSkeleton /> : (
          <div className="view-content">
            {view === "home" && <DashboardView data={data} setView={setView} demo={demo} onNotice={setNotice} />}
            {view === "expenses" && <ExpensesView data={data} updateData={updateData} />}
            {view === "plan" && <PlanningView data={data} updateData={updateData} accessToken={accessToken} />}
            {view === "investments" && <InvestmentsView data={data} />}
            {view === "more" && <MoreView data={data} updateData={updateData} accessToken={accessToken} demo={demo} onSignOut={signOut} onAccountDeleted={finishAccountDeletion} onNotice={setNotice} />}
          </div>
        )}
      </main>

      <nav className="bottom-nav" aria-label="Principal">
        {navigation.map((item) => <button key={item.id} type="button" className={view === item.id ? "active" : ""} onClick={() => setView(item.id)}><item.icon size={23} weight={view === item.id ? "fill" : "regular"} /><span>{item.label}</span></button>)}
      </nav>
      <Modal open={alertsOpen} title="Seus lembretes" description={`Avisos para os próximos ${data.notifications.daysBefore} dias.`} onClose={() => setAlertsOpen(false)}>
        <div className="alert-list">
          {alerts.map((item) => <article key={item.id}><span className="row-icon"><CalendarBlank size={20} /></span><p><strong>{item.title}</strong><small>{item.detail}</small></p><b>{item.amount}</b></article>)}
          {!alerts.length && <div className="list-empty"><Bell size={28} /><span>Nenhum compromisso próximo.</span></div>}
        </div>
      </Modal>
      {session && <ProfileSettings session={session} open={profileOpen} onClose={() => setProfileOpen(false)} onNotice={setNotice} />}
    </div>
  );
}

function LoadingSkeleton() {
  return <div className="view-content skeleton-page" aria-label="Carregando dados"><div className="skeleton h-hero" /><div className="skeleton-grid"><div className="skeleton h-card" /><div className="skeleton h-card" /></div><div className="skeleton h-list" /></div>;
}
