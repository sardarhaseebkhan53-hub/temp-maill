import { cookies } from "next/headers";
import { LOCALES } from "@/types";
import { ok, fail, readJson } from "@/lib/http";

export async function POST(req: Request) {
  try {
    const body = await readJson<{ locale?: string }>(req);
    const locale = LOCALES.includes(body.locale as never) ? body.locale! : "en";
    const jar = await cookies();
    jar.set("haven_locale", locale, { path: "/", maxAge: 365 * 86400 });
    return ok({ locale });
  } catch (e) {
    return fail(e, req);
  }
}
