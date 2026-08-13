import { ok, fail, readJson } from "@/lib/http";
import { hasPermission, requirePermission, writeAudit } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Errors } from "@/lib/errors";
import { getClientIp } from "@/lib/utils";
import { invalidateUserCache } from "@/lib/auth";

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { user: actor } = await requirePermission("admin.users.write");
    const { id } = await ctx.params;
    const body = await readJson<{ action: string; notes?: string }>(req);
    const target = await prisma.user.findUnique({ where: { id } });
    if (!target) throw Errors.notFound("User");
    const before = { status: target.status };
    let status = target.status;
    if (body.action === "suspend") status = "SUSPENDED";
    if (body.action === "unsuspend") status = "ACTIVE";
    if (body.action === "ban") status = "BANNED";
    if (body.action === "unban") status = "ACTIVE";
    await prisma.user.update({
      where: { id },
      data: { status, notesInternal: body.notes ?? target.notesInternal },
    });
    await invalidateUserCache(id);
    await writeAudit({
      actorId: actor.id,
      actorEmail: actor.email,
      action: `user.${body.action}`,
      targetType: "User",
      targetId: id,
      before,
      after: { status },
      ip: getClientIp(req.headers),
    });
    if (!hasPermission(actor, "admin.users.write")) throw Errors.forbidden();
    return ok({ id, status });
  } catch (e) {
    return fail(e, req);
  }
}
