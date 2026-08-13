import { ok, fail, readJson } from "@/lib/http";
import { prisma } from "@/lib/db";
import { canAccessMailbox, getMailboxById } from "@/server/services/mailbox";
import { requestContext } from "@/server/api/context";
import { Errors } from "@/lib/errors";

export async function POST(req: Request) {
  try {
    const body = await readJson<{ mailboxId: string; token?: string; pattern: string; kind?: string }>(req);
    const box = await getMailboxById(body.mailboxId);
    const auth = await requestContext(req);
    if (!(await canAccessMailbox(box, { userId: auth.user?.id, guestBoxes: auth.guest.boxes, token: body.token }))) {
      throw Errors.forbidden();
    }
    const row = await prisma.blockedSender.create({
      data: {
        userId: auth.user?.id,
        mailboxId: box.id,
        pattern: body.pattern,
        kind: body.kind || "ADDRESS",
      },
    });
    return ok({ id: row.id });
  } catch (e) {
    return fail(e, req);
  }
}
