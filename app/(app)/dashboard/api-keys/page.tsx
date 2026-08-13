import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ApiKeyManager } from "@/components/features/api-key-manager";

export default async function ApiKeysPage() {
  const { user } = await requireUser();
  const keys = await prisma.apiKey.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });
  return (
    <div>
      <h1 className="font-display text-3xl font-semibold">API keys</h1>
      <p className="text-sm text-muted-foreground mt-2">Plaintext is shown once. Keys are stored as hashes.</p>
      <div className="mt-6">
        <ApiKeyManager
          keys={keys.map((k) => ({
            id: k.id,
            name: k.name,
            prefix: k.prefix,
            lastFour: k.lastFour,
            mode: k.mode,
            revokedAt: k.revokedAt?.toISOString() ?? null,
          }))}
        />
      </div>
    </div>
  );
}
