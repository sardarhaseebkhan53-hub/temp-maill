/**
 * Provider-neutral SMS types. Every adapter (mock, twilio, telnyx, vonage)
 * normalises its inbound webhook into `SmsInbound`, and inventory flows use
 * `AvailableNumber` / `ProvisionResult` so the service layer never learns
 * which carrier owns the number.
 */

export interface SmsInbound {
  provider: string;
  /** The provider's own message id (e.g. Twilio "SM…"), when given. */
  providerMessageId?: string;
  /** Provider-unique webhook id; the service scopes it per number for de-dup. */
  idempotencyKey: string;
  to: string;
  from: string;
  body: string;
  receivedAt: Date;
}

export interface AvailableNumber {
  /** E.164 ("+14155552671"). */
  e164: string;
  /** Two-letter ISO country ("US"). */
  country: string;
  monthlyCents: number;
}

export interface ProvisionResult {
  /** The provider's identifier for the purchased/assigned number resource. */
  providerNumberId?: string;
}

export interface SmsProvider {
  readonly key: string;
  /** Synchronous credential check, used to avoid misconfigured fallbacks. */
  isConfigured(): boolean;
  /** Real, provisionable numbers offered by the carrier for `country`. */
  listAvailable(country?: string): Promise<AvailableNumber[]>;
  /** Acquire/assign `e164` with the carrier; no-op for the mock provider. */
  provision(e164: string): Promise<ProvisionResult>;
  /** Release the number back to the carrier. */
  release(e164: string, providerNumberId?: string): Promise<void>;
  /** Cryptographic webhook authenticity check — never skip in production. */
  verify(req: Request, raw: string): Promise<boolean>;
  /** Normalise the provider's webhook payload into `SmsInbound`. */
  parseInbound(req: Request, raw: string): Promise<SmsInbound>;
  health(): Promise<{ ok: boolean; detail?: string }>;
}

/** Normalise to E.164-ish: leading "+" plus 8–15 digits, or null. */
export function normalizeE164(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const digits = String(raw).replace(/[^\d+]/g, "");
  const normalized = digits.startsWith("+") ? digits : `+${digits.replace(/\+/g, "")}`;
  return /^\+\d{8,15}$/.test(normalized) ? normalized : null;
}

export function isE164(raw: string | null | undefined): boolean {
  return normalizeE164(raw) !== null;
}
