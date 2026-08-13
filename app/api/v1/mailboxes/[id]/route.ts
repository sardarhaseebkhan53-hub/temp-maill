import { ok, fail } from "@/lib/http";
import { canAccessMailbox, deleteMailbox, getMailboxById, toPublicMailbox } from "@/server/services/mailbox";
import { requestContext, mailboxAuthToken } from "@/server/api/context";
import { Errors } from "@/lib/errors";

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    const box = await getMailboxById(id);
    const auth = await requestContext(req);
    const token = await mailboxAuthToken(req);
    if (!(await canAccessMailbox(box, { userId: auth.user?.id, guestBoxes: auth.guest.boxes, token }))) {
      throw Errors.forbidden();
    }
    return ok(toPublicMailbox(box));
  } catch (e) {
    return fail(e, req);
  }
}

export async function DELETE(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    const box = await getMailboxById(id);
    const auth = await requestContext(req);
    const token = await mailboxAuthToken(req);
    if (!(await canAccessMailbox(box, { userId: auth.user?.id, guestBoxes: auth.guest.boxes, token }))) {
      throw Errors.forbidden();
    }
    const purged = await deleteMailbox(id);
    return ok(toPublicMailbox(purged));
  } catch (e) {
    return fail(e, req);
  }
}
