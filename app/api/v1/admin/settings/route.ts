import { ok, fail, readJson } from "@/lib/http";
import { requirePermission, writeAudit } from "@/lib/auth";
import { setSettings } from "@/lib/settings";

export async function PUT(req: Request) {
  try {
    const { user } = await requirePermission("admin.settings.write");
    const body = await readJson<{ settings: { key: string; value: string }[] }>(req);
    await setSettings(body.settings);
    await writeAudit({
      actorId: user.id,
      actorEmail: user.email,
      action: "settings.update",
      targetType: "SystemSetting",
      after: body.settings,
    });
    return ok({ saved: true });
  } catch (e) {
    return fail(e, req);
  }
}
