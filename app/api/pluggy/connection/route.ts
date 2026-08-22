import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { deletePluggyItem } from "@/lib/pluggy";
import { requireUser } from "@/lib/supabase-server";

const schema = z.object({ itemId: z.string().uuid(), deleteData: z.boolean() });

export async function DELETE(request: NextRequest) {
  const { admin, user, error } = await requireUser(request);
  if (!admin || !user) return NextResponse.json({ error }, { status: 401 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Solicitação inválida." }, { status: 400 });

  const { data: connection } = await admin.from("institution_connections").select("id").eq("user_id", user.id).eq("pluggy_item_id", parsed.data.itemId).maybeSingle();
  if (!connection) return NextResponse.json({ error: "Conexão não encontrada." }, { status: 404 });

  try {
    await deletePluggyItem(parsed.data.itemId);
    if (!parsed.data.deleteData) {
      await admin.from("accounts").update({ connection_id: null }).eq("user_id", user.id).eq("connection_id", connection.id);
      await admin.from("investments").update({ connection_id: null }).eq("user_id", user.id).eq("connection_id", connection.id);
    }
    const { error: deleteError } = await admin.from("institution_connections").delete().eq("id", connection.id).eq("user_id", user.id);
    if (deleteError) throw deleteError;
    await admin.from("audit_events").insert({ user_id: user.id, action: parsed.data.deleteData ? "pluggy.disconnect_and_delete" : "pluggy.disconnect_keep_history", target_type: "institution_connection", target_id: connection.id });
    return NextResponse.json({ ok: true });
  } catch (cause) {
    return NextResponse.json({ error: cause instanceof Error ? cause.message : "Não foi possível desconectar." }, { status: 502 });
  }
}
