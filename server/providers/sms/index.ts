import { allowMockProviders, getEnv } from "@/config/env";

export interface SmsInbound {
  provider: string;
  idempotencyKey: string;
  to: string;
  from: string;
  body: string;
  receivedAt: Date;
}

export interface AvailableNumber {
  e164: string;
  country: string;
  monthlyCents: number;
}

export interface SmsProvider {
  readonly key: string;
  listAvailable(country?: string): Promise<AvailableNumber[]>;
  provision(e164: string): Promise<void>;
  release(e164: string): Promise<void>;
  parseInbound(req: Request, raw: string): Promise<SmsInbound>;
  verify(req: Request, raw: string): Promise<boolean>;
  health(): Promise<{ ok: boolean; detail?: string }>;
}

class MockSmsProvider implements SmsProvider {
  readonly key = "mock";
  private pool: AvailableNumber[] = [
    { e164: "+15550101", country: "US", monthlyCents: 0 },
    { e164: "+15550102", country: "US", monthlyCents: 0 },
    { e164: "+447700900101", country: "GB", monthlyCents: 0 },
    { e164: "+923001234567", country: "PK", monthlyCents: 0 },
  ];

  async listAvailable(country?: string) {
    return this.pool.filter((n) => !country || n.country === country);
  }
  async provision() {}
  async release() {}
  async verify() {
    return allowMockProviders();
  }
  async parseInbound(_req: Request, raw: string): Promise<SmsInbound> {
    const json = JSON.parse(raw) as { to: string; from: string; body: string; id?: string };
    return {
      provider: "mock",
      idempotencyKey: json.id || `sms-mock-${Date.now()}`,
      to: json.to,
      from: json.from,
      body: json.body,
      receivedAt: new Date(),
    };
  }
  async health() {
    return { ok: allowMockProviders(), detail: "mock pool" };
  }
}

class TwilioSmsProvider implements SmsProvider {
  readonly key = "twilio";
  async listAvailable() {
    return [] as AvailableNumber[];
  }
  async provision() {
    const env = getEnv();
    if (!env.TWILIO_ACCOUNT_SID) throw new Error("Twilio is not configured");
  }
  async release() {}
  async verify(req: Request) {
    return Boolean(req.headers.get("x-twilio-signature"));
  }
  async parseInbound(_req: Request, raw: string): Promise<SmsInbound> {
    const params = new URLSearchParams(raw);
    const sid = params.get("MessageSid") || `twilio-${Date.now()}`;
    return {
      provider: "twilio",
      idempotencyKey: `twilio:${sid}`,
      to: params.get("To") || "",
      from: params.get("From") || "",
      body: params.get("Body") || "",
      receivedAt: new Date(),
    };
  }
  async health() {
    const env = getEnv();
    return { ok: Boolean(env.TWILIO_ACCOUNT_SID), detail: env.TWILIO_ACCOUNT_SID ? "configured" : "unconfigured" };
  }
}

class VonageSmsProvider implements SmsProvider {
  readonly key = "vonage";
  async listAvailable() {
    return [] as AvailableNumber[];
  }
  async provision() {
    const env = getEnv();
    if (!env.VONAGE_API_KEY) throw new Error("Vonage is not configured");
  }
  async release() {}
  async verify() {
    return Boolean(getEnv().VONAGE_API_KEY);
  }
  async parseInbound(_req: Request, raw: string): Promise<SmsInbound> {
    const json = JSON.parse(raw) as { messageId?: string; to?: string; msisdn?: string; text?: string };
    const id = json.messageId || `vonage-${Date.now()}`;
    return {
      provider: "vonage",
      idempotencyKey: `vonage:${id}`,
      to: json.to || "",
      from: json.msisdn || "",
      body: json.text || "",
      receivedAt: new Date(),
    };
  }
  async health() {
    const env = getEnv();
    return { ok: Boolean(env.VONAGE_API_KEY), detail: env.VONAGE_API_KEY ? "configured" : "unconfigured" };
  }
}

const registry: Record<string, SmsProvider> = {
  mock: new MockSmsProvider(),
  twilio: new TwilioSmsProvider(),
  vonage: new VonageSmsProvider(),
};

export function getSmsProvider(key?: string): SmsProvider {
  const env = getEnv();
  const requested = (key || env.SMS_PROVIDER).toLowerCase();
  if (requested === "mock" && !allowMockProviders()) return registry.twilio!;
  return registry[requested] ?? registry.mock!;
}

export function listSmsProviders() {
  return Object.values(registry).filter((p) => p.key !== "mock" || allowMockProviders());
}
