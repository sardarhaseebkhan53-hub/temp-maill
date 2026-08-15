import { resolveMx } from "node:dns/promises";
import { getEnv } from "@/config/env";
import { prisma } from "@/lib/db";
import { isMeaningfulSecret } from "@/lib/secrets";

export type MailDeliveryStatus = "READY" | "DEVELOPMENT" | "MISCONFIGURED";

export interface MailDeliveryReadiness {
  status: MailDeliveryStatus;
  ready: boolean;
  provider: string;
  detail: string;
}

export interface MxVerificationResult {
  ok: boolean;
  records: { exchange: string; priority: number }[];
  expected: string[];
  note: string;
}

function csv(value: string): string[] {
  return value
    .split(",")
    .map((item) => item.trim().toLowerCase().replace(/\.$/, ""))
    .filter(Boolean);
}

export function normalizeEmailDomain(value: string): string {
  return value.trim().toLowerCase().replace(/^@/, "").replace(/\.$/, "");
}

export function isValidEmailDomain(value: string): boolean {
  const domain = normalizeEmailDomain(value);
  return (
    domain.length <= 253 &&
    domain.includes(".") &&
    !domain.includes("..") &&
    domain.split(".").every((label) =>
      /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(label),
    )
  );
}

export function expectedMxHosts(): string[] {
  const env = getEnv();
  const configured = csv(env.EMAIL_EXPECTED_MX);
  if (configured.length > 0) return configured;
  if (env.EMAIL_INBOUND_PROVIDER === "mailgun") return ["mailgun.org"];
  if (env.EMAIL_INBOUND_PROVIDER === "postmark") return ["inbound.postmarkapp.com"];
  return [];
}

function exchangeMatches(exchange: string, expected: string): boolean {
  const host = exchange.toLowerCase().replace(/\.$/, "");
  return host === expected || host.endsWith(`.${expected}`);
}

/**
 * Verify that DNS points at the selected inbound provider, rather than merely
 * checking that an unrelated MX record exists. This prevents domains hosted by
 * someone else from being advertised as working Haven inboxes.
 */
export async function verifyDomainMx(domainValue: string): Promise<MxVerificationResult> {
  const domain = normalizeEmailDomain(domainValue);
  const expected = expectedMxHosts();
  if (!isValidEmailDomain(domain)) {
    return { ok: false, records: [], expected, note: "Invalid domain name." };
  }
  if (expected.length === 0) {
    return {
      ok: false,
      records: [],
      expected,
      note: "Set EMAIL_EXPECTED_MX to the hostname of the inbound mail receiver.",
    };
  }

  try {
    const records = (await resolveMx(domain))
      .map((record) => ({
        exchange: record.exchange.toLowerCase().replace(/\.$/, ""),
        priority: record.priority,
      }))
      .sort((a, b) => a.priority - b.priority);
    const ok = records.some((record) =>
      expected.some((expectedHost) => exchangeMatches(record.exchange, expectedHost)),
    );
    return {
      ok,
      records,
      expected,
      note: ok
        ? `Verified MX: ${records.map((record) => record.exchange).join(", ")}`
        : records.length > 0
          ? `MX does not point to ${expected.join(" or ")}. Found: ${records.map((record) => record.exchange).join(", ")}`
          : "No MX records found.",
    };
  } catch (error) {
    const code = typeof error === "object" && error && "code" in error ? String(error.code) : "DNS_ERROR";
    return { ok: false, records: [], expected, note: `MX lookup failed (${code}).` };
  }
}

