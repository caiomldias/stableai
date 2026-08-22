import Link from "next/link";
import { WifiSlash } from "@phosphor-icons/react/dist/ssr";

export default function OfflinePage() {
  return (
    <main className="center-page">
      <section className="offline-card">
        <span className="feature-icon"><WifiSlash size={30} /></span>
        <h1>Você está sem conexão</h1>
        <p>Os dados já abertos continuam disponíveis. Conecte-se para sincronizar seus bancos.</p>
        <Link className="button primary" href="/">Tentar novamente</Link>
      </section>
    </main>
  );
}
