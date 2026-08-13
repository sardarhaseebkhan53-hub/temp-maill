import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import { getEnv } from "@/config/env";
import { randomToken } from "@/lib/crypto";

const COOKIE = "haven_guest";

function key() {
  return new TextEncoder().encode(getEnv().AUTH_SECRET);
}

export interface GuestPayload {
  gid: string;
  boxes: string[];
}

export async function getGuest(): Promise<GuestPayload> {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (token) {
    try {
      const { payload } = await jwtVerify(token, key());
      if (typeof payload.gid === "string" && Array.isArray(payload.boxes)) {
        return { gid: payload.gid, boxes: payload.boxes.filter((b): b is string => typeof b === "string") };
      }
    } catch {
      /* issue a new one */
    }
  }
  return { gid: randomToken(16), boxes: [] };
}

export async function signGuest(payload: GuestPayload): Promise<string> {
  return new SignJWT({ gid: payload.gid, boxes: payload.boxes.slice(0, 20) })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(key());
}

export function guestCookieOptions() {
  const env = getEnv();
  return {
    name: COOKIE,
    httpOnly: true,
    sameSite: "lax" as const,
    secure: Boolean(env.COOKIE_SECURE) || env.NODE_ENV === "production",
    path: "/",
    maxAge: 30 * 86_400,
  };
}

export async function rememberMailbox(mailboxId: string) {
  const guest = await getGuest();
  if (!guest.boxes.includes(mailboxId)) guest.boxes.unshift(mailboxId);
  return { guest, token: await signGuest(guest) };
}
