import { cookies } from "next/headers";
import { ok, fail, readJson } from "@/lib/http";
import { rememberMailbox, guestCookieOptions } from "@/lib/guest";
import { getMailboxById } from "@/server/services/mailbox";

export async function POST(req: Request) {
  try {
    const body = await readJson<{ id: string }>(req);
    await getMailboxById(body.id);
    const { token } = await rememberMailbox(body.id);
    const jar = await cookies();
    const opts = guestCookieOptions();
    jar.set(opts.name, token, opts);
    return ok({ remembered: true });
  } catch (e) {
    return fail(e, req);
  }
}
