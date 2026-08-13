import { ok, fail } from "@/lib/http";
import { publicStats } from "@/server/services/stats";

export async function GET() {
  try {
    return ok(await publicStats());
  } catch (e) {
    return fail(e);
  }
}
