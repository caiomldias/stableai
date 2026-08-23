"use client";

import { FormEvent, useState } from "react";
import Image from "next/image";
import { PaperPlaneTilt, Sparkle } from "@phosphor-icons/react";
import { useLocale } from "@/components/locale-provider";
import { Modal } from "@/components/ui/modal";
import { money, totalsByCurrency } from "@/lib/finance";
import type { FinanceData } from "@/lib/types";

export function AssistantFab({ data, accessToken }: { data: FinanceData; accessToken?: string }) {
  const { currency, t } = useLocale();
  const [open, setOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [busy, setBusy] = useState(false);

  async function ask(event: FormEvent) {
    event.preventDefault();
    if (!question.trim() || busy) return;
    setBusy(true);
    setAnswer("");
    const selected = totalsByCurrency(data.transactions).find((item) => item.currency === currency)!;
    const monthlyMargin = Math.max(0, Math.round((selected.incomeCents - selected.expenseCents) / 6));

    if (accessToken) {
      try {
        const response = await fetch("/api/assistant", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
          body: JSON.stringify({
            question: question.trim(),
            summary: {
              incomeCents: selected.incomeCents,
              expenseCents: selected.expenseCents,
              monthlyMarginCents: monthlyMargin,
              goals: data.goals.map((item) => ({ name: item.name, priceCents: item.priceCents, contributionCents: item.contributionCents })),
            },
          }),
        });
        const result = await response.json() as { error?: string; answer?: string };
        if (!response.ok || !result.answer) throw new Error(result.error || "Resposta vazia.");
        setAnswer(result.answer);
        setBusy(false);
        return;
      } catch {
        // Fallback local abaixo mantém o botão útil quando a IA estiver indisponível.
      }
    }

    const reserve = Math.round(monthlyMargin * .3);
    setAnswer(monthlyMargin > 0
      ? t("assistant.fallbackPositive").replace("{margin}", money(monthlyMargin, currency)).replace("{reserve}", money(reserve, currency))
      : t("assistant.fallbackEmpty"));
    setBusy(false);
  }

  return <>
    <button className="assistant-fab" type="button" onClick={() => setOpen(true)} aria-label={t("assistant.open")} title={t("assistant.open")}>
      <Image src="/stableai-genie.png" alt="" width={70} height={70} unoptimized />
      <span className="assistant-fab-badge"><Sparkle size={13} weight="fill" /></span>
    </button>
    <Modal open={open} title={t("assistant.title")} description={t("assistant.description")} onClose={() => setOpen(false)}>
      <div className="assistant-fab-dialog">
        <div className="assistant-fab-example"><Sparkle size={20} /><span>{t("assistant.example")}</span></div>
        {answer && <div className="assistant-fab-answer" role="status" aria-live="polite"><Sparkle size={19} /><p>{answer}</p></div>}
        <form onSubmit={ask}>
          <label className="sr-only" htmlFor="floating-assistant-question">{t("assistant.placeholder")}</label>
          <textarea id="floating-assistant-question" className="textarea" placeholder={t("assistant.placeholder")} value={question} onChange={(event) => setQuestion(event.target.value)} required />
          <button className="button primary" type="submit" disabled={busy}>{busy ? t("assistant.busy") : t("assistant.send")}<PaperPlaneTilt size={18} /></button>
        </form>
      </div>
    </Modal>
  </>;
}
