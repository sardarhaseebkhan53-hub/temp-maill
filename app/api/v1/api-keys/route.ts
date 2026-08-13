import { ok, fail, readJson } from "@/lib/http";
import { requireUser } from "@/lib/auth";
import { createApiKey } from "@/server/services/api-keys";
import { prisma } from "@/lib/db";
import { isEnabled } from "@/lib/flags";
import { Errors } from "@/lib/errors";

export async function GET(req: Request) {
  try {
    const { user } = await requireUser();
    const keys = await prisma.apiKey.findMany({ where: { userId: user.id } });
    return ok(keys.map((k) => ({ ...k, keyHash: undefined })));
  } catch (e) {
    return fail(e, req);
  }
}

export async function POST(req: Request) {
  try {
    if (!(await isEnabled("developer_api", true))) throw Errors.forbidden();
    const { user } = await requireUser();
    const body = await readJson<{ name?: string; mode?: "live" | "test" }>(req);
    const created = await createApiKey(user.id, body.name || "Default", body.mode || "live");
    return ok({ key: { ...created.key, keyHash: undefined }, plaintext: created.plaintext }, { status: 201 });
  } catch (e) {
    return fail(e, req);
  }
}
