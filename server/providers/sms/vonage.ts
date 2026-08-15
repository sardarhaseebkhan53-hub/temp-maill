import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { getEnv } from "@/config/env";
import { Errors } from "@/lib/errors";
import type { AvailableNumber, ProvisionResult, SmsInbound, SmsProvider } from "@/server/providers/sms/types";

const API = "https://rest.nexmo.com";

/**
 * Vonage signed callbacks: `sig` = md5 of the concatenation of
 * "&key=value" over sorted params (sig excluded) plus the signature secret,
 * using the shared secret as the signature secret by default.
 * https://developer.vonage.com/en/messages/concepts/signed-webhooks
 */
export function vonageSignature(params: Record<string, string>, secret: string, algo: "md5" | "sha256_hmac" = "sha256_hmac"): string {
  const parts = Object.keys(params)
    .filter((k) => k !== "sig")
    .sort()
    .map((k) => `&${k}=${String(params[k]).replace(/[&=]/g, "_")}`)
    .join("");
  if (algo === "md5") return createHash("md5").update(parts + secret).digest("hex");
  return createHmac("sha256", secret).update(parts).digest("hex");
}

async function vonageFetch(pathname: string, init: RequestInit = {}): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12_000);
  try {
    return await fetch(`${API}${pathname}`, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

export class VonageSmsProvider implements SmsProvider {
  readonly key = "vonage";

  isConfigured(): boolean {
    const env = getEnv();
    return Boolean(env.VONAGE_API_KEY && env.VONAGE_API_SECRET);
  }

  private assertConfigured() {
    if (!this.isConfigured()) throw Errors.providerDown("Vonage SMS");
  }

  private extractParams(req: Request, raw: string): Record<string, string> {
    const contentType = req.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      try {
        const json = JSON.parse(raw) as Record<string, unknown>;
        return Object.fromEntries(Object.entries(json).map(([k, v]) => [k, String(v)]));
      } catch {
        return {};
      }
    }
    const params: Record<string, string> = {};
    for (const [k, v] of new URLSearchParams(raw)) params[k] = v;
    const url = new URL(req.url);
    for (const [k, v] of url.searchParams) if (!(k in params)) params[k] = v;
    return params;
  }

  async verify(req: Request, raw: string): Promise<boolean> {
    const env = getEnv();
    const params = this.extractParams(req, raw);
    const sig = params.sig;
    if (!sig || !env.VONAGE_API_SECRET) return false;
    for (const algo of ["sha256_hmac", "md5"] as const) {
      const expected = vonageSignature(params, env.VONAGE_API_SECRET, algo);
      try {
        if (timingSafeEqual(Buffer.from(expected), Buffer.from(sig))) return true;
      } catch {
        /* length mismatch */
      }
    }
    return false;
  }

  async listAvailable(country = "US"): Promise<AvailableNumber[]> {
    this.assertConfigured();
    const env = getEnv();
    const cc = country.toUpperCase() || "US";
    const res = await vonageFetch(
      `/number/search?api_key=${encodeURIComponent(env.VONAGE_API_KEY)}&api_secret=${encodeURIComponent(env.VONAGE_API_SECRET)}&country=${encodeURIComponent(cc)}&features=SMS&size=25`,
    );
    if (!res.ok) throw Errors.providerDown("Vonage SMS");
    const json = (await res.json()) as { numbers?: { msisdn: string; country: string; cost?: string }[] };
    return (json.numbers || []).map((n) => ({
      e164: `+${n.msisdn}`,
      country: (n.country || cc).toUpperCase(),
      monthlyCents: Math.round(Number(n.cost || "1") * 100),
    }));
  }

  async provision(e164: string): Promise<ProvisionResult> {
    this.assertConfigured();
    const env = getEnv();
    const res = await vonageFetch("/number/buy", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        api_key: env.VONAGE_API_KEY,
        api_secret: env.VONAGE_API_SECRET,
        country: e164.startsWith("+1") ? "US" : e164.startsWith("+44") ? "GB" : "US",
        msisdn: e164.replace(/^\+/, ""),
      }),
    });
    if (!res.ok) throw Errors.providerDown("Vonage SMS");
    return { providerNumberId: e164 };
  }

  async release(e164: string): Promise<void> {
    if (!this.isConfigured()) return;
    const env = getEnv();
    await vonageFetch("/number/cancel", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        api_key: env.VONAGE_API_KEY,
        api_secret: env.VONAGE_API_SECRET,
        country: e164.startsWith("+1") ? "US" : e164.startsWith("+44") ? "GB" : "US",
        msisdn: e164.replace(/^\+/, ""),
      }),
    }).catch(() => null);
  }

  async parseInbound(req: Request, raw: string): Promise<SmsInbound> {
    // Vonage inbound fields: `to` is our virtual number, `msisdn` the sender.
    const params = this.extractParams(req, raw);
    const id = params.messageId || params["message-id"] || `vonage-${Date.now()}`;
    const withPlus = (v: string | undefined) => (v ? (v.startsWith("+") ? v : `+${v}`) : "");
    return {
      provider: "vonage",
      providerMessageId: id,
      idempotencyKey: `vonage:${id}`,
      to: withPlus(params.to),
      from: withPlus(params.msisdn || params.from),
      body: params.text || params.body || "",
      receivedAt: new Date(),
    };
  }

  async health() {
    return { ok: this.isConfigured(), detail: this.isConfigured() ? "configured" : "missing VONAGE_API_KEY/VONAGE_API_SECRET" };
  }
}
