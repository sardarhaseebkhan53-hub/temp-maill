import { NextResponse } from "next/server";
import { getSystemStatus } from "@/server/services/system-status";

export const dynamic = "force-dynamic";

export async function GET() {
  const status = await getSystemStatus();
  const down = !status.checks.database.ok || !status.checks.emailDomains.ok;
  const operationalMailOk = status.checks.publicMailDelivery.ok;
  const overall =
    status.checks.emailInbound.ok && (operationalMailOk || status.environment !== "production")
      ? status.checks.database.ok
        ? "ok"
        : "degraded"
      : "degraded";
  const httpStatus = down ? 503 : 200;
  return NextResponse.json(
    {
      status: down ? "down" : overall,
      version: "1.0.0",
      environment: status.environment,
      checks: status.checks,
    },
    { status: httpStatus },
  );
}
