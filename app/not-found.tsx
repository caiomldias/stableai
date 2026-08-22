import Link from "next/link";
import { Compass } from "@phosphor-icons/react/dist/ssr";

export default function NotFoundPage() {
  return <main className="center-page"><section className="offline-card"><span className="feature-icon"><Compass size={30} /></span><h1>Página não encontrada</h1><p>Este endereço não faz parte do StableAI.</p><Link className="button primary" href="/">Voltar ao início</Link></section></main>;
}
