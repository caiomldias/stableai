"use client";

import { useEffect } from "react";

export function supportsWebPush() {
  return typeof window !== "undefined"
    && window.isSecureContext
    && "serviceWorker" in navigator
    && "PushManager" in window
    && "Notification" in window;
}

function applicationServerKey(value: string) {
  const padding = "=".repeat((4 - value.length % 4) % 4);
  const base64 = (value + padding).replace(/-/g, "+").replace(/_/g, "/");
  return Uint8Array.from(atob(base64), (character) => character.charCodeAt(0));
}

async function readyServiceWorker() {
  await navigator.serviceWorker.register("/sw.js");
  return navigator.serviceWorker.ready;
}

export async function currentPushSubscription() {
  if (!supportsWebPush()) return null;
  return (await readyServiceWorker()).pushManager.getSubscription();
}

export async function subscribeToPush(accessToken: string) {
  if (!supportsWebPush()) throw new Error("Este navegador não oferece notificações push.");
  const permission = await Notification.requestPermission();
  if (permission !== "granted") throw new Error("Permissão de notificações não concedida.");

  const keyResponse = await fetch("/api/push/subscribe", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const keyResult = await keyResponse.json() as { publicKey?: string; error?: string };
  if (!keyResponse.ok || !keyResult.publicKey) {
    throw new Error(keyResult.error || "Não foi possível configurar as notificações.");
  }

  const registration = await readyServiceWorker();
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: applicationServerKey(keyResult.publicKey),
  });
  const serialized = subscription.toJSON();
  const response = await fetch("/api/push/subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify(serialized),
  });
  const result = await response.json() as { error?: string; testSent?: boolean };

  if (!response.ok) {
    await subscription.unsubscribe();
    throw new Error(result.error || "Não foi possível ativar as notificações.");
  }

  return result.testSent === true;
}

export async function unsubscribeFromPush(accessToken: string) {
  const subscription = await currentPushSubscription();
  if (!subscription) return;

  const response = await fetch("/api/push/subscribe", {
    method: "DELETE",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify({ endpoint: subscription.endpoint }),
  });
  const result = await response.json() as { error?: string };
  await subscription.unsubscribe();
  if (!response.ok) throw new Error(result.error || "Não foi possível desativar as notificações.");
}

export function ServiceWorkerRegistration() {
  useEffect(() => {
    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      navigator.serviceWorker.register("/sw.js").catch(() => undefined);
    }
  }, []);
  return null;
}
