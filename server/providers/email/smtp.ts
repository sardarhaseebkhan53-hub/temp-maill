import { createHash } from "node:crypto";
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
    const sig = req.headers.get("x-haven-smtp-signature") || "";
    if (!sig) return false;
    const expected = hmacSha256Hex(env.AUTH_SECRET, rawBody);
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
      receivedAt?: string;
      attachments?: { filename?: string; mimeType?: string; contentBase64?: string }[];
    };
    const id =
      json.id || `raw-${createHash("sha256").update(rawBody).digest("hex").slice(0, 32)}`;
    return [
      {
        provider: "smtp",
        providerMessageId: id,
        idempotencyKey: `smtp:${id}`,
        fromAddress: (json.from || "").toLowerCase(),
        fromName: json.fromName,
        toAddresses: (json.to || []).map((recipient) => recipient.toLowerCase()),
        subject: json.subject || "(no subject)",
        textBody: json.text || "",
        htmlBody: json.html || "",
        headers: json.headers || {},
        attachments: (json.attachments || []).map((attachment, index) => ({
          filename: attachment.filename || `attachment-${index + 1}`,
          mimeType: attachment.mimeType || "application/octet-stream",
          content: Buffer.from(attachment.contentBase64 || "", "base64"),
        })),
        receivedAt: json.receivedAt ? new Date(json.receivedAt) : new Date(),
        rawSize: Buffer.byteLength(rawBody),
      },
    ];
  }

  async health() {
    const env = getEnv();
    const configured = Boolean(env.EMAIL_EXPECTED_MX);
    return {
      ok: configured,
      detail: configured
        ? "authenticated receiver callback and MX target configured"
        : "EMAIL_EXPECTED_MX is missing",
    };
  }
}
