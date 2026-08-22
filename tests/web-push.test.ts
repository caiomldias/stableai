import { describe, expect, it } from "vitest";
import { encryptWebPushPayload } from "@/lib/web-push";

const encoder = new TextEncoder();

function concat(...parts: Uint8Array[]) {
  const result = new Uint8Array(parts.reduce((sum, part) => sum + part.byteLength, 0));
  let offset = 0;
  for (const part of parts) {
    result.set(part, offset);
    offset += part.byteLength;
  }
  return result;
}

async function hmac(key: Uint8Array, value: Uint8Array) {
  const imported = await crypto.subtle.importKey(
    "raw",
    key.slice().buffer as ArrayBuffer,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  return new Uint8Array(
    await crypto.subtle.sign("HMAC", imported, value.slice().buffer as ArrayBuffer),
  );
}

describe("Web Push", () => {
  it("produz um registro aes128gcm que a chave do navegador consegue decifrar", async () => {
    const clientKeys = (await crypto.subtle.generateKey(
      { name: "ECDH", namedCurve: "P-256" },
      true,
      ["deriveBits"],
    )) as CryptoKeyPair;
    const clientPublic = new Uint8Array(await crypto.subtle.exportKey("raw", clientKeys.publicKey));
    const auth = crypto.getRandomValues(new Uint8Array(16));
    const payload = { title: "StableAI", body: "Boleto vence amanhã", url: "/?view=more" };
    const encrypted = await encryptWebPushPayload(
      {
        p256dh: Buffer.from(clientPublic).toString("base64url"),
        auth: Buffer.from(auth).toString("base64url"),
      },
      payload,
    );

    const salt = encrypted.slice(0, 16);
    expect(new DataView(encrypted.buffer, encrypted.byteOffset + 16, 4).getUint32(0)).toBe(4096);
    const serverPublicLength = encrypted[20];
    const serverPublic = encrypted.slice(21, 21 + serverPublicLength);
    const ciphertext = encrypted.slice(21 + serverPublicLength);
    const importedServerPublic = await crypto.subtle.importKey(
      "raw",
      serverPublic,
      { name: "ECDH", namedCurve: "P-256" },
      false,
      [],
    );
    const sharedSecret = new Uint8Array(
      await crypto.subtle.deriveBits({ name: "ECDH", public: importedServerPublic }, clientKeys.privateKey, 256),
    );
    const keyInfo = concat(
      encoder.encode("WebPush: info"),
      new Uint8Array([0]),
      clientPublic,
      serverPublic,
    );
    const inputKeyMaterial = await hmac(await hmac(auth, sharedSecret), concat(keyInfo, new Uint8Array([1])));
    const pseudoRandomKey = await hmac(salt, inputKeyMaterial);
    const contentEncryptionKey = (
      await hmac(
        pseudoRandomKey,
        concat(encoder.encode("Content-Encoding: aes128gcm"), new Uint8Array([0, 1])),
      )
    ).slice(0, 16);
    const nonce = (
      await hmac(pseudoRandomKey, concat(encoder.encode("Content-Encoding: nonce"), new Uint8Array([0, 1])))
    ).slice(0, 12);
    const aesKey = await crypto.subtle.importKey("raw", contentEncryptionKey, "AES-GCM", false, ["decrypt"]);
    const plaintext = new Uint8Array(
      await crypto.subtle.decrypt({ name: "AES-GCM", iv: nonce }, aesKey, ciphertext),
    );

    expect(plaintext.at(-1)).toBe(2);
    expect(JSON.parse(new TextDecoder().decode(plaintext.slice(0, -1)))).toEqual(payload);
  });
});
