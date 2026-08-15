import type { InboundEmail, InboundEmailProvider } from "@/server/providers/email/types";
import { allowMockProviders } from "@/config/env";
import { Errors } from "@/lib/errors";

export class MockInboundEmailProvider implements InboundEmailProvider {
  readonly key = "mock";

  async verify(_req: Request, _rawBody: string): Promise<boolean> {
    return allowMockProviders();
  }

  async parse(req: Request, rawBody: string): Promise<InboundEmail[]> {
    if (!allowMockProviders()) throw Errors.forbidden();
    const json = rawBody ? (JSON.parse(rawBody) as Record<string, unknown>) : await req.json();
    const to = String(json.to || json.toAddress || "").trim();
    const fromAddress = String(json.from || json.fromAddress || "").trim();
    if (!to) throw Errors.validation("Missing recipient.");
    if (!fromAddress) throw Errors.validation("Missing sender.");

    const now = Date.now();
    return [
      {
        provider: "mock",
        providerMessageId: String(json.id || `mock-${now}`),
        idempotencyKey: String(json.idempotencyKey || json.id || `mock-${now}-${to}`),
        fromAddress,
        fromName: json.fromName ? String(json.fromName) : undefined,
        toAddresses: [to],
        subject: String(json.subject || ""),
        textBody: String(json.text || json.textBody || ""),
        htmlBody: String(json.html || json.htmlBody || ""),
        headers: (json.headers as Record<string, string>) || {},
        attachments: [],
        receivedAt: new Date(),
        rawSize: rawBody.length,
      },
    ];
  }

  async health() {
    const enabled = allowMockProviders();
    return { ok: enabled, detail: enabled ? "development test adapter" : "disabled in production" };
  }
}
