import { ok, fail, readJson } from "@/lib/http";
import { requirePermission } from "@/lib/auth";
import { reviewManualPayment } from "@/server/services/billing";
import { getClientIp } from "@/lib/utils";

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { user } = await requirePermission("admin.payments.write");
    const { id } = await ctx.params;
    const body = await readJson<{ action: "APPROVED" | "REJECTED" | "NEEDS_INFO"; note?: string }>(req);
    const row = await reviewManualPayment({
      id,
      action: body.action,
      note: body.note,
      actorId: user.id,
      actorEmail: user.email,
      ip: getClientIp(req.headers),
    });
    return ok(row);
  } catch (e) {
    return fail(e, req);
  }
}
