import { z } from "zod";
import { ok, fail, readJson } from "@/lib/http";
import { requirePermission, writeAudit } from "@/lib/auth";
import { getClientIp } from "@/lib/utils";
import { prisma } from "@/lib/db";
import { setSettings } from "@/lib/settings";
import { AD_SLOTS } from "@/server/services/ads";

const payloadSchema = z.object({
  enabled: z.boolean(),
  testMode: z.boolean(),
  clientId: z.string().trim().max(120).default(""),
  networkKey: z.string().trim().min(1).max(40),
  slots: z
    .array(
      z.object({
        slot: z.enum(AD_SLOTS),
        enabled: z.boolean(),
        unitId: z.string().trim().max(80).nullable().optional(),
        excludePremium: z.boolean().default(true),
      }),
    )
    .max(AD_SLOTS.length),
});

export async function PUT(req: Request) {
  try {
    const { user } = await requirePermission("admin.ads.write");
    const body = payloadSchema.parse(await readJson(req));

    await setSettings([
      { key: "ads.enabled", value: String(body.enabled), group: "ads", type: "bool" },
      { key: "ads.test_mode", value: String(body.testMode), group: "ads", type: "bool" },
      { key: "ads.client_id", value: body.clientId, group: "ads", type: "string" },
    ]);

    const network = await prisma.adNetwork.findUnique({ where: { key: body.networkKey } });
    if (!network) throw new Error("VALIDATION_ERROR");

    for (const slot of body.slots) {
      const key = `slot_${slot.slot.toLowerCase()}`;
      await prisma.adPlacement.upsert({
        where: { key },
        update: {
          enabled: slot.enabled,
          slotId: slot.unitId || null,
          excludePremium: slot.excludePremium,
          networkId: network.id,
        },
        create: {
          key,
          zone: slot.slot.toLowerCase(),
          networkId: network.id,
          enabled: slot.enabled,
          slotId: slot.unitId || null,
          excludePremium: slot.excludePremium,
        },
      });
    }

    await writeAudit({
      actorId: user.id,
      actorEmail: user.email,
      action: "ads.update",
      targetType: "AdPlacement",
      after: { enabled: body.enabled, testMode: body.testMode, slots: body.slots.length },
      ip: getClientIp(req.headers),
    });

    return ok({ saved: true });
  } catch (e) {
    return fail(e, req);
  }
}
