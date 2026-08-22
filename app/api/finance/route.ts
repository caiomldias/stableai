import { NextRequest, NextResponse } from "next/server";
import { isFinanceData, loadFinanceState, saveFinanceState } from "@/lib/server-finance";
import { requireUser } from "@/lib/supabase-server";
import { isRateLimited } from "@/lib/rate-limit";

export async function GET(request: NextRequest) {
  const { admin, user, error } = await requireUser(request);
  if (!admin || !user) return NextResponse.json({ error }, { status: 401 });
  if (isRateLimited(`finance-put:${user.id}`, 60)) return NextResponse.json({ error: "Muitas requisições, tente em instantes." }, { status: 429 });
  try {
    return NextResponse.json(await loadFinanceState(admin, user.id));
  } catch {
    return NextResponse.json({ error: "Não foi possível carregar seus dados." }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const { admin, user, error } = await requireUser(request);
  if (!admin || !user) return NextResponse.json({ error }, { status: 401 });
  const contentLength = Number(request.headers.get("content-length") || 0);
  if (contentLength > 2_000_000) return NextResponse.json({ error: "Dados acima do limite permitido." }, { status: 413 });
  try {
    const body: unknown = await request.json();
    if (!isFinanceData(body)) return NextResponse.json({ error: "Formato de dados inválido." }, { status: 400 });
    await saveFinanceState(admin, user.id, body);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Não foi possível salvar a alteração." }, { status: 500 });
  }
}
