import type { SupabaseClient } from "@supabase/supabase-js";
import { afterEach, describe, expect, it, vi } from "vitest";
import { mergePluggyTransactions, syncPluggyItem } from "@/lib/pluggy";
import type { Transaction } from "@/lib/types";

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

  it("preserva lançamentos manuais vinculados a uma conta sincronizada", () => {
    const transaction = (id: string, source: Transaction["source"]): Transaction => ({
      id,
      source,
      accountId: "conta-pluggy",
      description: id,
      amountCents: 1_000,
      currency: "BRL",
      date: "2026-08-22",
      flow: "EXPENSE",
      kind: "OTHER",
      category: "Outros",
      originalCategory: "Outros",
    });

    const result = mergePluggyTransactions(
      [transaction("manual", "MANUAL"), transaction("antiga", "PLUGGY")],
      new Set(["conta-pluggy"]),
      [transaction("nova", "PLUGGY")],
    );

    expect(result.map((item) => item.id)).toEqual(["manual", "nova"]);
  });
});
