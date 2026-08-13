import { ok, fail, readJson } from "@/lib/http";
import { requireUser } from "@/lib/auth";
import { webhookCreateSchema } from "@/lib/validation";
import { prisma } from "@/lib/db";
import { hashSecret, randomToken } from "@/lib/crypto";

export async function GET(req: Request) {
  try {
    const { user } = await requireUser();
    const rows = await prisma.webhook.findMany({ where: { userId: user.id } });
    return ok(rows.map((r) => ({ ...r, secretHash: undefined })));
  } catch (e) {
    return fail(e, req);
  }
}

export async function POST(req: Request) {
  try {
    const { user } = await requireUser();
    const body = webhookCreateSchema.parse(await readJson(req));
    const secret = randomToken(24);
    const row = await prisma.webhook.create({
      data: {
        userId: user.id,
        url: body.url,
        secretHash: hashSecret(secret),
        eventsJson: JSON.stringify(body.events),
        sandbox: Boolean(body.sandbox),
      },
    });
    return ok({ webhook: { ...row, secretHash: undefined }, secret }, { status: 201 });
  } catch (e) {
    return fail(e, req);
  }
}
