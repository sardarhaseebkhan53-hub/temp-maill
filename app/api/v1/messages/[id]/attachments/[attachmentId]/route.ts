import { fail } from "@/lib/http";
import { prisma } from "@/lib/db";
import { canAccessMailbox, getMailboxById } from "@/server/services/mailbox";
import { getAttachmentBytes } from "@/server/services/messages";
import { requestContext, mailboxAuthToken } from "@/server/api/context";
import { Errors } from "@/lib/errors";

export async function GET(
  req: Request,
  ctx: { params: Promise<{ id: string; attachmentId: string }> },
) {
  try {
    const { id, attachmentId } = await ctx.params;
    const msg = await prisma.emailMessage.findUnique({ where: { id } });
    if (!msg) throw Errors.notFound("Message");
    const box = await getMailboxById(msg.mailboxId);
    const auth = await requestContext(req);
    const token = await mailboxAuthToken(req);
    if (!(await canAccessMailbox(box, { userId: auth.user?.id, guestBoxes: auth.guest.boxes, token }))) {
      throw Errors.forbidden();
    }
    const { att, bytes } = await getAttachmentBytes(id, attachmentId);
    return new Response(new Uint8Array(bytes), {
      headers: {
        "Content-Type": att.mimeType || "application/octet-stream",
        "Content-Disposition": `attachment; filename="${att.filename.replace(/"/g, "")}"`,
        "X-Content-Type-Options": "nosniff",
        "Cache-Control": "no-store",
      },
    });
  } catch (e) {
    return fail(e, req);
  }
}
