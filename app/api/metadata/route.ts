import dns from "node:dns/promises";
import net from "node:net";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseAdmin, requireUser } from "@/lib/supabase-server";
import { isRateLimited } from "@/lib/rate-limit";

const schema = z.object({ url: z.string().url().max(2048) });
const MAX_BYTES = 1_000_000;

function ipv6Bytes(address: string) {
  let normalized = address.toLowerCase().split("%")[0];
  if (net.isIP(normalized) !== 6) return null;
  const dotted = normalized.match(/(\d+\.\d+\.\d+\.\d+)$/)?.[1];
  if (dotted) {
    const octets = dotted.split(".").map(Number);
    normalized = normalized.slice(0, -dotted.length) + `${((octets[0] << 8) | octets[1]).toString(16)}:${((octets[2] << 8) | octets[3]).toString(16)}`;
  }
  const [head = "", tail = ""] = normalized.split("::");
  const before = head ? head.split(":") : [];
  const after = tail ? tail.split(":") : [];
  const groups = normalized.includes("::") ? [...before, ...Array(8 - before.length - after.length).fill("0"), ...after] : before;
  if (groups.length !== 8) return null;
  return groups.flatMap((group) => {
    const value = Number.parseInt(group, 16);
    return [value >> 8, value & 255];
  });
}

export function isPrivateIp(address: string) {
  if (net.isIP(address) === 4) {
    const [a, b] = address.split(".").map(Number);
    return a === 10 || a === 127 || a === 0 || a >= 224 || (a === 100 && b >= 64 && b <= 127) || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 198 && (b === 18 || b === 19));
  }
  const bytes = ipv6Bytes(address);
  if (!bytes) return true;
  if (bytes.slice(0, 15).every((byte) => byte === 0) && bytes[15] <= 1) return true;
  if ((bytes[0] & 0xfe) === 0xfc || (bytes[0] === 0xfe && (bytes[1] & 0xc0) === 0x80) || bytes[0] === 0xff) return true;
  if (bytes.slice(0, 10).every((byte) => byte === 0) && bytes[10] === 0xff && bytes[11] === 0xff) return isPrivateIp(bytes.slice(12).join("."));
  return false;
}

async function assertPublicUrl(value: string) {
  const url = new URL(value);
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) throw new Error("Use um link público HTTP ou HTTPS.");
  const resolved = await Promise.allSettled([dns.resolve4(url.hostname), dns.resolve6(url.hostname)]);
  const addresses = resolved.flatMap((result) => result.status === "fulfilled" ? result.value : []);
  if (!addresses.length || addresses.some(isPrivateIp)) throw new Error("Este endereço não pode ser acessado.");
  return url;
}

async function readLimited(response: Response) {
  if (!response.body) return new Uint8Array();
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > MAX_BYTES) {
      await reader.cancel();
      throw new Error("A página é grande demais para leitura automática.");
    }
    chunks.push(value);
  }
  const body = new Uint8Array(total);
  let offset = 0;
  chunks.forEach((chunk) => { body.set(chunk, offset); offset += chunk.byteLength; });
  return body;
}

async function fetchHtml(value: string, redirects = 0): Promise<{ html: string; finalUrl: string }> {
  if (redirects > 3) throw new Error("O link redirecionou muitas vezes.");
  const url = await assertPublicUrl(value);
  // The Worker enables global_fetch_strictly_public, so a DNS rebind cannot route this request to a private origin.
  const response = await fetch(url, {
    redirect: "manual",
    headers: { "User-Agent": "StableAI/1.0 product-metadata", Accept: "text/html" },
    signal: AbortSignal.timeout(7_000),
  });
  if (response.status >= 300 && response.status < 400) {
    const location = response.headers.get("location");
    if (!location) throw new Error("Redirecionamento inválido.");
    return fetchHtml(new URL(location, url).toString(), redirects + 1);
  }
  if (response.status < 200 || response.status >= 300) throw new Error("A loja não permitiu consultar este link.");
  if (!(response.headers.get("content-type") || "").includes("text/html")) throw new Error("O link não aponta para uma página de produto.");
  const size = Number(response.headers.get("content-length") || 0);
  if (size > MAX_BYTES) throw new Error("A página é grande demais para leitura automática.");
  return { html: new TextDecoder().decode(await readLimited(response)), finalUrl: url.toString() };
}

function decode(value = "") {
  return value.replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").trim();
}

function meta(html: string, key: string) {
  const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const patterns = [
    new RegExp(`<meta[^>]+(?:property|name)=["']${escaped}["'][^>]+content=["']([^"']+)["'][^>]*>`, "i"),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${escaped}["'][^>]*>`, "i"),
  ];
  return decode(patterns.map((pattern) => html.match(pattern)?.[1]).find(Boolean));
}

export async function POST(request: NextRequest) {
  let userId = "development";
  if (getSupabaseAdmin()) {
    const { user } = await requireUser(request);
    if (!user) return NextResponse.json({ error: "Entre na sua conta para consultar um produto." }, { status: 401 });
    userId = user.id;
  } else if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Serviço ainda não configurado." }, { status: 503 });
  }
  if (isRateLimited(`metadata:${userId}`, 20)) return NextResponse.json({ error: "Muitas requisições, tente em instantes." }, { status: 429 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Informe um link válido." }, { status: 400 });
  try {
    const { html, finalUrl } = await fetchHtml(parsed.data.url);
    const title = meta(html, "og:title") || meta(html, "twitter:title") || decode(html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1]);
    const image = meta(html, "og:image") || meta(html, "twitter:image");
    const priceRaw = meta(html, "product:price:amount") || html.match(/["']price["']\s*:\s*["']?([\d.,]+)/i)?.[1] || "";
    const currency = (meta(html, "product:price:currency") || html.match(/["']priceCurrency["']\s*:\s*["']([A-Z]{3})/i)?.[1] || "BRL").toUpperCase();
    const price = Number(priceRaw.replace(/\.(?=\d{3}(?:\D|$))/g, "").replace(",", ".")) || undefined;
    return NextResponse.json({ title: title || new URL(finalUrl).hostname, image: image ? new URL(image, finalUrl).toString() : undefined, price, currency: currency === "USD" ? "USD" : "BRL" });
  } catch (cause) {
    return NextResponse.json({ error: cause instanceof Error ? cause.message : "Preencha as informações manualmente." }, { status: 422 });
  }
}
