import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { syncPluggyItem } from "@/lib/pluggy";
import { requireUser } from "@/lib/supabase-server";

const bodySchema = z.object({ itemId: z.string().uuid() });

export async function POST(request: NextRequest) {
  const { admin, user, error } = await requireUser(request);
  if (!admin || !user) return NextResponse.json({ error }, { status: 401 });
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Identificador de conexão inválido." }, { status: 400 });
  try {
    return NextResponse.json(await syncPluggyItem(admin, user.id, parsed.data.itemId));
  } catch (cause) {
    return NextResponse.json({ error: cause instanceof Error ? cause.message : "Falha na sincronização." }, { status: 502 });
  }
}
