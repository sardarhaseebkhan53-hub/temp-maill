import { getEnv } from "@/config/env";
import type { InboundEmail, InboundEmailProvider } from "@/server/providers/email/types";

export class PostmarkInboundProvider implements InboundEmailProvider {
  readonly key = "postmark";

  async verify(req: Request, _rawBody: string): Promise<boolean> {
    const env = getEnv();
    if (!env.POSTMARK_WEBHOOK_USER) return Boolean(env.POSTMARK_SERVER_TOKEN);
    const auth = req.headers.get("authorization") || "";
    if (!auth.startsWith("Basic ")) return false;
    const decoded = Buffer.from(auth.slice(6), "base64").toString("utf8");
    const [user, pass] = decoded.split(":");
    return user === env.POSTMARK_WEBHOOK_USER && pass === env.POSTMARK_WEBHOOK_PASS;
  }

  async parse(_req: Request, rawBody: string): Promise<InboundEmail[]> {
    const json = JSON.parse(rawBody) as {
      From?: string;
      FromName?: string;
      FromFull?: { Email?: string; Name?: string };
      To?: string;
      ToFull?: { Email: string }[];
      Subject?: string;
      TextBody?: string;
      HtmlBody?: string;
      MessageID?: string;
      Headers?: { Name: string; Value: string }[];
    };
    const toAddresses =
      json.ToFull?.map((t) => t.Email.toLowerCase()) ||
      (json.To || "")
        .split(",")
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean);
    const headers: Record<string, string> = {};
    for (const h of json.Headers || []) headers[h.Name] = h.Value;
    const id = json.MessageID || `pm-${Date.now()}`;
    return [
      {
        provider: "postmark",
        providerMessageId: id,
        idempotencyKey: `postmark:${id}`,
        fromAddress: (json.FromFull?.Email || json.From || "").toLowerCase(),
        fromName: json.FromFull?.Name || json.FromName,
        toAddresses,
        subject: json.Subject || "(no subject)",
        textBody: json.TextBody || "",
        htmlBody: json.HtmlBody || "",
        headers,
        attachments: [],
        receivedAt: new Date(),
        rawSize: rawBody.length,
      },
    ];
  }

  async health() {
    const env = getEnv();
    return { ok: Boolean(env.POSTMARK_SERVER_TOKEN), detail: env.POSTMARK_SERVER_TOKEN ? "configured" : "unconfigured" };
  }
}
