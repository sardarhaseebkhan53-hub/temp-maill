import { ok, fail, readJson } from "@/lib/http";
import { prisma } from "@/lib/db";
import { canAccessMailbox, getMailboxById } from "@/server/services/mailbox";
import { deleteMessage, getMessage, markRead } from "@/server/services/messages";
import { requestContext, mailboxAuthToken } from "@/server/api/context";
import { Errors } from "@/lib/errors";

async function authorize(req: Request, messageId: string) {
  const msg = await prisma.emailMessage.findUnique({ where: { id: messageId } });
  if (!msg) throw Errors.notFound("Message");
  const box = await getMailboxById(msg.mailboxId);
  const auth = await requestContext(req);
  const token = await mailboxAuthToken(req);
  if (!(await canAccessMailbox(box, { userId: auth.user?.id, guestBoxes: auth.guest.boxes, token }))) {
    throw Errors.forbidden();
  }
  return { msg, box };
}

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    const { box } = await authorize(req, id);
    const detail = await getMessage(id, box.id);
    await markRead(id, true);
    return ok(detail);
  } catch (e) {
    return fail(e, req);
  }
}

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    await authorize(req, id);
    const body = await readJson<{ read?: boolean }>(req);
    await markRead(id, body.read ?? true);
    return ok({ id, read: body.read ?? true });
  } catch (e) {
    return fail(e, req);
  }
}

export async function DELETE(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    await authorize(req, id);
    await deleteMessage(id);
    return ok({ id, deleted: true });
  } catch (e) {
    return fail(e, req);
  }
}
