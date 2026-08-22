import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const { requireUser, deleteAccountData } = vi.hoisted(() => ({
  requireUser: vi.fn(),
  deleteAccountData: vi.fn(),
}));

vi.mock("@/lib/supabase-server", () => ({ requireUser }));
vi.mock("@/lib/account-deletion", () => ({ deleteAccountData }));

import { DELETE } from "@/app/api/account/route";

describe("DELETE /api/account", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("exige uma sessão autenticada", async () => {
    requireUser.mockResolvedValue({ admin: null, user: null, error: "Sessão ausente" });

    const response = await DELETE(new NextRequest("https://stableai.example/api/account", { method: "DELETE" }));

    expect(response.status).toBe(401);
    expect(deleteAccountData).not.toHaveBeenCalled();
  });

  it("apaga somente o id obtido da sessão", async () => {
    const admin = { marker: "service-role" };
    requireUser.mockResolvedValue({ admin, user: { id: "usuario-autenticado" }, error: null });
    deleteAccountData.mockResolvedValue({ disconnectedConnections: 2 });
    const request = new NextRequest("https://stableai.example/api/account?userId=outra-pessoa", {
      method: "DELETE",
      body: JSON.stringify({ userId: "outra-pessoa" }),
    });

    const response = await DELETE(request);

    expect(response.status).toBe(200);
    expect(deleteAccountData).toHaveBeenCalledWith(admin, "usuario-autenticado");
  });
});
