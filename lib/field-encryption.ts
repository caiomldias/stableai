import { getServerEnv } from "@/lib/server-env";

const PREFIX = "enc:v1:";
const additionalData = new TextEncoder().encode("StableAI:boleto-line:v1");

async function key() {
  const encoded = getServerEnv("BOLETO_ENCRYPTION_KEY");
  const bytes = encoded ? Buffer.from(encoded, "base64") : Buffer.alloc(0);
  if (bytes.length !== 32) throw new Error("Chave de criptografia dos boletos não configurada.");
  return crypto.subtle.importKey("raw", bytes, "AES-GCM", false, ["encrypt", "decrypt"]);
}

export async function encryptSensitiveText(value: string) {
  if (value.startsWith(PREFIX)) return value;
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt({ name: "AES-GCM", iv, additionalData }, await key(), new TextEncoder().encode(value));
  return `${PREFIX}${Buffer.from(iv).toString("base64url")}:${Buffer.from(encrypted).toString("base64url")}`;
}

export async function decryptSensitiveText(value: string) {
  if (!value.startsWith(PREFIX)) return value;
  const [iv, encrypted] = value.slice(PREFIX.length).split(":");
  if (!iv || !encrypted) throw new Error("Linha digitável criptografada inválida.");
  const plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv: Buffer.from(iv, "base64url"), additionalData }, await key(), Buffer.from(encrypted, "base64url"));
  return new TextDecoder().decode(plain);
}
