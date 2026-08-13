import { ok, fail, readJson } from "@/lib/http";
import { requirePermission, writeAudit } from "@/lib/auth";
import { setFlag } from "@/lib/flags";

export async function POST(req: Request) {
  try {
    const { user } = await requirePermission("admin.settings.write");
    const body = await readJson<{ key: string; enabled: boolean }>(req);
    await setFlag(body.key, body.enabled);
    await writeAudit({
      actorId: user.id,
      actorEmail: user.email,
      action: "flag.toggle",
      targetType: "FeatureFlag",
      targetId: body.key,
      after: body,
    });
    return ok({ saved: true });
  } catch (e) {
    return fail(e, req);
  }
}
