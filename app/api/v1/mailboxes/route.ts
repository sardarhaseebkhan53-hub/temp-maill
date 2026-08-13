import { cookies } from "next/headers";
import { ok, fail, readJson } from "@/lib/http";
import { assertRateLimit } from "@/lib/rate-limit";
import { mailboxCreateSchema } from "@/lib/validation";
import { getClientIp } from "@/lib/utils";
import { createMailbox, listUserMailboxes, toPublicMailbox } from "@/server/services/mailbox";
import { requestContext } from "@/server/api/context";
import { rememberMailbox, guestCookieOptions } from "@/lib/guest";
import { getSettingBool } from "@/lib/settings";
import { Errors } from "@/lib/errors";

export async function GET(req: Request) {
  try {
    const ctx = await requestContext(req);
    if (!ctx.user) return fail(Errors.unauthorized(), req);
    const rows = await listUserMailboxes(ctx.user.id);
    return ok(rows.map((r) => toPublicMailbox(r)));
  } catch (e) {
    return fail(e, req);
  }
}

export async function POST(req: Request) {
  try {
    if (await getSettingBool("maintenance.enabled", false)) throw Errors.maintenance();
    const ctx = await requestContext(req);
    await assertRateLimit("anon.mailbox.create", ctx.ip);
    await assertRateLimit("anon.mailbox.create.hour", ctx.ip);
    const body = mailboxCreateSchema.parse(await readJson(req).catch(() => ({})));
    const created = await createMailbox({
      user: ctx.user,
      guestKey: ctx.guest.gid,
      localPart: body.localPart,
      domainId: body.domainId,
      custom: body.custom,
      sandbox: body.sandbox || ctx.apiKey?.mode === "test",
      ttlMinutes: body.ttlMinutes,
      ip: getClientIp(req.headers),
      userAgent: req.headers.get("user-agent") || "",
    });
    const { token } = await rememberMailbox(created.mailbox.id);
    const jar = await cookies();
    const opts = guestCookieOptions();
    jar.set(opts.name, token, opts);
    return ok(toPublicMailbox(created.mailbox), { status: 201 });
  } catch (e) {
    return fail(e, req);
  }
}
