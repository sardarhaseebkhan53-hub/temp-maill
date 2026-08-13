import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { AliasManager } from "@/components/features/alias-manager";
import { listAssignableDomains } from "@/server/services/mailbox";

export default async function AliasesPage() {
  const { user } = await requireUser();
  const [aliases, domains] = await Promise.all([
    prisma.alias.findMany({ where: { userId: user.id, status: { not: "DELETED" } }, include: { domain: true } }),
    listAssignableDomains(user.planKey),
  ]);
  return (
    <div>
      <h1 className="font-display text-3xl font-semibold">Aliases</h1>
      <p className="text-sm text-muted-foreground mt-2">Stable routing addresses for registered plans.</p>
      <div className="mt-6">
        <AliasManager
          aliases={aliases.map((a) => ({ id: a.id, address: a.address, status: a.status, label: a.label }))}
          domains={domains.map((d) => ({ id: d.id, domain: d.domain }))}
        />
      </div>
    </div>
  );
}
