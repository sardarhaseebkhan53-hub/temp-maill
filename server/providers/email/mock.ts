import type { InboundEmail, InboundEmailProvider } from "@/server/providers/email/types";
import { allowMockProviders } from "@/config/env";
import { Errors } from "@/lib/errors";

export class MockInboundEmailProvider implements InboundEmailProvider {
  readonly key = "mock";

  async verify(_req: Request, _rawBody: string): Promise<boolean> {
    if (!allowMockProviders()) return false;
    return true;
  }

  async parse(req: Request, rawBody: string): Promise<InboundEmail[]> {
    if (!allowMockProviders()) throw Errors.forbidden();
    const json = rawBody ? (JSON.parse(rawBody) as Record<string, unknown>) : await req.json();
    const to = String(json.to || json.toAddress || "");
    if (!to) throw Errors.validation("Missing recipient.");
    return [
      {
        provider: "mock",
        providerMessageId: String(json.id || `mock-${Date.now()}`),
        idempotencyKey: String(json.idempotencyKey || json.id || `mock-${Date.now()}-${to}`),
        fromAddress: String(json.from || json.fromAddress || "demo@example.com"),
        fromName: json.fromName ? String(json.fromName) : "Demo Sender",
        toAddresses: [to],
        subject: String(json.subject || "Welcome to your Haven inbox"),
        textBody: String(json.text || json.textBody || "This is a test message delivered through the inbound pipeline."),
        htmlBody: String(
          json.html ||
            json.htmlBody ||
            "<p>This is a <strong>test message</strong> delivered through the inbound pipeline.</p>",
        ),
        headers: (json.headers as Record<string, string>) || {},
        attachments: [],
        receivedAt: new Date(),
        rawSize: rawBody.length,
      },
    ];
  }

  async health() {
    return { ok: true, detail: allowMockProviders() ? "mock ready" : "disabled in production" };
  }
}
