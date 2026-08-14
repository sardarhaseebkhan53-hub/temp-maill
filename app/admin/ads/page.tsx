import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getSetting, getSettingBool } from "@/lib/settings";
import { AD_SLOTS, AD_SLOT_FORMATS, type AdSlotKey } from "@/server/services/ads";
import { AdminAdsPanel, type AdSlotConfig } from "@/components/features/admin-ads-panel";

const SLOT_LABELS: Record<AdSlotKey, string> = {
  TOP_LEADERBOARD: "Top leaderboard",
  HERO: "Hero rectangle",
  CONTENT: "In-content",
  RECTANGLE: "Sidebar rectangle",
  RIGHT_RAIL: "Right rail (≥1600px)",
  LEFT_RAIL: "Left rail (≥1600px)",
  MOBILE: "Mobile banner",
  BLOG: "Blog in-article",
  TOOLS: "Tools page",
  FOOTER: "Footer",
};

export default async function Page() {
  await requirePermission("admin.ads.write");

  const [placements, networks, enabled, testMode, clientId] = await Promise.all([
    prisma.adPlacement.findMany({ include: { network: true } }),
    prisma.adNetwork.findMany({ orderBy: { name: "asc" } }),
    getSettingBool("ads.enabled", true),
    getSettingBool("ads.test_mode", true),
    getSetting("ads.client_id", ""),
  ]);

  const byKey = new Map(placements.map((placement) => [placement.key, placement]));

  const slots: AdSlotConfig[] = AD_SLOTS.map((slot) => {
    const placement = byKey.get(`slot_${slot.toLowerCase()}`);
    const format = AD_SLOT_FORMATS[slot];
    return {
      slot,
      label: SLOT_LABELS[slot],
      size: format.responsive
        ? `${format.width}×${format.height} responsive`
        : `${format.width}×${format.height}`,
      enabled: placement ? Boolean(placement.enabled) : false,
      unitId: (placement?.slotId as string | null) ?? null,
      excludePremium: placement ? Boolean(placement.excludePremium) : true,
    };
  });

  const currentNetwork =
    placements.find((placement) => placement.network?.key)?.network?.key ??
    networks[0]?.key ??
    "internal";

  return (
    <div className="min-w-0 space-y-6">
      <header className="min-w-0">
        <h1 className="font-display text-2xl font-bold tracking-tight text-white">Advertising</h1>
        <p className="mt-1 max-w-2xl text-sm text-slate-400">
          Control which placements render, which network serves them, and their unit IDs. Haven
          never refreshes a slot on a timer and never counts an impression the visitor did not see.
        </p>
      </header>

      <AdminAdsPanel
        initialEnabled={enabled}
        initialTestMode={testMode}
        initialClientId={clientId}
        networks={networks.map((network) => ({
          key: String(network.key),
          name: String(network.name),
        }))}
        initialNetworkKey={String(currentNetwork)}
        slots={slots}
      />
    </div>
  );
}
