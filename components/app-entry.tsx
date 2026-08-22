"use client";

import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { AuthScreen } from "@/components/auth-screen";
import { FinanceApp } from "@/components/finance-app";
import { getSupabaseBrowser, isSupabaseConfigured } from "@/lib/supabase-browser";

export function AppEntry() {
  const [ready, setReady] = useState(!isSupabaseConfigured);
  const [demo, setDemo] = useState(false);
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    const client = getSupabaseBrowser();
    if (!client) return;
    client.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setReady(true);
    });
    const { data } = client.auth.onAuthStateChange((_event, nextSession) => setSession(nextSession));
    return () => data.subscription.unsubscribe();
  }, []);

  if (!ready) return <main className="app-loading"><span className="loading-mark" aria-label="Carregando" /></main>;
  if (!session && !demo) return <AuthScreen onDemo={() => { window.scrollTo(0, 0); setDemo(true); }} />;
  return <FinanceApp session={session} demo={demo} onExitDemo={() => setDemo(false)} />;
}
