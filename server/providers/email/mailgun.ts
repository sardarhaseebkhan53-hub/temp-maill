import { createHmac, timingSafeEqual } from "node:crypto";
import { getEnv } from "@/config/env";
import type { InboundEmail, InboundEmailProvider } from "@/server/providers/email/types";

function parseForm(raw: string): Record<string, string> {
  const params = new URLSearchParams(raw);
  const out: Record<string, string> = {};
  for (const [k, v] of params.entries()) out[k] = v;
  return out;
}

export class MailgunInboundProvider implements InboundEmailProvider {
  readonly key = "mailgun";

  async verify(_req: Request, rawBody: string): Promise<boolean> {
    const env = getEnv();
    const key = env.MAILGUN_WEBHOOK_SIGNING_KEY || env.MAILGUN_API_KEY;
    if (!key) return false;
    const fields = rawBody.includes("=") ? parseForm(rawBody) : (JSON.parse(rawBody) as Record<string, string>);
    const timestamp = fields.timestamp || "";
    const token = fields.token || "";
    const signature = fields.signature || "";
    if (!timestamp || !token || !signature) return false;
    const age = Math.abs(Date.now() / 1000 - Number(timestamp));
    if (!Number.isFinite(age) || age > 300) return false;
    const digest = createHmac("sha256", key).update(timestamp + token).digest("hex");
    try {
      return timingSafeEqual(Buffer.from(digest), Buffer.from(signature));
    } catch {
      return false;
    }
  }

  async parse(_req: Request, rawBody: string): Promise<InboundEmail[]> {
    const fields = rawBody.includes("from=") || rawBody.includes("sender=")
      ? parseForm(rawBody)
      : (JSON.parse(rawBody) as Record<string, string>);
    const from = fields.from || fields.sender || "";
    const to = fields.recipient || fields.to || "";
    const subject = fields.subject || "(no subject)";
    const html = fields["body-html"] || fields.html || "";
    const text = fields["body-plain"] || fields.text || "";
    const id = fields["Message-Id"] || fields["message-id"] || `mg-${Date.now()}`;
    return [
      {
        provider: "mailgun",
        providerMessageId: id,
        idempotencyKey: `mailgun:${id}`,
        fromAddress: extractAddress(from),
        fromName: extractName(from),
        toAddresses: to.split(",").map((s) => extractAddress(s.trim())).filter(Boolean),
        subject,
        textBody: text,
        htmlBody: html,
        headers: {},
        attachments: [],
        receivedAt: new Date(),
        rawSize: rawBody.length,
      },
    ];
  }

  async health() {
    const env = getEnv();
    return { ok: Boolean(env.MAILGUN_API_KEY), detail: env.MAILGUN_DOMAIN || "unconfigured" };
  }
}

function extractAddress(raw: string): string {
  const m = raw.match(/<([^>]+)>/);
  return (m?.[1] || raw).trim().toLowerCase();
}

function extractName(raw: string): string | undefined {
  const m = raw.match(/^\s*"?([^"<]+)"?\s*</);
  return m?.[1]?.trim();
}
