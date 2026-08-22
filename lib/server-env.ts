import { getCloudflareContext } from "@opennextjs/cloudflare";

export function getServerEnv(key: string) {
  try {
    const value = getCloudflareContext().env[key as keyof CloudflareEnv];
    return typeof value === "string" && value ? value : process.env[key];
  } catch {
    return process.env[key];
  }
}
