import { ok, fail, readJson } from "@/lib/http";
import { canAccessMailbox, extendMailbox, getMailboxById, toPublicMailbox } from "@/server/services/mailbox";
import { requestContext, mailboxAuthToken } from "@/server/api/context";
import { Errors } from "@/lib/errors";

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    const body = await readJson<{ minutes?: number }>(req).catch(() => ({ minutes: 10 }));
    const box = await getMailboxById(id);
    const auth = await requestContext(req);
    const token = await mailboxAuthToken(req);
    if (!(await canAccessMailbox(box, { userId: auth.user?.id, guestBoxes: auth.guest.boxes, token }))) {
      throw Errors.forbidden();
    }
    const updated = await extendMailbox(id, body.minutes ?? 10, auth.user?.planKey ?? "FREE");
    return ok(toPublicMailbox(updated));
  } catch (e) {
    return fail(e, req);
  }
}
