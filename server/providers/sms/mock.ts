import { allowMockProviders } from "@/config/env";
import type { AvailableNumber, ProvisionResult, SmsInbound, SmsProvider } from "@/server/providers/sms/types";
import { Errors } from "@/lib/errors";

/**
 * Development-only provider. The pool uses the NANP 555-01xx range and the
 * UK Ofcom 7700-900xxx drama range, which are reserved for fiction and can
 * never receive real traffic — exactly what a mock should model.
 *
 * `allowMockProviders()` is false in production, so this adapter can never
 * answer a real webhook or be selected there.
 */
export class MockSmsProvider implements SmsProvider {
  readonly key = "mock";

  private pool: (AvailableNumber & { providerNumberId: string })[] = [
    { e164: "+12025550143", country: "US", monthlyCents: 0, providerNumberId: "mock-us-1" },
    { e164: "+12025550188", country: "US", monthlyCents: 0, providerNumberId: "mock-us-2" },
    { e164: "+13105550199", country: "US", monthlyCents: 0, providerNumberId: "mock-us-3" },
    { e164: "+16505550133", country: "US", monthlyCents: 0, providerNumberId: "mock-us-4" },
    { e164: "+17185550123", country: "US", monthlyCents: 0, providerNumberId: "mock-us-5" },
    { e164: "+447700900101", country: "GB", monthlyCents: 0, providerNumberId: "mock-gb-1" },
    { e164: "+447700900123", country: "GB", monthlyCents: 0, providerNumberId: "mock-gb-2" },
    { e164: "+14165550144", country: "CA", monthlyCents: 0, providerNumberId: "mock-ca-1" },
    { e164: "+923001234567", country: "PK", monthlyCents: 0, providerNumberId: "mock-pk-1" },
  ];

  isConfigured(): boolean {
    return allowMockProviders();
  }

  private assertDev() {
    // In production a mocked pool request means operator misconfiguration —
    // surface it as an unavailable provider (503), never as fake inventory.
    if (!allowMockProviders()) throw Errors.providerDown("SMS");
  }

  async listAvailable(country?: string): Promise<AvailableNumber[]> {
    this.assertDev();
    return this.pool
      .filter((n) => !country || n.country === country.toUpperCase())
      .map(({ e164, country: c, monthlyCents }) => ({ e164, country: c, monthlyCents }));
  }

  async provision(e164: string): Promise<ProvisionResult> {
    this.assertDev();
    return { providerNumberId: this.pool.find((n) => n.e164 === e164)?.providerNumberId };
  }

  async release(): Promise<void> {
    this.assertDev();
  }

  async verify(): Promise<boolean> {
    return allowMockProviders();
  }

  async parseInbound(_req: Request, raw: string): Promise<SmsInbound> {
    this.assertDev();
    const json = JSON.parse(raw) as { to?: string; toNumber?: string; from?: string; fromNumber?: string; body?: string; text?: string; id?: string };
    const id = json.id || `sms-mock-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    return {
      provider: "mock",
      providerMessageId: id,
      idempotencyKey: `mock:${id}`,
      to: String(json.to || json.toNumber || "").trim(),
      from: String(json.from || json.fromNumber || "").trim(),
      body: String(json.body ?? json.text ?? ""),
      receivedAt: new Date(),
    };
  }

  async health() {
    return { ok: allowMockProviders(), detail: allowMockProviders() ? "mock pool (development only)" : "disabled in production" };
  }
}
