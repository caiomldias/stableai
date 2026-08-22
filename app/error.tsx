"use client";

import { WarningCircle } from "@phosphor-icons/react";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <main className="center-page"><section className="offline-card"><span className="feature-icon"><WarningCircle size={30} /></span><h1>Algo não carregou</h1><p>Seus dados continuam seguros. Tente abrir esta área novamente.</p><button className="button primary" type="button" onClick={reset}>Tentar novamente</button></section></main>;
}
