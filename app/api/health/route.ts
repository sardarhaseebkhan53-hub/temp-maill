import { NextResponse } from "next/server";
import { pingDb } from "@/lib/db";
import { pingCache } from "@/lib/redis";
import { getInboundProvider, listInboundProviders } from "@/server/providers/email";
import { getSmsProvider } from "@/server/providers/sms";

export const dynamic = "force-dynamic";

export async function GET() {
  const [db, cache] = await Promise.all([pingDb(), pingCache()]);
  const email = await getInboundProvider().health();
  const sms = await getSmsProvider().health();
  const providers = await Promise.all(listInboundProviders().map(async (p) => [p.key, await p.health()] as const));
  const ok = db.ok;
  return NextResponse.json({
    status: ok ? (email.ok ? "ok" : "degraded") : "down",
    version: "1.0.0",
    checks: {
      database: db,
      cache,
      emailInbound: email,
      sms,
      queue: { ok: true, detail: "in-process scheduler" },
      providers: Object.fromEntries(providers),
    },
  });
}
