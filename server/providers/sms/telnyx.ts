import { createPublicKey, verify as cryptoVerify } from "node:crypto";
import { getEnv } from "@/config/env";
import { Errors } from "@/lib/errors";
import type { AvailableNumber, ProvisionResult, SmsInbound, SmsProvider } from "@/server/providers/sms/types";

const API = "https://api.telnyx.com/v2";

/** Ed25519 SPKI prefix: wraps a raw 32-byte public key for node:crypto. */
function telnyxPublicKey(base64Key: string) {
  const raw = Buffer.from(base64Key, "base64");
  if (raw.length !== 32) return null;
  const spki = Buffer.concat([Buffer.from("302a300506032b6570032100", "hex"), raw]);
  return createPublicKey({ key: spki, format: "der", type: "spki" });
}

/**
 * Telnyx webhook validation (Ed25519):
 * signature = Ed25519(secret)(`${timestamp}|${rawBody}`)
 * headers: telnyx-signature-ed25519, telnyx-signature-ed25519-timestamp
 */
export function telnyxVerify(publicKeyBase64: string, timestamp: string, rawBody: string, signatureBase64: string): boolean {
  const key = telnyxPublicKey(publicKeyBase64);
  if (!key) return false;
  try {
    const payload = Buffer.from(`${timestamp}|${rawBody}`, "utf8");
    const signature = Buffer.from(signatureBase64, "base64");
    return cryptoVerify(null, payload, key, signature);
  } catch {
    return false;
  }
}

async function telnyxFetch(pathname: string, init: RequestInit = {}): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12_000);
  try {
    return await fetch(`${API}${pathname}`, {
      ...init,
      signal: controller.signal,
      headers: {
        authorization: `Bearer ${getEnv().TELNYX_API_KEY}`,
        "content-type": "application/json",
        ...(init.headers || {}),
      },
    });
  } finally {
    clearTimeout(timer);
  }
}

interface TelnyxEvent {
  data?: {
    id?: string;
    event_type?: string;
    occurred_at?: string;
    payload?: {
      id?: string;
      to?: { phone_number?: string }[];
      from?: { phone_number?: string };
      text?: string;
    };
  };
}

export class TelnyxSmsProvider implements SmsProvider {
  readonly key = "telnyx";

  isConfigured(): boolean {
    return Boolean(getEnv().TELNYX_API_KEY);
  }

  private assertConfigured() {
    if (!this.isConfigured()) throw Errors.providerDown("Telnyx SMS");
  }

  async verify(req: Request, raw: string): Promise<boolean> {
    const env = getEnv();
    if (!env.TELNYX_PUBLIC_KEY) return false;
    const signature = req.headers.get("telnyx-signature-ed25519");
    const timestamp = req.headers.get("telnyx-signature-ed25519-timestamp");
    if (!signature || !timestamp) return false;
    // Reject webhooks older than five minutes to bound replay windows.
    const age = Math.abs(Date.now() / 1000 - Number(timestamp));
    if (!Number.isFinite(age) || age > 300) return false;
    return telnyxVerify(env.TELNYX_PUBLIC_KEY, timestamp, raw, signature);
  }

  async listAvailable(country = "US"): Promise<AvailableNumber[]> {
    this.assertConfigured();
    const cc = country.toUpperCase() || "US";
    const res = await telnyxFetch(
      `/available_phone_numbers?filter[country_code]=${encodeURIComponent(cc)}&filter[features][]=sms&filter[limit]=25`,
    );
    if (!res.ok) throw Errors.providerDown("Telnyx SMS");
    const json = (await res.json()) as { data?: { phone_number: string; region_information?: { region_type?: string }[] }[] };
    return (json.data || []).map((n) => ({ e164: n.phone_number, country: cc, monthlyCents: 100 }));
  }

  async provision(e164: string): Promise<ProvisionResult> {
    this.assertConfigured();
    const res = await telnyxFetch("/number_orders", {
      method: "POST",
      body: JSON.stringify({ phone_numbers: [{ phone_number: e164 }] }),
    });
    if (!res.ok) throw Errors.providerDown("Telnyx SMS");
    const json = (await res.json()) as { data?: { id?: string } };
    return { providerNumberId: json.data?.id };
  }

  async release(e164: string, providerNumberId?: string): Promise<void> {
    if (!this.isConfigured()) return;
    let id = providerNumberId;
    if (!id) {
      const res = await telnyxFetch(`/phone_numbers?filter[phone_number]=${encodeURIComponent(e164)}`).catch(() => null);
      const json = res && res.ok ? ((await res.json()) as { data?: { id?: string }[] }) : null;
      id = json?.data?.[0]?.id;
    }
    if (!id) return;
    await telnyxFetch(`/phone_numbers/${id}`, { method: "DELETE" }).catch(() => null);
  }

  async parseInbound(_req: Request, raw: string): Promise<SmsInbound> {
    const event = JSON.parse(raw) as TelnyxEvent;
    const payload = event.data?.payload;
    const id = event.data?.id || payload?.id || `telnyx-${Date.now()}`;
    return {
      provider: "telnyx",
      providerMessageId: id,
      idempotencyKey: `telnyx:${id}`,
      to: payload?.to?.[0]?.phone_number || "",
      from: payload?.from?.phone_number || "",
      body: payload?.text || "",
      receivedAt: event.data?.occurred_at ? new Date(event.data.occurred_at) : new Date(),
    };
  }

  async health() {
    return { ok: this.isConfigured(), detail: this.isConfigured() ? "configured" : "missing TELNYX_API_KEY" };
  }
}
