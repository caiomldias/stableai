import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/supabase-server";
import { getServerEnv } from "@/lib/server-env";
import { isRateLimited } from "@/lib/rate-limit";

const bodySchema = z.object({
  question: z.string().trim().min(3).max(600),
  summary: z.object({
    incomeCents: z.number().int().nonnegative(),
    expenseCents: z.number().int().nonnegative(),
    monthlyMarginCents: z.number().int().nonnegative(),
    goals: z.array(z.object({ name: z.string().max(100), priceCents: z.number().int().nonnegative(), contributionCents: z.number().int().nonnegative() })).max(20),
  }),
});

type ResponseOutput = { type?: string; content?: { type?: string; text?: string }[] };

export async function POST(request: NextRequest) {
  const { user, error } = await requireUser(request);
  if (!user) return NextResponse.json({ error }, { status: 401 });
  if (isRateLimited(`assistant:${user.id}`, 10)) return NextResponse.json({ error: "Muitas requisições, tente em instantes." }, { status: 429 });
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Pergunta ou resumo inválido." }, { status: 400 });
  const apiKey = getServerEnv("OPENAI_API_KEY");
  if (!apiKey) return NextResponse.json({ error: "Modo IA ainda não configurado." }, { status: 503 });

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: getServerEnv("OPENAI_MODEL") || "gpt-5.6-luna",
      store: false,
      max_output_tokens: 350,
      reasoning: { effort: "low" },
      instructions: "Você é um organizador financeiro educacional brasileiro. Responda em português claro, usando somente os valores agregados enviados. Não recomende compra ou venda de investimentos, não invente dados e não trate a resposta como aconselhamento profissional. Seja objetivo e termine com uma ação prática e segura.",
      input: JSON.stringify(parsed.data),
    }),
    cache: "no-store",
  });
  const result = await response.json() as { output?: ResponseOutput[]; error?: { message?: string } };
  if (!response.ok) return NextResponse.json({ error: result.error?.message || "A IA não respondeu." }, { status: 502 });
  const answer = result.output?.flatMap((item) => item.content ?? []).find((item) => item.type === "output_text")?.text;
  if (!answer) return NextResponse.json({ error: "Resposta vazia da IA." }, { status: 502 });
  return NextResponse.json({ answer });
}
