import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { getEnv } from "@/config/env";
import { isMeaningfulSecret } from "@/lib/secrets";
import type {
  InboundAttachment,
  InboundEmail,
  InboundEmailProvider,
} from "@/server/providers/email/types";

interface ParsedMailgunBody {
  fields: Record<string, string>;
  attachments: InboundAttachment[];
}

function parseUrlEncoded(raw: string): Record<string, string> {
  const params = new URLSearchParams(raw);
  const out: Record<string, string> = {};
  for (const [key, value] of params.entries()) out[key] = value;
  return out;
}

function parseJson(raw: string): Record<string, string> {
  try {
    const value = JSON.parse(raw) as Record<string, unknown>;
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, typeof item === "string" ? item : JSON.stringify(item)]),
    );
  } catch {
    return {};
  }
}

async function parseRequest(req: Request, raw: string): Promise<ParsedMailgunBody> {
  const contentType = req.headers.get("content-type") || "";
  if (contentType.includes("multipart/form-data")) {
    const form = await req.clone().formData();
    const fields: Record<string, string> = {};
    const attachments: InboundAttachment[] = [];
    for (const [key, value] of form.entries()) {
      if (typeof value === "string") {
        fields[key] = value;
        continue;
      }
      if (key.startsWith("attachment-")) {
        attachments.push({
          filename: value.name || key,
          mimeType: value.type || "application/octet-stream",
          content: Buffer.from(await value.arrayBuffer()),
        });
      }
    }
    return { fields, attachments };
  }
  if (contentType.includes("application/json")) {
    return { fields: parseJson(raw), attachments: [] };
  }
  return { fields: parseUrlEncoded(raw), attachments: [] };
}

function safeEqualHex(expected: string, actual: string): boolean {
  if (!/^[a-f0-9]+$/i.test(actual) || expected.length !== actual.length) return false;
  try {
    return timingSafeEqual(Buffer.from(expected, "hex"), Buffer.from(actual, "hex"));
  } catch {
    return false;
  }
}

export class MailgunInboundProvider implements InboundEmailProvider {
  readonly key = "mailgun";

  async verify(req: Request, rawBody: string): Promise<boolean> {
    const env = getEnv();
    // Mailgun's webhook signing key is distinct from its private API key.
    // Never substitute the API key here: doing so both rejects legitimate
    // signatures and gives the wrong credential authority over inbound mail.
    const key = env.MAILGUN_WEBHOOK_SIGNING_KEY;
    if (!key) return false;
    const { fields } = await parseRequest(req, rawBody);
    const timestamp = fields.timestamp || "";
    const token = fields.token || "";
    const signature = fields.signature || "";
    if (!timestamp || !token || !signature) return false;
    const age = Math.abs(Date.now() / 1000 - Number(timestamp));
    if (!Number.isFinite(age) || age > 300) return false;
    const digest = createHmac("sha256", key).update(timestamp + token).digest("hex");
    return safeEqualHex(digest, signature);
  }

  async parse(req: Request, rawBody: string): Promise<InboundEmail[]> {
    const { fields, attachments } = await parseRequest(req, rawBody);
    const from = fields.from || fields.sender || "";
    const to = fields.recipient || fields.to || "";
    const subject = fields.subject || "(no subject)";
    const html = fields["body-html"] || fields.html || "";
    const text = fields["body-plain"] || fields["stripped-text"] || fields.text || "";
    const headers = parseHeaders(fields["message-headers"]);
    const id =
      fields["Message-Id"] ||
      fields["message-id"] ||
      headers["Message-Id"] ||
      `raw-${createHash("sha256").update(rawBody).digest("hex").slice(0, 32)}`;
    return [
      {
        provider: "mailgun",
        providerMessageId: id,
        idempotencyKey: `mailgun:${id}`,
        fromAddress: extractAddress(from),
        fromName: extractName(from),
        toAddresses: to
          .split(",")
          .map((address) => extractAddress(address.trim()))
          .filter(Boolean),
        subject,
        textBody: text,
        htmlBody: html,
        headers,
        attachments,
        receivedAt: new Date(),
        rawSize: Number(req.headers.get("content-length")) || Buffer.byteLength(rawBody),
      },
    ];
  }

  async health() {
    const env = getEnv();
    const configured = isMeaningfulSecret(env.MAILGUN_WEBHOOK_SIGNING_KEY);
    return {
      ok: configured,
      detail: configured
        ? `${env.MAILGUN_DOMAIN || "inbound domain"} · signed webhook`
        : "webhook signing key missing",
    };
  }
}

function parseHeaders(raw?: string): Record<string, string> {
  if (!raw) return {};
  try {
    const pairs = JSON.parse(raw) as [string, string][];
    return Object.fromEntries(pairs.filter((pair) => Array.isArray(pair) && pair.length >= 2));
  } catch {
    return {};
  }
}

function extractAddress(raw: string): string {
  const match = raw.match(/<([^>]+)>/);
  return (match?.[1] || raw).trim().toLowerCase();
}

function extractName(raw: string): string | undefined {
  const match = raw.match(/^\s*"?([^"<]+)"?\s*</);
  return match?.[1]?.trim();
}
