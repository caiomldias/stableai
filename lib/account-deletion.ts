import type { SupabaseClient } from "@supabase/supabase-js";
import { deletePluggyItem } from "@/lib/pluggy";

export async function deleteAccountData(
  admin: SupabaseClient,
  userId: string,
  disconnectPluggyItem = deletePluggyItem,
) {
  const { data: connections, error: connectionError } = await admin
    .from("institution_connections")
    .select("pluggy_item_id")
    .eq("user_id", userId);
  if (connectionError) throw new Error(connectionError.message);

  for (const connection of connections ?? []) {
    await disconnectPluggyItem(connection.pluggy_item_id as string);
  }

  const { error: auditError } = await admin.from("audit_events").insert({
    user_id: userId,
    action: "account.delete",
    target_type: "account",
    metadata: { disconnected_connections: connections?.length ?? 0 },
  });
  if (auditError) throw new Error(auditError.message);

  const { error: deleteUserError } = await admin.auth.admin.deleteUser(userId);
  if (deleteUserError) throw new Error(deleteUserError.message);

  const { error: financeError } = await admin
    .from("finance_state")
    .delete()
    .eq("user_id", userId);
  if (financeError) throw new Error(financeError.message);

  return { disconnectedConnections: connections?.length ?? 0 };
}
