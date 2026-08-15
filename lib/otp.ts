/**
 * Verification-code detection for inbound email and SMS.
 *
 * Haven never invents codes: a code is surfaced only when the incoming
 * message itself contains a likely OTP. Detection is deliberately
 * conservative — a false negative merely hides a convenience badge, while a
 * false positive would present a random number as a security code.
 *
 * Accepted shapes:
 *   - a 4–8 digit run next to a keyword ("code", "OTP", "verification", ...)
 *   - classic prefixed forms ("G-482913")
 *   - a message whose entire body is just the code
 *   - visual separators ("482 913", "482-913") when a keyword is present
 *
 * The original message is never modified; the detected digits are stored
 * separately.
 */

const KEYWORD = /code|otp|verification|verifizierung|passcode|pin|password|kennwort|codigo|c[óo]digo|token|2fa|bestätigung/i;

/** 4–8 digit runs, optionally split by spaces or dashes ("482 913", "77 42 91"). */
const CANDIDATE = /(?<![\w-])(?:\d{4,8}|\d{2,4}(?:[ -]\d{2,4}){1,3})(?![\w-])/g;

const PREFIXED = /(?<![\w])[A-Z]{1,3}-(\d{4,8})(?![\d])/g;

function digitsOnly(raw: string): string {
  return raw.replace(/[^\d]/g, "");
}

function plausible(code: string): boolean {
  if (code.length < 4 || code.length > 8) return false;
  // All-same-digit strings ("000000") appear in template placeholders, not
  // real deliveries.
  if (/^(\d)\1+$/.test(code)) return false;
  return true;
}

/**
 * Returns the detected verification code as plain digits, or null when the
 * message contains nothing that looks like an OTP.
 */
export function detectOtpCode(text: string | null | undefined): string | null {
  if (!text) return null;
  const body = String(text).slice(0, 20_000);

  // 1) Prefixed classics: "G-482913".
  for (const match of body.matchAll(PREFIXED)) {
    const code = digitsOnly(match[1] ?? "");
    if (plausible(code)) return code;
  }

  // 2) Keyword-associated candidates. For each digit run, look at a
  //    60-character window on either side for a keyword.
  for (const match of body.matchAll(CANDIDATE)) {
    const raw = match[0];
    const code = digitsOnly(raw);
    if (!plausible(code)) continue;
    const at = match.index ?? 0;
    const windowText = body.slice(Math.max(0, at - 60), at + raw.length + 60);
    if (KEYWORD.test(windowText)) return code;
  }

  // 3) The message is essentially just the code: "482913" (allowing one
  //    separator), possibly with a trailing period.
  const trimmed = body.trim();
  const bare = /^(?:your code:?\s*)?(\d{3,4})[ -]?(\d{3,4})\.?$/i.exec(trimmed);
  if (bare && KEYWORD.test(trimmed)) {
    const code = digitsOnly(bare[0]);
    if (plausible(code)) return code;
  }
  const digitsOnlyMessage = /^\d{4,8}\.?$/.test(trimmed);
  if (digitsOnlyMessage) {
    const code = digitsOnly(trimmed);
    if (plausible(code)) return code;
  }

  return null;
}

/** Common OTP shapes to sanitise against double detection in HTML-ish text. */
export function detectOtpInEmail(text: string, html?: string | null): string | null {
  const fromText = detectOtpCode(text);
  if (fromText) return fromText;
  if (!html) return null;
  // Strip tags cheaply; the sanitized HTML is already safe, this is only
  // for code extraction.
  const flattened = html
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&#0?39;|&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&");
  return detectOtpCode(flattened);
}
