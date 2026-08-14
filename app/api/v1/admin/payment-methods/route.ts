import { z } from "zod";
import { ok, fail, readJson } from "@/lib/http";
import { requirePermission, writeAudit } from "@/lib/auth";
import { getClientIp } from "@/lib/utils";
import {
  getPaymentMethodByKey,
  listAllPaymentMethods,
  upsertPaymentMethod,
} from "@/server/services/payment-methods";

const optionalText = z.string().trim().max(400).optional().nullable();

const paymentMethodSchema = z.object({
  key: z
    .string()
    .trim()
    .min(2)
    .max(40)
    .regex(/^[a-z0-9_]+$/, "Use lowercase letters, digits, and underscores."),
  kind: z.enum(["MANUAL", "STRIPE"]).default("MANUAL"),
  name: z.string().trim().min(1).max(80),
  displayName: z.string().trim().min(1).max(80),
  description: z.string().trim().max(600).optional().default(""),
  instructions: z.string().trim().max(2000).optional().default(""),
  accountNumber: optionalText,
  accountTitle: optionalText,
  merchantId: optionalText,
  iban: optionalText,
  bankName: optionalText,
  qrImageUrl: z.string().trim().url().max(500).optional().nullable().or(z.literal("")),
  currency: z.string().trim().length(3).default("USD"),
  minAmountCents: z.coerce.number().int().min(0).optional().nullable(),
  maxAmountCents: z.coerce.number().int().min(0).optional().nullable(),
  planKeys: z.array(z.string().trim().max(30)).max(10).optional().default([]),
  sortOrder: z.coerce.number().int().min(0).max(999).optional().default(0),
  status: z.enum(["ACTIVE", "HIDDEN"]).optional().default("ACTIVE"),
  enabled: z.boolean().optional().default(false),
});

export async function GET(req: Request) {
  try {
    await requirePermission("admin.payments.write");
    return ok({ methods: await listAllPaymentMethods() });
  } catch (e) {
    return fail(e, req);
  }
}

export async function PUT(req: Request) {
  try {
    const { user } = await requirePermission("admin.payments.write");
    const body = paymentMethodSchema.parse(await readJson(req));

    if (
      body.minAmountCents != null &&
      body.maxAmountCents != null &&
      body.minAmountCents > body.maxAmountCents
    ) {
      throw new Error("VALIDATION_ERROR");
    }

    const before = await getPaymentMethodByKey(body.key);
    await upsertPaymentMethod({
      ...body,
      qrImageUrl: body.qrImageUrl || null,
      currency: body.currency.toUpperCase(),
    });
    const after = await getPaymentMethodByKey(body.key);

    await writeAudit({
      actorId: user.id,
      actorEmail: user.email,
      action: before ? "payment_method.update" : "payment_method.create",
      targetType: "PaymentMethod",
      targetId: body.key,
      before,
      after,
      ip: getClientIp(req.headers),
    });

    return ok({ method: after });
  } catch (e) {
    return fail(e, req);
  }
}
