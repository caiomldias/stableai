import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServerEnv } from "@/lib/server-env";
import { requireUser } from "@/lib/supabase-server";
import { sendWebPush } from "@/lib/web-push";

const subscriptionSchema = z.object({
  endpoint: z.string().url().max(2048).refine((value) => value.startsWith("https://"), "Endpoint inválido."),
  keys: z.object({
    p256dh: z.string().min(1).max(256),
    auth: z.string().min(1).max(128),
  }),
});

export async function GET(request: NextRequest) {
  const { user, error } = await requireUser(request);
  if (!user) return NextResponse.json({ error }, { status: 401 });
  const publicKey = getServerEnv("VAPID_PUBLIC_KEY");

  if (!publicKey) {
    return NextResponse.json({ error: "Notificações push ainda não foram configuradas." }, { status: 503 });
  }

  return NextResponse.json({ publicKey });
}

export async function POST(request: NextRequest) {
  try {
    const { user, admin, error } = await requireUser(request);
    if (!user || !admin) return NextResponse.json({ error }, { status: 401 });
    const parsed = subscriptionSchema.safeParse(await request.json());

    if (!parsed.success) {
      return NextResponse.json({ error: "Assinatura de push inválida." }, { status: 400 });
    }

    const { endpoint, keys } = parsed.data;
    const { data: existing, error: lookupError } = await admin
      .from("push_subscriptions")
      .select("user_id")
      .eq("endpoint", endpoint)
      .maybeSingle();

    if (lookupError) throw new Error(lookupError.message);
    if (existing && existing.user_id !== user.id) {
      return NextResponse.json({ error: "Assinatura pertence a outro usuário." }, { status: 409 });
    }

    const { error: saveError } = await admin.from("push_subscriptions").upsert(
      {
        user_id: user.id,
        endpoint,
        p256dh: keys.p256dh,
        auth: keys.auth,
      },
      { onConflict: "endpoint" },
    );

    if (saveError) throw new Error(saveError.message);

    let testSent = false;
    try {
      const response = await sendWebPush(
        { endpoint, p256dh: keys.p256dh, auth: keys.auth },
        {
          title: "StableAI",
          body: "Notificações ativadas com sucesso.",
          url: "/",
          tag: "stableai-push-enabled",
        },
      );
      testSent = response.ok;

      if (response.status === 404 || response.status === 410) {
        await admin.from("push_subscriptions").delete().eq("user_id", user.id).eq("endpoint", endpoint);
      }
    } catch {
      testSent = false;
    }

    return NextResponse.json({ ok: true, testSent });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Não foi possível ativar notificações.";
    return NextResponse.json({ error: message }, { status: message === "Não autorizado." ? 401 : 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { user, admin, error: authError } = await requireUser(request);
    if (!user || !admin) return NextResponse.json({ error: authError }, { status: 401 });
    const parsed = z.object({ endpoint: z.string().url().max(2048) }).parse(await request.json());
    const { error } = await admin
      .from("push_subscriptions")
      .delete()
      .eq("user_id", user.id)
      .eq("endpoint", parsed.endpoint);

    if (error) throw new Error(error.message);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Não foi possível desativar notificações.";
    return NextResponse.json({ error: message }, { status: message === "Não autorizado." ? 401 : 400 });
  }
}
