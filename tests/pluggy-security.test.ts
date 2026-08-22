import type { SupabaseClient } from "@supabase/supabase-js";
import { afterEach, describe, expect, it, vi } from "vitest";
import { syncPluggyItem } from "@/lib/pluggy";

describe("segurança da sincronização Pluggy", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    process.env.PLUGGY_CLIENT_ID = "";
    process.env.PLUGGY_CLIENT_SECRET = "";
  });

  it("rejeita um item pertencente a outro usuário antes de consultar seus dados", async () => {
    process.env.PLUGGY_CLIENT_ID = "client-id-test";
    process.env.PLUGGY_CLIENT_SECRET = "client-secret-test";
    const fetchMock = vi.fn(async (input: string | URL | Request) => {
      const url = String(input);
      if (url.endsWith("/auth")) return Response.json({ apiKey: "api-key-test" });
      if (url.endsWith("/items/item-da-vitima")) return Response.json({ id: "item-da-vitima", clientUserId: "usuario-vitima" });
      throw new Error(`Consulta inesperada: ${url}`);
    });
    vi.stubGlobal("fetch", fetchMock);

    await expect(syncPluggyItem({} as SupabaseClient, "usuario-atacante", "item-da-vitima"))
      .rejects.toThrow("Item não pertence a este usuário.");
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
