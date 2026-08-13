import { ok, fail } from "@/lib/http";
import { canAccessMailbox, getMailboxById } from "@/server/services/mailbox";
import { deliverDemoMessage } from "@/server/services/inbound";
import { requestContext, mailboxAuthToken } from "@/server/api/context";
import { isEnabled } from "@/lib/flags";
import { allowMockProviders } from "@/config/env";
import { Errors } from "@/lib/errors";

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    if (!(await isEnabled("demo_inject", true)) || !allowMockProviders()) {
      throw Errors.forbidden();
    }
    const { id } = await ctx.params;
    const box = await getMailboxById(id);
    const auth = await requestContext(req);
    const token = await mailboxAuthToken(req);
    if (!(await canAccessMailbox(box, { userId: auth.user?.id, guestBoxes: auth.guest.boxes, token }))) {
      throw Errors.forbidden();
    }
    const result = await deliverDemoMessage(box.address);
    return ok(result);
  } catch (e) {
    return fail(e, req);
  }
}
