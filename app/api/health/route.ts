import { NextResponse } from "next/server";
import { pingDb, prisma } from "@/lib/db";
import { pingCache } from "@/lib/redis";
import { getInboundProvider, listInboundProviders } from "@/server/providers/email";
import { getSmsProvider } from "@/server/providers/sms";
import { inboundProviderReadiness, isDomainAssignable } from "@/server/services/email-delivery";

export const dynamic = "force-dynamic";

type HealthCheck = { ok: boolean; latencyMs?: number; detail?: string };

async function safely(check: () => Promise<HealthCheck>, fallback: string): Promise<HealthCheck> {
  try {
    return await check();
  } catch (error) {
    return {
      ok: false,
      detail: error instanceof Error ? error.message : fallback,
    };
  }
}

export async function GET() {
  const [db, cache, email, sms] = await Promise.all([
    safely(pingDb, "database unavailable"),
    safely(pingCache, "cache unavailable"),
    safely(() => getInboundProvider().health(), "email provider unavailable"),
    safely(() => getSmsProvider().health(), "SMS provider unavailable"),
  ]);

  const delivery = inboundProviderReadiness();
  let domainCheck: HealthCheck = db.ok
    ? { ok: true }
    : { ok: false, detail: "Skipped because the database is unavailable." };
  let domains: Awaited<ReturnType<typeof prisma.emailDomain.findMany>> = [];

  if (db.ok) {
    try {
      domains = await prisma.emailDomain.findMany({ where: { status: "ACTIVE" } });
    } catch (error) {
      domainCheck = {
        ok: false,
        detail: error instanceof Error ? error.message : "domain query unavailable",
      };
    }
  }

  const providerEntries = await Promise.all(
    listInboundProviders().map(async (provider) => [
      provider.key,
      await safely(() => provider.health(), `${provider.key} provider unavailable`),
    ] as const),
  );
  const assignableDomains = domainCheck.ok ? domains.filter(isDomainAssignable) : [];

  // Mock mode is useful for local smoke tests but must never claim that public
  // internet mail is ready. Production readiness is reserved for a configured
  // provider plus at least one active domain with verified MX.
  const publicDeliveryOk =
    delivery.status === "READY" && delivery.ready && assignableDomains.length > 0;
  const localDeliveryOk =
    delivery.status === "DEVELOPMENT" && email.ok && assignableDomains.length > 0;
  const down = !db.ok || !domainCheck.ok;
  const operationalMailOk = publicDeliveryOk || localDeliveryOk;

  return NextResponse.json(
    {
      status: down ? "down" : email.ok && operationalMailOk ? "ok" : "degraded",
      version: "1.0.0",
      checks: {
        database: db,
        cache,
        emailInbound: email,
        emailDomains: domainCheck,
        publicMailDelivery: {
          ok: publicDeliveryOk,
          provider: delivery.provider,
          mode: delivery.status,
          assignableDomains: assignableDomains.length,
          detail: delivery.detail,
        },
        sms,
        queue: { ok: true, detail: "in-process scheduler" },
        providers: Object.fromEntries(providerEntries),
      },
    },
    { status: down ? 503 : 200 },
  );
}
