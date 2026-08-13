import { ok, fail } from "@/lib/http";
import { getEnv } from "@/config/env";
import { runAllJobs } from "@/server/jobs";
import { Errors } from "@/lib/errors";

export async function POST(req: Request) {
  try {
    const secret = req.headers.get("x-cron-secret") || new URL(req.url).searchParams.get("secret");
    if (secret !== getEnv().CRON_SECRET) throw Errors.forbidden();
    const results = await runAllJobs();
    return ok(results);
  } catch (e) {
    return fail(e, req);
  }
}

export async function GET(req: Request) {
  return POST(req);
}
