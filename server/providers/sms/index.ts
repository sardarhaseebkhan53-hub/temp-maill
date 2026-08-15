import { allowMockProviders, getEnv } from "@/config/env";
import { MockSmsProvider } from "@/server/providers/sms/mock";
import { TwilioSmsProvider } from "@/server/providers/sms/twilio";
import { TelnyxSmsProvider } from "@/server/providers/sms/telnyx";
import { VonageSmsProvider } from "@/server/providers/sms/vonage";
import type { SmsProvider } from "@/server/providers/sms/types";

const registry: Record<string, SmsProvider> = {
  mock: new MockSmsProvider(),
  twilio: new TwilioSmsProvider(),
  telnyx: new TelnyxSmsProvider(),
  vonage: new VonageSmsProvider(),
};

/**
 * Resolve an SMS provider by key (or the configured default). In production
 * the mock adapter can never serve traffic — it refuses every operation on
 * its own — and a real adapter without credentials fails closed as well, so
 * explicit keys always resolve to exactly the named adapter (a Twilio-signed
 * webhook is never verified by another carrier). A missing/unknown default
 * falls back to the first credentialed real adapter, and finally to the
 * self-refusing mock, so misconfiguration surfaces honestly instead of fake
 * data.
 */
export function getSmsProvider(key?: string): SmsProvider {
  const env = getEnv();
  const requested = (key || env.SMS_PROVIDER).toLowerCase();
  if (allowMockProviders()) {
    return registry[requested] ?? registry.mock!;
  }
  if (registry[requested]) return registry[requested]!;
  for (const candidate of ["telnyx", "twilio", "vonage"]) {
    if (registry[candidate]!.isConfigured()) return registry[candidate]!;
  }
  return registry.mock!;
}

export function listSmsProviders(): SmsProvider[] {
  return Object.values(registry).filter((p) => p.key !== "mock" || allowMockProviders());
}

export type { AvailableNumber, ProvisionResult, SmsInbound, SmsProvider } from "@/server/providers/sms/types";
export { normalizeE164, isE164 } from "@/server/providers/sms/types";
