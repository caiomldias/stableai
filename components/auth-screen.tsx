"use client";

import { FormEvent, useEffect, useState } from "react";
import {
  DeviceMobile,
  EnvelopeSimple,
  FacebookLogo,
  GoogleLogo,
  LockKey,
  ShieldCheck,
  TrendUp,
} from "@phosphor-icons/react";
import { getSupabaseBrowser, isSupabaseConfigured } from "@/lib/supabase-browser";

type Mode = "email" | "phone";

export function AuthScreen({ onDemo }: { onDemo: () => void }) {
  const [mode, setMode] = useState<Mode>("email");
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [providers, setProviders] = useState({ google: false, facebook: false, phone: false });

  const auth = getSupabaseBrowser();

  useEffect(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) return;
    fetch(`${url}/auth/v1/settings`, { headers: { apikey: key } })
      .then((response) => response.json())
      .then((result: unknown) => {
        const external = (result as { external?: Record<string, boolean> }).external;
        if (external) setProviders({ google: Boolean(external.google), facebook: Boolean(external.facebook), phone: Boolean(external.phone) });
      })
      .catch(() => undefined);
  }, []);

  async function handleEmail(event: FormEvent) {
    event.preventDefault();
    if (!auth) return setMessage("Configure o Supabase para ativar contas reais.");
    setBusy(true);
    setMessage("");
    const result = isSignUp
      ? await auth.auth.signUp({ email, password })
      : await auth.auth.signInWithPassword({ email, password });
    setBusy(false);
    setMessage(result.error?.message ?? (isSignUp ? "Confira seu e-mail para confirmar a conta." : "Login realizado."));
  }

  async function social(provider: "google" | "facebook") {
    if (!auth) return setMessage("Configure o Supabase para ativar contas reais.");
    await auth.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  }

  async function handlePhone(event: FormEvent) {
    event.preventDefault();
    if (!auth) return setMessage("Configure o Supabase para ativar contas reais.");
    setBusy(true);
    setMessage("");
    if (!otpSent) {
      const { error } = await auth.auth.signInWithOtp({ phone });
      setBusy(false);
      if (error) return setMessage(error.message);
      setOtpSent(true);
      return setMessage("Código enviado para seu celular.");
    }
    const { error } = await auth.auth.verifyOtp({ phone, token: otp, type: "sms" });
    setBusy(false);
    setMessage(error?.message ?? "Celular confirmado.");
  }

  return (
    <main className="auth-page">
      <section className="auth-intro" aria-label="Apresentação">
        <div className="brand-lockup">
          <span className="brand-mark"><TrendUp size={27} weight="bold" /></span>
          <strong>StableAI</strong>
        </div>
        <div>
          <h1>Seu dinheiro, mais fácil de entender.</h1>
          <p>Contas, gastos e planos reunidos em um assistente financeiro pessoal.</p>
        </div>
        <div className="trust-note"><ShieldCheck size={22} /> Suas credenciais bancárias nunca passam pelo StableAI.</div>
      </section>

      <section className="auth-panel" aria-label="Acesso">
        <div className="auth-panel-header">
          <span className="eyebrow">Acesse sua conta</span>
          <h2>{isSignUp ? "Crie seu espaço" : "Que bom ter você aqui"}</h2>
          <p>Escolha como prefere entrar.</p>
        </div>

        {(providers.google || providers.facebook) && <>
          <div className="auth-social">
            {providers.google && <button className="button social" type="button" onClick={() => social("google")}><GoogleLogo size={21} /> Google</button>}
            {providers.facebook && <button className="button social" type="button" onClick={() => social("facebook")}><FacebookLogo size={21} /> Facebook</button>}
          </div>
          <div className="auth-divider"><span>ou continue com</span></div>
        </>}
        {providers.phone && <div className="segmented" aria-label="Método de acesso">
          <button className={mode === "email" ? "active" : ""} onClick={() => setMode("email")} type="button"><EnvelopeSimple size={18} /> E-mail</button>
          <button className={mode === "phone" ? "active" : ""} onClick={() => setMode("phone")} type="button"><DeviceMobile size={18} /> Celular</button>
        </div>}

        {mode === "email" ? (
          <form className="auth-form" onSubmit={handleEmail}>
            <div className="field">
              <label htmlFor="email">E-mail</label>
              <div className="input-with-icon"><EnvelopeSimple size={20} /><input className="input" id="email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></div>
            </div>
            <div className="field">
              <label htmlFor="password">Senha</label>
              <div className="input-with-icon"><LockKey size={20} /><input className="input" id="password" type="password" minLength={8} autoComplete={isSignUp ? "new-password" : "current-password"} value={password} onChange={(event) => setPassword(event.target.value)} required /></div>
              <small>Mínimo de 8 caracteres.</small>
            </div>
            <button className="button primary full" disabled={busy} type="submit">{busy ? "Aguarde" : isSignUp ? "Criar conta" : "Entrar"}</button>
          </form>
        ) : (
          <form className="auth-form" onSubmit={handlePhone}>
            <div className="field">
              <label htmlFor="phone">Celular com DDD</label>
              <input className="input" id="phone" type="tel" placeholder="+55 11 99999-9999" autoComplete="tel" value={phone} onChange={(event) => setPhone(event.target.value)} required />
            </div>
            {otpSent && <div className="field"><label htmlFor="otp">Código recebido</label><input className="input code-input" id="otp" inputMode="numeric" maxLength={6} value={otp} onChange={(event) => setOtp(event.target.value)} required /></div>}
            <button className="button primary full" disabled={busy} type="submit">{busy ? "Aguarde" : otpSent ? "Confirmar código" : "Enviar código"}</button>
          </form>
        )}

        {message && <p className="auth-message" role="status">{message}</p>}

        <button className="text-button" type="button" onClick={() => setIsSignUp((value) => !value)}>
          {isSignUp ? "Já tenho uma conta" : "Ainda não tenho conta"}
        </button>

        <div className="demo-access">
          <button className="button ghost full" type="button" onClick={onDemo}>Explorar demonstração</button>
          {!isSupabaseConfigured && <small>Modo de demonstração ativo. Configure o Supabase para usar login real.</small>}
        </div>
      </section>
    </main>
  );
}
