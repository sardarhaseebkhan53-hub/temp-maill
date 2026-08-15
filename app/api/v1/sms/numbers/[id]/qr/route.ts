import QRCode from "qrcode";
import { ok, fail } from "@/lib/http";
import { assertSmsNumberAccess, getSmsNumber } from "@/server/services/sms";
import { requestContext, mailboxAuthToken } from "@/server/api/context";

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    const auth = await requestContext(req);
    const token = await mailboxAuthToken(req);
    const number = await getSmsNumber(id);
    assertSmsNumberAccess(number, { userId: auth.user?.id, token });

    const dataUrl = await QRCode.toDataURL(`sms:${number.e164}`, {
      margin: 4,
      width: 320,
      errorCorrectionLevel: "M",
    });
    return ok({ dataUrl });
  } catch (e) {
    return fail(e, req);
  }
}
