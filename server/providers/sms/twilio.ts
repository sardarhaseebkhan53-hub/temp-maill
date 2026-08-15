import { createHmac, timingSafeEqual } from "node:crypto";
import { getEnv } from "@/config/env";
import { Errors } from "@/lib/errors";
import type { AvailableNumber, ProvisionResult, SmsInbound, SmsProvider } from "@/server/providers/sms/types";

const API = "https://api.twilio.com/2010-04-01";

function authHeader(): string {
  const env = getEnv();
  return `Basic ${Buffer.from(`${env.TWILIO_ACCOUNT_SID}:${env.TWILIO_AUTH_TOKEN}`).toString("base64")}`;
}

function parseForm(raw: string): URLSearchParams {
  return new URLSearchParams(raw);
}

/**
 * Twilio request validation: X-Twilio-Signature is
 * base64(HMAC-SHA1(authToken, url + concat(sorted paramName+paramValue))).
 * https://www.twilio.com/docs/usage/webhooks/webhooks-security
 */
export function twilioSignature(url: string, params: Record<string, string> , authToken: string): string {
  const sorted = Object.keys(params)
    .sort()
    .map((k) => `${k}${params[k]}`)
    .join("");
  return createHmac("sha1", authToken).update(url + sorted).digest("base64");
}

async function twilioFetch(pathname: string, init: RequestInit = {}): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12_000);
  try {
    return await fetch(`${API}${pathname}`, {
      ...init,
      signal: controller.signal,
      headers: { authorization: authHeader(), ...(init.headers || {}) },
    });
  } finally {
    clearTimeout(timer);
  }
}

export class TwilioSmsProvider implements SmsProvider {
  readonly key = "twilio";

  isConfigured(): boolean {
    const env = getEnv();
    return Boolean(env.TWILIO_ACCOUNT_SID && env.TWILIO_AUTH_TOKEN);
  }

  private assertConfigured() {
    if (!this.isConfigured()) throw Errors.providerDown("Twilio SMS");
  }

  async verify(req: Request, raw: string): Promise<boolean> {
    const env = getEnv();
    if (!env.TWILIO_AUTH_TOKEN) return false;
    const signature = req.headers.get("x-twilio-signature");
    if (!signature) return false;
    const contentType = req.headers.get("content-type") || "";
    const params: Record<string, string> = {};
    if (contentType.includes("application/x-www-form-urlencoded") || raw.includes("=")) {
      for (const [k, v] of parseForm(raw)) params[k] = v;
    }
    // Twilio signs the absolute webhook URL as configured in the console.
    const url = new URL(req.url);
    const candidates = [url.toString(), `${url.origin}${url.pathname}`];
    for (const candidate of candidates) {
      const expected = twilioSignature(candidate, params, env.TWILIO_AUTH_TOKEN);
      try {
        if (timingSafeEqual(Buffer.from(expected), Buffer.from(signature))) return true;
      } catch {
        /* length mismatch */
      }
    }
    return false;
  }

  async listAvailable(country = "US"): Promise<AvailableNumber[]> {
    this.assertConfigured();
    const cc = country.toUpperCase() || "US";
    const res = await twilioFetch(
      `/Accounts/${getEnv().TWILIO_ACCOUNT_SID}/AvailablePhoneNumbers/${encodeURIComponent(cc)}/Local.json?SmsEnabled=true&PageSize=25`,
    );
    if (!res.ok) throw Errors.providerDown("Twilio SMS");
    const json = (await res.json()) as { available_phone_numbers?: { phone_number: string; iso_country: string }[] };
    return (json.available_phone_numbers || []).map((n) => ({
      e164: n.phone_number,
      country: (n.iso_country || cc).toUpperCase(),
      monthlyCents: 100,
    }));
  }

  async provision(e164: string): Promise<ProvisionResult> {
    this.assertConfigured();
    const env = getEnv();
    const body = new URLSearchParams({
      PhoneNumber: e164,
      SmsUrl: `${env.APP_URL}/api/webhooks/twilio/sms`,
      SmsMethod: "POST",
    });
    const res = await twilioFetch(`/Accounts/${env.TWILIO_ACCOUNT_SID}/IncomingPhoneNumbers.json`, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body,
    });
    if (!res.ok) throw Errors.providerDown("Twilio SMS");
    const json = (await res.json()) as { sid?: string };
    return { providerNumberId: json.sid };
  }

  async release(_e164: string, providerNumberId?: string): Promise<void> {
    if (!providerNumberId || !this.isConfigured()) return;
    const env = getEnv();
    await twilioFetch(`/Accounts/${env.TWILIO_ACCOUNT_SID}/IncomingPhoneNumbers/${providerNumberId}.json`, {
      method: "DELETE",
    }).catch(() => null);
  }

  async parseInbound(_req: Request, raw: string): Promise<SmsInbound> {
    const params = parseForm(raw);
    const sid = params.get("MessageSid") || params.get("SmsSid") || `twilio-${Date.now()}`;
    return {
      provider: "twilio",
      providerMessageId: sid,
      idempotencyKey: `twilio:${sid}`,
      to: params.get("To") || "",
      from: params.get("From") || "",
      body: params.get("Body") || "",
      receivedAt: new Date(),
    };
  }

  async health() {
    return { ok: this.isConfigured(), detail: this.isConfigured() ? "configured" : "missing TWILIO_ACCOUNT_SID/TWILIO_AUTH_TOKEN" };
  }
}
