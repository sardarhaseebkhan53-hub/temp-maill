import { getEnv } from "@/config/env";
import type { InboundEmail, InboundEmailProvider } from "@/server/providers/email/types";
import { hmacSha256Hex, timingSafeEqualStr } from "@/lib/crypto";

/**
 * Direct SMTP receiver adapter for VPS deployments.
 * The SMTP daemon posts normalized JSON to /api/v1/inbound/smtp with an HMAC header.
 */
export class SmtpInboundProvider implements InboundEmailProvider {
  readonly key = "smtp";

  async verify(req: Request, rawBody: string): Promise<boolean> {
    const env = getEnv();
    const secret = env.AUTH_SECRET;
    const sig = req.headers.get("x-haven-smtp-signature") || "";
    if (!sig) return false;
    const expected = hmacSha256Hex(secret, rawBody);
    return timingSafeEqualStr(sig, expected);
  }

  async parse(_req: Request, rawBody: string): Promise<InboundEmail[]> {
    const json = JSON.parse(rawBody) as {
      id?: string;
      from?: string;
      fromName?: string;
      to?: string[];
      subject?: string;
      text?: string;
      html?: string;
      headers?: Record<string, string>;
    };
    const id = json.id || `smtp-${Date.now()}`;
    return [
      {
        provider: "smtp",
        providerMessageId: id,
        idempotencyKey: `smtp:${id}`,
        fromAddress: (json.from || "").toLowerCase(),
        fromName: json.fromName,
        toAddresses: (json.to || []).map((t) => t.toLowerCase()),
        subject: json.subject || "(no subject)",
        textBody: json.text || "",
        htmlBody: json.html || "",
        headers: json.headers || {},
        attachments: [],
        receivedAt: new Date(),
        rawSize: rawBody.length,
      },
    ];
  }

  async health() {
    const env = getEnv();
    return { ok: Boolean(env.SMTP_HOST || true), detail: "HMAC webhook adapter" };
  }
}
