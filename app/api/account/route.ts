import { NextRequest, NextResponse } from "next/server";
import { deleteAccountData } from "@/lib/account-deletion";
import { requireUser } from "@/lib/supabase-server";

export async function DELETE(request: NextRequest) {
  const { admin, user, error } = await requireUser(request);
  if (!admin || !user) return NextResponse.json({ error }, { status: 401 });

  try {
    return NextResponse.json({ ok: true, ...(await deleteAccountData(admin, user.id)) });
  } catch (cause) {
    return NextResponse.json(
      { error: cause instanceof Error ? cause.message : "Não foi possível excluir sua conta." },
      { status: 500 },
    );
  }
}
