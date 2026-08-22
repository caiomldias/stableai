import { describe, expect, it } from "vitest";
import { isRateLimited } from "@/lib/rate-limit";
import { timingSafeMatch } from "@/lib/timing-safe";
import { isPrivateIp } from "@/app/api/metadata/route";
import { decryptSensitiveText, encryptSensitiveText } from "@/lib/field-encryption";

describe("utilitários de segurança", () => {
  it("limita por janela fixa e libera uma nova janela", () => {
    expect(isRateLimited("teste:usuario", 2, 1_000)).toBe(false);
    expect(isRateLimited("teste:usuario", 2, 1_001)).toBe(false);
    expect(isRateLimited("teste:usuario", 2, 1_002)).toBe(true);
    expect(isRateLimited("teste:usuario", 2, 61_000)).toBe(false);
  });

  it("compara segredos sem aceitar valores ausentes ou diferentes", () => {
    expect(timingSafeMatch("Bearer segredo", "Bearer segredo")).toBe(true);
    expect(timingSafeMatch("Bearer errado", "Bearer segredo")).toBe(false);
    expect(timingSafeMatch(null, "Bearer segredo")).toBe(false);
  });

  it("bloqueia redes IPv6 privadas, link-local e IPv4 mapeado", () => {
    expect(isPrivateIp("fd12:3456::1")).toBe(true);
    expect(isPrivateIp("febf::1")).toBe(true);
    expect(isPrivateIp("::ffff:192.168.1.5")).toBe(true);
    expect(isPrivateIp("2606:4700:4700::1111")).toBe(false);
  });

  it("persiste a linha digitável cifrada e permite recuperá-la", async () => {
    process.env.BOLETO_ENCRYPTION_KEY = Buffer.alloc(32, 7).toString("base64");
    const encrypted = await encryptSensitiveText("34191.79001 01043.510047");
    expect(encrypted).not.toContain("34191.79001");
    await expect(decryptSensitiveText(encrypted)).resolves.toBe("34191.79001 01043.510047");
    process.env.BOLETO_ENCRYPTION_KEY = "";
  });
});
