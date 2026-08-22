import { createClient } from "@supabase/supabase-js";
import type { NextRequest } from "next/server";
import { getServerEnv } from "@/lib/server-env";

export function getSupabaseAdmin() {
  const url = getServerEnv("NEXT_PUBLIC_SUPABASE_URL");
  const serviceKey = getServerEnv("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !serviceKey) return null;
  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function requireUser(request: NextRequest) {
  const admin = getSupabaseAdmin();
  if (!admin) return { admin: null, user: null, error: "Supabase não configurado" };
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return { admin, user: null, error: "Sessão ausente" };
  const { data, error } = await admin.auth.getUser(token);
  return { admin, user: data.user, error: error?.message ?? null };
}
