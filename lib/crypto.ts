import { randomBytes, createHash, createHmac, timingSafeEqual } from "node:crypto";
import { argon2id } from "@noble/hashes/argon2.js";
import { bytesToHex, hexToBytes, utf8ToBytes } from "@noble/hashes/utils.js";

const ARGON2_OPTS = {
  t: 3,
  m: 32 * 1024,
  p: 1,
  dkLen: 32,
};

export function randomToken(bytes = 32): string {
  return randomBytes(bytes).toString("base64url");
}

export function randomId(prefix = "", bytes = 16): string {
  const body = randomBytes(bytes).toString("base64url");
  return prefix ? `${prefix}${body}` : body;
}

export function sha256Hex(input: string): string {
  return createHash("sha256").update(input).digest("hex");
}

export function hmacSha256Hex(secret: string, payload: string): string {
  return createHmac("sha256", secret).update(payload).digest("hex");
}

export function timingSafeEqualStr(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const hash = argon2id(utf8ToBytes(password), salt, ARGON2_OPTS);
  return `argon2id$${bytesToHex(salt)}$${bytesToHex(hash)}`;
}

export async function verifyPassword(password: string, encoded: string): Promise<boolean> {
  const parts = encoded.split("$");
  if (parts.length !== 3 || parts[0] !== "argon2id" || !parts[1] || !parts[2]) {
    return false;
  }
  try {
    const salt = hexToBytes(parts[1]);
    const expected = hexToBytes(parts[2]);
    const actual = argon2id(utf8ToBytes(password), salt, ARGON2_OPTS);
    if (actual.length !== expected.length) return false;
    return timingSafeEqual(Buffer.from(actual), Buffer.from(expected));
  } catch {
    return false;
  }
}

export function hashSecret(value: string): string {
  return sha256Hex(value);
}

export function generateApiKey(mode: "live" | "test"): { plaintext: string; prefix: string; lastFour: string } {
  const raw = randomBytes(24).toString("base64url");
  const plaintext = `tmp_${mode}_${raw}`;
  return {
    plaintext,
    prefix: plaintext.slice(0, 16),
    lastFour: plaintext.slice(-4),
  };
}

export function generateReferralCode(): string {
  return randomBytes(5).toString("hex").toUpperCase();
}
