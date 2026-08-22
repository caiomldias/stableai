import { timingSafeEqual } from "node:crypto";

export function timingSafeMatch(actual: string | null, expected: string) {
  if (actual === null) return false;
  const actualBytes = Buffer.from(actual, "utf8");
  const expectedBytes = Buffer.from(expected, "utf8");
  return actualBytes.length === expectedBytes.length && timingSafeEqual(actualBytes, expectedBytes);
}
