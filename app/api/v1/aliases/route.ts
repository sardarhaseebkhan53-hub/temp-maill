import { ok, fail, readJson } from "@/lib/http";
import { requireUser } from "@/lib/auth";
import { aliasCreateSchema } from "@/lib/validation";
import { createAlias } from "@/server/services/aliases";
import { prisma } from "@/lib/db";
import { isEnabled } from "@/lib/flags";
import { Errors } from "@/lib/errors";

export async function GET(req: Request) {
  try {
    const { user } = await requireUser();
    const rows = await prisma.alias.findMany({ where: { userId: user.id, status: { not: "DELETED" } } });
    return ok(rows);
  } catch (e) {
    return fail(e, req);
  }
}

export async function POST(req: Request) {
  try {
    if (!(await isEnabled("aliases", true))) throw Errors.forbidden();
    const { user } = await requireUser();
    const body = aliasCreateSchema.parse(await readJson(req));
    const alias = await createAlias(user, body);
    return ok(alias, { status: 201 });
  } catch (e) {
    return fail(e, req);
  }
}
