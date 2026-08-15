import { randomUUID } from "node:crypto";
import { getEnv } from "@/config/env";
import { fail, ok } from "@/lib/http";
import { Errors } from "@/lib/errors";
import { canAccessMailbox, getMailboxById } from "@/server/services/mailbox";
import { requestContext, mailboxAuthToken } from "@/server/api/context";
import { ingestInbound } from "@/server/services/inbound";

/**
 * Explicit local smoke test for the mock adapter. It is unavailable in
 * production and is never presented as internet mail delivery.
 */
export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const env = getEnv();
    if (env.NODE_ENV === "production" || env.EMAIL_INBOUND_PROVIDER !== "mock") {
      throw Errors.notFound("Test delivery endpoint");
    }

    const { id } = await ctx.params;
    const mailbox = await getMailboxById(id);
    const auth = await requestContext(req);
    const token = await mailboxAuthToken(req);
    if (!(await canAccessMailbox(mailbox, {
      userId: auth.user?.id,
      guestBoxes: auth.guest.boxes,
      token,
    }))) {
      throw Errors.forbidden();
    }

    const messageId = randomUUID();
    const result = await ingestInbound({
      provider: "mock",
      providerMessageId: messageId,
      idempotencyKey: `local-test:${messageId}`,
      fromAddress: "delivery-test@haven.local",
      fromName: "Haven delivery test",
      toAddresses: [mailbox.address],
      subject: "Your local inbox is working",
      textBody:
        "This is an explicit development-mode test. Local storage and live inbox updates are working. Public internet email still requires a verified domain, MX routing, and a production inbound provider.",
      htmlBody: "",
      headers: { "X-Haven-Local-Test": "true" },
      attachments: [],
      receivedAt: new Date(),
      rawSize: 230,
    });
    return ok(result, { status: 201 });
  } catch (error) {
    return fail(error, req);
  }
}
