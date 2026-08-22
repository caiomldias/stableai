import { NextRequest, NextResponse } from "next/server";
import { createConnectToken } from "@/lib/pluggy";
import { requireUser } from "@/lib/supabase-server";
import { isRateLimited } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  const { user, error } = await requireUser(request);
  if (!user) return NextResponse.json({ error }, { status: 401 });
  if (isRateLimited(`pluggy-connect:${user.id}`, 10)) return NextResponse.json({ error: "Muitas requisições, tente em instantes." }, { status: 429 });
  try {
    return NextResponse.json(await createConnectToken(user.id));
  } catch (cause) {
    return NextResponse.json({ error: cause instanceof Error ? cause.message : "Falha ao iniciar a conexão." }, { status: 502 });
  }
}
