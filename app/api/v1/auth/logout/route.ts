import { cookies } from "next/headers";
import { ok, fail } from "@/lib/http";
import { destroySession, getCurrentUser, sessionCookieOptions } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const ctx = await getCurrentUser();
    if (ctx) await destroySession(ctx.sessionId);
    const opts = sessionCookieOptions();
    (await cookies()).set(opts.name, "", { ...opts, maxAge: 0 });
    return ok({ ok: true });
  } catch (e) {
    return fail(e, req);
  }
}
