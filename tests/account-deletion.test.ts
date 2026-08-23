import type { SupabaseClient } from "@supabase/supabase-js";
import { describe, expect, it, vi } from "vitest";
import { deleteAccountData } from "@/lib/account-deletion";

describe("deleteAccountData", () => {
  it("remove o avatar somente da pasta do usuário autenticado", async () => {
    const remove = vi.fn().mockResolvedValue({ error: null });
    const deleteUser = vi.fn().mockResolvedValue({ error: null });
    const from = vi.fn((table: string) => {
      if (table === "institution_connections") return { select: () => ({ eq: async () => ({ data: [], error: null }) }) };
      if (table === "audit_events") return { insert: async () => ({ error: null }) };
      return { delete: () => ({ eq: async () => ({ error: null }) }) };
    });
    const admin = {
      from,
      storage: { from: vi.fn(() => ({ remove })) },
      auth: { admin: { deleteUser } },
    } as unknown as SupabaseClient;

    await deleteAccountData(admin, "usuario-123", vi.fn());

    expect(admin.storage.from).toHaveBeenCalledWith("avatars");
    expect(remove).toHaveBeenCalledWith(["usuario-123/avatar"]);
    expect(deleteUser).toHaveBeenCalledWith("usuario-123");
  });
});
