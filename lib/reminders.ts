import type { SupabaseClient } from "@supabase/supabase-js";
import { money, shortDate } from "@/lib/finance";
import type { FinanceData } from "@/lib/types";
import { getServerEnv } from "@/lib/server-env";

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character] || character);
}

export function dueReminders(data: FinanceData) {
  const limit = new Date();
  limit.setHours(23, 59, 59, 999);
  limit.setDate(limit.getDate() + data.notifications.daysBefore);
  const isSoon = (value: string) => {
    const date = new Date(`${value.slice(0, 10)}T12:00:00`);
    return !Number.isNaN(date.getTime()) && date <= limit;
  };
  return [
    ...data.boletos.filter((item) => item.status !== "PAID" && isSoon(item.dueDate)).map((item) => ({ id: `bill-${item.id}`, title: item.description, detail: `Boleto vence ${shortDate(item.dueDate)}`, amount: money(item.amountCents, item.currency) })),
    ...data.sharedExpenses.filter((item) => item.status !== "PAID" && isSoon(item.dueDate)).map((item) => ({ id: `share-${item.id}`, title: `Cobrar ${item.person}`, detail: `Lembrete para ${shortDate(item.dueDate)}`, amount: money(item.amountCents, item.currency) })),
  ];
}

export async function sendReminderEmail(admin: SupabaseClient, userId: string, data: FinanceData) {
  const apiKey = getServerEnv("RESEND_API_KEY");
  const from = getServerEnv("NOTIFICATION_FROM_EMAIL");
  if (!apiKey || !from || !data.notifications.email) return false;
  const reminders = dueReminders(data);
  if (!reminders.length) return false;
  const today = new Date().toISOString().slice(0, 10);
  const targetId = `daily-${today}`;
  const { data: sent } = await admin.from("audit_events").select("id").eq("user_id", userId).eq("action", "notification.email").eq("target_id", targetId).maybeSingle();
  if (sent) return false;
  const { data: authData } = await admin.auth.admin.getUserById(userId);
  const email = authData.user?.email;
  if (!email) return false;
  const items = reminders.map((item) => `<li><strong>${escapeHtml(item.title)}</strong><br>${escapeHtml(item.detail)}: ${escapeHtml(item.amount)}</li>`).join("");
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ from, to: [email], subject: "Seus lembretes do StableAI", html: `<h1>Seus próximos compromissos</h1><ul>${items}</ul><p>Abra o StableAI para revisar os detalhes.</p>` }),
  });
  if (!response.ok) throw new Error("Falha ao enviar lembrete por e-mail.");
  await admin.from("audit_events").insert({ user_id: userId, action: "notification.email", target_type: "daily_reminder", target_id: targetId, metadata: { count: reminders.length } });
  return true;
}
