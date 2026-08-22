"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { Bank, SpinnerGap } from "@phosphor-icons/react";

const PluggyConnect = dynamic(
  () => import("react-pluggy-connect").then((module) => module.PluggyConnect),
  { ssr: false },
);

export function PluggyConnectButton({ accessToken, onStatus }: { accessToken?: string; onStatus: (message: string) => void }) {
  const [connectToken, setConnectToken] = useState("");
  const [loading, setLoading] = useState(false);

  async function prepare() {
    if (!accessToken) return onStatus("Entre em uma conta real para conectar seu banco.");
    setLoading(true);
    try {
      const response = await fetch("/api/pluggy/connect-token", { method: "POST", headers: { Authorization: `Bearer ${accessToken}` } });
      const result = await response.json() as { error?: string; accessToken?: string; connectToken?: string };
      if (!response.ok) throw new Error(result.error);
      const token = result.accessToken || result.connectToken;
      if (!token) throw new Error("A Pluggy não retornou o token de conexão.");
      setConnectToken(token);
    } catch (error) {
      onStatus(error instanceof Error ? error.message : "Não foi possível abrir a conexão.");
    } finally { setLoading(false); }
  }

  if (!connectToken) return <button className="button primary" type="button" onClick={prepare} disabled={loading}>{loading ? <SpinnerGap className="spin" size={19} /> : <Bank size={19} />} {loading ? "Preparando" : "Conectar banco"}</button>;

  return <div className="pluggy-button-wrap"><PluggyConnect
    connectToken={connectToken}
    includeSandbox={process.env.NODE_ENV !== "production"}
    allowFullscreen
    forceOauthInBrowser
    language="pt"
    theme="dark"
    onSuccess={async ({ item }) => {
      onStatus("Conta conectada. Estamos sincronizando os dados.");
      const response = await fetch("/api/pluggy/sync", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` }, body: JSON.stringify({ itemId: item.id }) });
      if (!response.ok) {
        const result = await response.json() as { error?: string };
        onStatus(result.error || "A conexão foi feita, mas a sincronização precisa ser repetida.");
        return;
      }
      onStatus("Sincronização concluída. Atualizando o aplicativo.");
      window.setTimeout(() => window.location.reload(), 900);
    }}
    onError={(error) => onStatus(error.message || "A conexão não foi concluída.")}
    onClose={() => setConnectToken("")}
  /></div>;
}
