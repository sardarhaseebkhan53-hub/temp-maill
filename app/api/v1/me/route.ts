import { ok, fail, readJson } from "@/lib/http";
import { getCurrentUser, invalidateUserCache, requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(req: Request) {
  try {
    const ctx = await getCurrentUser();
    return ok(ctx?.user ?? null);
  } catch (e) {
    return fail(e, req);
  }
}

export async function PATCH(req: Request) {
  try {
    const { user } = await requireUser();
    const body = await readJson<{ displayName?: string; locale?: string; theme?: string }>(req);
    await prisma.user.update({
      where: { id: user.id },
      data: {
        displayName: body.displayName,
        locale: body.locale,
        theme: body.theme,
      },
    });
    await invalidateUserCache(user.id);
    return ok({ saved: true });
  } catch (e) {
    return fail(e, req);
  }
}

export async function DELETE(req: Request) {
  try {
    const { user } = await requireUser();
    await prisma.user.update({
      where: { id: user.id },
      data: { status: "DELETED", deletedAt: new Date(), email: `deleted+${user.id}@haven.invalid` },
    });
    await invalidateUserCache(user.id);
    return ok({ deleted: true });
  } catch (e) {
    return fail(e, req);
  }
}
