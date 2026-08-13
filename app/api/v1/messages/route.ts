import { ok, fail } from "@/lib/http";
import { messageQuerySchema } from "@/lib/validation";
import { canAccessMailbox, getMailboxById } from "@/server/services/mailbox";
import { listMessages } from "@/server/services/messages";
import { requestContext, mailboxAuthToken } from "@/server/api/context";
import { Errors } from "@/lib/errors";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const parsed = messageQuerySchema.parse({
      mailboxId: url.searchParams.get("mailboxId") || undefined,
      cursor: url.searchParams.get("cursor") || undefined,
      limit: url.searchParams.get("limit") || 25,
      q: url.searchParams.get("q") || undefined,
      sort: url.searchParams.get("sort") || "newest",
      filter: url.searchParams.get("filter") || "all",
      sender: url.searchParams.get("sender") || undefined,
    });
    if (!parsed.mailboxId) throw Errors.validation("mailboxId is required");
    const box = await getMailboxById(parsed.mailboxId);
    const auth = await requestContext(req);
    const token = await mailboxAuthToken(req);
    if (!(await canAccessMailbox(box, { userId: auth.user?.id, guestBoxes: auth.guest.boxes, token }))) {
      throw Errors.forbidden();
    }
    const data = await listMessages({
      mailboxId: parsed.mailboxId,
      cursor: parsed.cursor,
      limit: parsed.limit,
      q: parsed.q,
      sort: parsed.sort,
      filter: parsed.filter,
      sender: parsed.sender,
    });
    return ok(data);
  } catch (e) {
    return fail(e, req);
  }
}
