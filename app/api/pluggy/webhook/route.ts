import { NextRequest, NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { getSupabaseAdmin } from "@/lib/supabase-server";
import { syncPluggyItem } from "@/lib/pluggy";
import { getServerEnv } from "@/lib/server-env";
import { timingSafeMatch } from "@/lib/timing-safe";

type WebhookBody = { itemId?: string; item?: { id?: string }; event?: string };

export async function POST(request: NextRequest) {
  const expected = getServerEnv("PLUGGY_WEBHOOK_SECRET");
  if (!expected || !timingSafeMatch(request.headers.get("authorization"), `Bearer ${expected}`)) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  const admin = getSupabaseAdmin();
  if (!admin) return NextResponse.json({ error: "Banco não configurado" }, { status: 503 });
  const body = await request.json().catch(() => ({})) as WebhookBody;
  const itemId = body.itemId || body.item?.id;
  if (!itemId) return NextResponse.json({ ok: true });
  const { data: connection } = await admin.from("institution_connections").select("user_id").eq("pluggy_item_id", itemId).maybeSingle();
  if (!connection?.user_id) return NextResponse.json({ ok: true });
  const sync = syncPluggyItem(admin, connection.user_id as string, itemId).catch(() => undefined);
  try { getCloudflareContext().ctx.waitUntil(sync); }
  catch { await sync; }
  return NextResponse.json({ ok: true });
}
