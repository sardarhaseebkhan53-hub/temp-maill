import { prisma } from "@/lib/db";
import { Errors } from "@/lib/errors";
import { randomLocalPart, validateLocalPart } from "@/lib/username";
import { getPlanLimits, limitNumber } from "@/server/services/plans";
import { listAssignableDomains } from "@/server/services/mailbox";
import type { SessionUser } from "@/types";

export async function createAlias(user: SessionUser, input: { localPart?: string; domainId?: string; label?: string }) {
  const limits = await getPlanLimits(user.planKey);
  const max = limitNumber(limits, "max_aliases", user.planKey === "FREE" ? 0 : 10);
  const current = await prisma.alias.count({ where: { userId: user.id, status: { not: "DELETED" } } });
  if (current >= max) throw Errors.planLimit("Upgrade to create more aliases.");
  const domains = await listAssignableDomains(user.planKey);
  const domain = input.domainId ? domains.find((d) => d.id === input.domainId) : domains[0];
  if (!domain) throw Errors.domainUnavailable();
  let local = input.localPart ? validateLocalPart(input.localPart) : { ok: true as const, value: randomLocalPart() };
  if (!local.ok) throw Errors.usernameBlocked();
  const address = `${local.value}@${domain.domain}`;
  const taken = await prisma.alias.findUnique({ where: { address } });
  if (taken) throw Errors.usernameTaken();
  return prisma.alias.create({
    data: {
      userId: user.id,
      domainId: domain.id,
      address,
      localPart: local.value,
      label: input.label,
      status: "ACTIVE",
    },
  });
}

export async function setAliasStatus(userId: string, id: string, status: "ACTIVE" | "PAUSED" | "DELETED") {
  const alias = await prisma.alias.findFirst({ where: { id, userId } });
  if (!alias) throw Errors.notFound("Alias");
  return prisma.alias.update({ where: { id }, data: { status } });
}
