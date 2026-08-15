import { createHash } from "node:crypto";
import { getEnv } from "@/config/env";
import { timingSafeEqualStr } from "@/lib/crypto";
import type { InboundEmail, InboundEmailProvider } from "@/server/providers/email/types";

export class PostmarkInboundProvider implements InboundEmailProvider {
  readonly key = "postmark";

  async verify(req: Request, _rawBody: string): Promise<boolean> {
    const env = getEnv();
    if (!env.POSTMARK_WEBHOOK_USER || !env.POSTMARK_WEBHOOK_PASS) return false;
    const auth = req.headers.get("authorization") || "";
    if (!auth.startsWith("Basic ")) return false;
    let decoded = "";
    try {
      decoded = Buffer.from(auth.slice(6), "base64").toString("utf8");
    } catch {
      return false;
    }
    const separator = decoded.indexOf(":");
    if (separator < 0) return false;
    const user = decoded.slice(0, separator);
    const pass = decoded.slice(separator + 1);
    return (
      timingSafeEqualStr(user, env.POSTMARK_WEBHOOK_USER) &&
      timingSafeEqualStr(pass, env.POSTMARK_WEBHOOK_PASS)
    );
  }

  async parse(_req: Request, rawBody: string): Promise<InboundEmail[]> {
    const json = JSON.parse(rawBody) as {
      From?: string;
      FromName?: string;
      FromFull?: { Email?: string; Name?: string };
      To?: string;
      ToFull?: { Email: string }[];
      CcFull?: { Email: string }[];
      Subject?: string;
      TextBody?: string;
      HtmlBody?: string;
      MessageID?: string;
      Headers?: { Name: string; Value: string }[];
      Attachments?: {
        Name?: string;
        Content?: string;
        ContentType?: string;
      }[];
    };
    const toAddresses = [
      ...(json.ToFull?.map((recipient) => recipient.Email.toLowerCase()) || []),
      ...(json.CcFull?.map((recipient) => recipient.Email.toLowerCase()) || []),
    ];
    if (toAddresses.length === 0) {
      toAddresses.push(
        ...(json.To || "")
          .split(",")
          .map(extractAddress)
          .filter(Boolean),
      );
    }
    const headers: Record<string, string> = {};
    for (const header of json.Headers || []) headers[header.Name] = header.Value;
    const id =
      json.MessageID ||
      headers["Message-ID"] ||
      `raw-${createHash("sha256").update(rawBody).digest("hex").slice(0, 32)}`;
    return [
      {
        provider: "postmark",
        providerMessageId: id,
        idempotencyKey: `postmark:${id}`,
        fromAddress: (json.FromFull?.Email || extractAddress(json.From || "")).toLowerCase(),
        fromName: json.FromFull?.Name || json.FromName,
        toAddresses: [...new Set(toAddresses)],
        subject: json.Subject || "(no subject)",
        textBody: json.TextBody || "",
        htmlBody: json.HtmlBody || "",
        headers,
        attachments: (json.Attachments || []).map((attachment, index) => ({
          filename: attachment.Name || `attachment-${index + 1}`,
          mimeType: attachment.ContentType || "application/octet-stream",
          content: Buffer.from(attachment.Content || "", "base64"),
        })),
        receivedAt: new Date(),
        rawSize: Buffer.byteLength(rawBody),
      },
    ];
  }

  async health() {
    const env = getEnv();
    const authenticated = Boolean(env.POSTMARK_WEBHOOK_USER && env.POSTMARK_WEBHOOK_PASS);
    return {
      ok: authenticated,
      detail: authenticated ? "authenticated inbound webhook" : "webhook basic auth missing",
    };
  }
}

function extractAddress(raw: string): string {
  const match = raw.match(/<([^>]+)>/);
  return (match?.[1] || raw).trim().toLowerCase();
}
