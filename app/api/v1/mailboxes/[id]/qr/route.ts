import QRCode from "qrcode";
import { ok, fail } from "@/lib/http";
import { canAccessMailbox, getMailboxById } from "@/server/services/mailbox";
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
    const dataUrl = await QRCode.toDataURL(`mailto:${box.address}`, {
      margin: 4,
      width: 320,
      errorCorrectionLevel: "M",
    });
    return ok({ dataUrl });
  } catch (e) {
    return fail(e, req);
  }
}
