import { ok, fail } from "@/lib/http";
import { assertSmsNumberAccess, getSmsNumber, releaseNumber } from "@/server/services/sms";
import { requestContext, mailboxAuthToken } from "@/server/api/context";

/** Expire the assignment immediately and quarantine the number. */
export async function DELETE(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    const auth = await requestContext(req);
    const token = await mailboxAuthToken(req);
    const number = await getSmsNumber(id);
    assertSmsNumberAccess(number, { userId: auth.user?.id, token });

    const released = await releaseNumber(id);
    return ok({ released: true, status: released.status });
  } catch (e) {
    return fail(e, req);
  }
}