export function inboundProviderReadiness(): MailDeliveryReadiness {
  const env = getEnv();
  switch (env.EMAIL_INBOUND_PROVIDER) {
    case "mock":
      return env.NODE_ENV === "production"
        ? {
            status: "MISCONFIGURED",
            ready: false,
            provider: "mock",
            detail: "The mock inbound adapter is disabled in production.",
          }
        : {
            status: "DEVELOPMENT",
            ready: false,
            provider: "mock",
            detail: "Development test mode; public internet email is not connected.",
          };
    case "mailgun": {
      const ready = isMeaningfulSecret(env.MAILGUN_WEBHOOK_SIGNING_KEY);
      return {
        status: ready ? "READY" : "MISCONFIGURED",
        ready,
        provider: "mailgun",
        detail: ready
          ? "Mailgun signed inbound webhook is configured."
          : "Set MAILGUN_WEBHOOK_SIGNING_KEY before enabling public delivery.",
      };
    }
    case "postmark": {
      const ready = Boolean(env.POSTMARK_WEBHOOK_USER && env.POSTMARK_WEBHOOK_PASS);
      return {
        status: ready ? "READY" : "MISCONFIGURED",
        ready,
        provider: "postmark",
        detail: ready
          ? "Postmark inbound webhook authentication is configured."
          : "Set POSTMARK_WEBHOOK_USER and POSTMARK_WEBHOOK_PASS before enabling public delivery.",
      };
    }
    case "smtp": {
      const ready = expectedMxHosts().length > 0;
      return {
        status: ready ? "READY" : "MISCONFIGURED",
        ready,
        provider: "smtp",
        detail: ready
          ? "Authenticated SMTP receiver callback is configured."
          : "Set EMAIL_EXPECTED_MX to the public SMTP receiver hostname.",
      };
    }
  }
}

export function deliveryReadinessForDomain(domain: {
  mxRequired: boolean;
  mxOk: boolean;
}): MailDeliveryReadiness {
  const provider = inboundProviderReadiness();
  if (provider.status === "DEVELOPMENT" && !domain.mxRequired) return provider;
  if (!provider.ready) return provider;
  if (domain.mxRequired && !domain.mxOk) {
    return {
      status: "MISCONFIGURED",
      ready: false,
      provider: provider.provider,
      detail: "The domain MX route has not been verified.",
    };
  }
  return provider;
}

export function isDomainAssignable(domain: Record<string, unknown>): boolean {
  if (domain.status !== "ACTIVE") return false;
  const readiness = deliveryReadinessForDomain({
    mxRequired: Boolean(domain.mxRequired),
    mxOk: Boolean(domain.mxOk),
  });
  const normalizedDomain =
    typeof domain.domain === "string" ? normalizeEmailDomain(domain.domain) : "";
  const reservedTestDomain = normalizedDomain.endsWith(".test");
  const configuredComDomain = normalizedDomain.endsWith(".com");
  return (
    (readiness.ready && configuredComDomain) ||
    (readiness.status === "DEVELOPMENT" && getEnv().NODE_ENV !== "production" && reservedTestDomain)
  );
}

export async function refreshDomainMx(domainId: string) {
  const domain = await prisma.emailDomain.findUnique({ where: { id: domainId } });
  if (!domain) return null;
  const checked = await verifyDomainMx(domain.domain);
  const now = new Date();
  return prisma.emailDomain.update({
    where: { id: domain.id },
    data: {
      mxOk: checked.ok,
      status: checked.ok ? "ACTIVE" : "DEGRADED",
      lastHealthAt: now,
      lastHealthNote: checked.note,
    },
  });
}

export async function refreshAllDomainMx(olderThanMinutes = 0) {
  const domains = await prisma.emailDomain.findMany({
    where: { mxRequired: true, status: { not: "DISABLED" } },
    select: { id: true, lastHealthAt: true },
  });
  const cutoff = Date.now() - olderThanMinutes * 60_000;
  const due = domains.filter((domain) => {
    if (!olderThanMinutes || !domain.lastHealthAt) return true;
    return new Date(domain.lastHealthAt).getTime() <= cutoff;
  });
  let ready = 0;
  let degraded = 0;
  for (const domain of due) {
    const updated = await refreshDomainMx(domain.id);
    if (updated?.mxOk) ready += 1;
    else degraded += 1;
  }
  return { checked: due.length, ready, degraded };
}
