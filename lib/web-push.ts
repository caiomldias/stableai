export interface StoredPushSubscription {
  endpoint: string;
  p256dh: string;
  auth: string;
}

export interface WebPushPayload {
  title: string;
  body: string;
  url?: string;
  tag?: string;
}

const encoder = new TextEncoder();

function fromBase64Url(value: string) {
  return new Uint8Array(Buffer.from(value, "base64url"));
}

function toBase64Url(value: Uint8Array | string) {
  return Buffer.from(value).toString("base64url");
}

function concatBytes(...parts: Uint8Array[]) {
  const result = new Uint8Array(parts.reduce((total, part) => total + part.byteLength, 0));
  let offset = 0;

  for (const part of parts) {
    result.set(part, offset);
    offset += part.byteLength;
  }

  return result;
}

async function hmac(key: Uint8Array, value: Uint8Array) {
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    key.slice().buffer as ArrayBuffer,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );

  return new Uint8Array(await crypto.subtle.sign("HMAC", cryptoKey, value.slice().buffer as ArrayBuffer));
}

function validatePushEndpoint(endpoint: string) {
  const url = new URL(endpoint);

  if (url.protocol !== "https:" || url.username || url.password || endpoint.length > 2048) {
    throw new Error("Endpoint de push inválido.");
  }

  return url;
}

async function createVapidAuthorization(endpoint: URL) {
  const publicKey = fromBase64Url(getServerEnv("VAPID_PUBLIC_KEY") ?? "");
  const privateKey = fromBase64Url(getServerEnv("VAPID_PRIVATE_KEY") ?? "");
  const subject = getServerEnv("VAPID_SUBJECT")?.trim();

  if (publicKey.byteLength !== 65 || publicKey[0] !== 4 || privateKey.byteLength !== 32 || !subject) {
    throw new Error("VAPID não configurado.");
  }

  const signingKey = await crypto.subtle.importKey(
    "jwk",
    {
      kty: "EC",
      crv: "P-256",
      x: toBase64Url(publicKey.slice(1, 33)),
      y: toBase64Url(publicKey.slice(33, 65)),
      d: toBase64Url(privateKey),
      ext: true,
      key_ops: ["sign"],
    },
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["sign"],
  );
  const issuedAt = Math.floor(Date.now() / 1000);
  const header = toBase64Url(JSON.stringify({ typ: "JWT", alg: "ES256" }));
  const claims = toBase64Url(
    JSON.stringify({
      aud: endpoint.origin,
      exp: issuedAt + 12 * 60 * 60,
      sub: subject,
    }),
  );
  const unsignedToken = `${header}.${claims}`;
  const signature = new Uint8Array(
    await crypto.subtle.sign({ name: "ECDSA", hash: "SHA-256" }, signingKey, encoder.encode(unsignedToken)),
  );

  return `vapid t=${unsignedToken}.${toBase64Url(signature)}, k=${toBase64Url(publicKey)}`;
}

export async function encryptWebPushPayload(
  subscription: Pick<StoredPushSubscription, "p256dh" | "auth">,
  payload: WebPushPayload,
) {
  const clientPublicBytes = fromBase64Url(subscription.p256dh);
  const authSecret = fromBase64Url(subscription.auth);

  if (clientPublicBytes.byteLength !== 65 || clientPublicBytes[0] !== 4 || authSecret.byteLength !== 16) {
    throw new Error("Assinatura de push inválida.");
  }

  const clientPublicKey = await crypto.subtle.importKey(
    "raw",
    clientPublicBytes,
    { name: "ECDH", namedCurve: "P-256" },
    false,
    [],
  );
  const serverKeys = (await crypto.subtle.generateKey(
    { name: "ECDH", namedCurve: "P-256" },
    true,
    ["deriveBits"],
  )) as CryptoKeyPair;
  const serverPublicBytes = new Uint8Array(await crypto.subtle.exportKey("raw", serverKeys.publicKey));
  const sharedSecret = new Uint8Array(
    await crypto.subtle.deriveBits({ name: "ECDH", public: clientPublicKey }, serverKeys.privateKey, 256),
  );
  const keyInfo = concatBytes(
    encoder.encode("WebPush: info"),
    new Uint8Array([0]),
    clientPublicBytes,
    serverPublicBytes,
  );
  const inputKeyMaterial = await hmac(await hmac(authSecret, sharedSecret), concatBytes(keyInfo, new Uint8Array([1])));
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const pseudoRandomKey = await hmac(salt, inputKeyMaterial);
  const contentEncryptionKey = (
    await hmac(
      pseudoRandomKey,
      concatBytes(encoder.encode("Content-Encoding: aes128gcm"), new Uint8Array([0, 1])),
    )
  ).slice(0, 16);
  const nonce = (
    await hmac(pseudoRandomKey, concatBytes(encoder.encode("Content-Encoding: nonce"), new Uint8Array([0, 1])))
  ).slice(0, 12);
  const content = encoder.encode(JSON.stringify(payload));

  if (content.byteLength > 3993) {
    throw new Error("Notificação excede o tamanho permitido.");
  }

  const aesKey = await crypto.subtle.importKey("raw", contentEncryptionKey, "AES-GCM", false, ["encrypt"]);
  const ciphertext = new Uint8Array(
    await crypto.subtle.encrypt({ name: "AES-GCM", iv: nonce }, aesKey, concatBytes(content, new Uint8Array([2]))),
  );
  const recordSize = new Uint8Array(4);
  new DataView(recordSize.buffer).setUint32(0, 4096);

  return concatBytes(
    salt,
    recordSize,
    new Uint8Array([serverPublicBytes.byteLength]),
    serverPublicBytes,
    ciphertext,
  );
}

export async function sendWebPush(subscription: StoredPushSubscription, payload: WebPushPayload) {
  const endpoint = validatePushEndpoint(subscription.endpoint);
  const body = await encryptWebPushPayload(subscription, payload);
  const authorization = await createVapidAuthorization(endpoint);

  return fetch(endpoint, {
    method: "POST",
    redirect: "error",
    headers: {
      Authorization: authorization,
      "Content-Encoding": "aes128gcm",
      "Content-Type": "application/octet-stream",
      TTL: "86400",
    },
    body,
    signal: AbortSignal.timeout(10_000),
  });
}
import { getServerEnv } from "@/lib/server-env";
