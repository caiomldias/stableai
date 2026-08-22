import { NextRequest, NextResponse } from "next/server";
import { syncPluggyItem } from "@/lib/pluggy";
import { getSupabaseAdmin } from "@/lib/supabase-server";
import { loadFinanceState } from "@/lib/server-finance";
import { sendReminderEmail } from "@/lib/reminders";
import { getServerEnv } from "@/lib/server-env";
import { timingSafeMatch } from "@/lib/timing-safe";

export const maxDuration = 300;

export async function GET(request: NextRequest) {
  const secret = getServerEnv("CRON_SECRET");
  if (!secret || !timingSafeMatch(request.headers.get("authorization"), `Bearer ${secret}`)) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  const admin = getSupabaseAdmin();
  if (!admin) return NextResponse.json({ error: "Banco não configurado" }, { status: 503 });
  const { data: connections, error } = await admin.from("institution_connections").select("user_id,pluggy_item_id").eq("status", "CONNECTED");
  if (error) return NextResponse.json({ error: "Não foi possível listar conexões" }, { status: 500 });
  const results = [];
  for (const connection of connections ?? []) {
    try {
      const result = await syncPluggyItem(admin, connection.user_id as string, connection.pluggy_item_id as string);
      results.push({ itemId: connection.pluggy_item_id, ok: true, ...result.counts });
    } catch (cause) {
      results.push({ itemId: connection.pluggy_item_id, ok: false, error: cause instanceof Error ? cause.message : "Falha" });
    }
  }
  const userIds = [...new Set((connections ?? []).map((item) => item.user_id as string))];
  let emailsSent = 0;
  for (const userId of userIds) {
    try { if (await sendReminderEmail(admin, userId, await loadFinanceState(admin, userId))) emailsSent += 1; }
    catch { /* A sincronização não falha quando o provedor de e-mail está indisponível. */ }
  }
  return NextResponse.json({ syncedAt: new Date().toISOString(), results, emailsSent });
}
