import type { SupabaseClient } from "@supabase/supabase-js";
import { emptyFinanceData } from "@/lib/empty-data";
import type { FinanceData } from "@/lib/types";
import { decryptSensitiveText, encryptSensitiveText } from "@/lib/field-encryption";

export async function loadFinanceState(admin: SupabaseClient, userId: string): Promise<FinanceData> {
  const { data, error } = await admin.from("finance_state").select("payload").eq("user_id", userId).maybeSingle();
  if (error) throw error;
  const payload = data?.payload;
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) return structuredClone(emptyFinanceData);
  const result = { ...structuredClone(emptyFinanceData), ...(payload as Partial<FinanceData>) };
  result.boletos = await Promise.all(result.boletos.map(async (boleto) => ({ ...boleto, digitableLine: boleto.digitableLine ? await decryptSensitiveText(boleto.digitableLine) : undefined })));
  return result;
}

export async function saveFinanceState(admin: SupabaseClient, userId: string, payload: FinanceData) {
  const stored = structuredClone(payload);
  stored.boletos = await Promise.all(stored.boletos.map(async (boleto) => ({ ...boleto, digitableLine: boleto.digitableLine ? await encryptSensitiveText(boleto.digitableLine) : undefined })));
  const { error } = await admin.from("finance_state").upsert({ user_id: userId, payload: stored, updated_at: new Date().toISOString() });
  if (error) throw error;
}

export function isFinanceData(value: unknown): value is FinanceData {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const record = value as Record<string, unknown>;
  const arrays = ["accounts", "transactions", "budgets", "recurring", "boletos", "sharedExpenses", "investments", "vaults", "goals", "wishlist", "connections"];
  return arrays.every((key) => Array.isArray(record[key])) && typeof record.notifications === "object";
}
