import { createHmac, timingSafeEqual } from "node:crypto";
import { getEnv } from "@/config/env";

export function csrfToken(sessionId: string): string {
  const secret = getEnv().AUTH_SECRET;
  return createHmac("sha256", secret).update(`csrf:${sessionId}`).digest("base64url");
}

export function verifyCsrf(sessionId: string, token: string | null | undefined): boolean {
  if (!token) return false;
  const expected = csrfToken(sessionId);
  const a = Buffer.from(expected);
  const b = Buffer.from(token);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export function guestCsrf(guestKey: string): string {
  const secret = getEnv().AUTH_SECRET;
  return createHmac("sha256", secret).update(`csrf-guest:${guestKey}`).digest("base64url");
}
