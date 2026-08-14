import "server-only";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { getSetting, getSettingBool } from "@/lib/settings";

/**
 * Canonical ad slots. A page asks for a slot by name; the database decides
 * whether it renders, which network serves it, and with which unit id.
 */
export const AD_SLOTS = [
  "TOP_LEADERBOARD",
  "HERO",
  "CONTENT",
  "RECTANGLE",
  "RIGHT_RAIL",
  "LEFT_RAIL",
  "MOBILE",
  "BLOG",
  "TOOLS",
  "FOOTER",
] as const;

export type AdSlotKey = (typeof AD_SLOTS)[number];

/** Intrinsic size hints so containers reserve space and never shift layout. */
export const AD_SLOT_FORMATS: Record<
  AdSlotKey,
  { label: string; width: number; height: number; responsive: boolean }
> = {
  TOP_LEADERBOARD: { label: "Responsive leaderboard", width: 728, height: 90, responsive: true },
  HERO: { label: "Medium rectangle", width: 300, height: 250, responsive: false },
  CONTENT: { label: "Responsive in-content", width: 728, height: 90, responsive: true },
  RECTANGLE: { label: "Medium rectangle", width: 300, height: 250, responsive: false },
  RIGHT_RAIL: { label: "Wide skyscraper", width: 160, height: 600, responsive: false },
  LEFT_RAIL: { label: "Wide skyscraper", width: 160, height: 600, responsive: false },
  MOBILE: { label: "Mobile banner", width: 320, height: 100, responsive: true },
  BLOG: { label: "Responsive in-article", width: 728, height: 90, responsive: true },
  TOOLS: { label: "Responsive in-content", width: 728, height: 90, responsive: true },
  FOOTER: { label: "Responsive footer", width: 728, height: 90, responsive: true },
};

export interface ResolvedAdSlot {
  slot: AdSlotKey;
  /** False when ads are off globally, the slot is disabled, or the viewer is premium. */
  render: boolean;
  /** "test" renders a clearly labelled placeholder; "live" injects the network unit. */
  mode: "test" | "live";
  network: string;
  unitId: string | null;
  format: (typeof AD_SLOT_FORMATS)[AdSlotKey];
  /** Client id for the configured network, when the network needs one. */
  clientId: string | null;
}

const PLACEMENT_PREFIX = "slot_";

function placementKey(slot: AdSlotKey): string {
  return `${PLACEMENT_PREFIX}${slot.toLowerCase()}`;
}

interface AdViewerContext {
  /** Premium plans are ad-free; this is resolved on the server, never claimed by the client. */
  premium: boolean;
}

export async function getAdViewerContext(): Promise<AdViewerContext> {
  const ctx = await getCurrentUser().catch(() => null);
  const planKey = ctx?.user.planKey ?? "FREE";
  return { premium: planKey === "PRO" || planKey === "BUSINESS" };
}

/**
 * Resolve one slot for the current viewer. Returns `render: false` rather than
 * throwing so a page never breaks because ad config is missing.
 */
export async function resolveAdSlot(
  slot: AdSlotKey,
  viewer?: AdViewerContext,
): Promise<ResolvedAdSlot> {
  const format = AD_SLOT_FORMATS[slot];
  const off: ResolvedAdSlot = {
    slot,
    render: false,
    mode: "test",
    network: "none",
    unitId: null,
    format,
    clientId: null,
  };

  const context = viewer ?? (await getAdViewerContext());
  if (context.premium) return off;

  const globallyEnabled = await getSettingBool("ads.enabled", true).catch(() => false);
  if (!globallyEnabled) return off;

  const testMode = await getSettingBool("ads.test_mode", true).catch(() => true);

  const placement = (await prisma.adPlacement
    .findUnique({ where: { key: placementKey(slot) }, include: { network: true } })
    .catch(() => null)) as
    | { enabled: boolean; slotId: string | null; excludePremium: boolean; network: { key: string; enabled: boolean } }
    | null;

  if (!placement || !placement.enabled) return off;
  if (placement.excludePremium && context.premium) return off;

  const network = placement.network?.enabled ? placement.network.key : "none";
  const clientId = (await getSetting("ads.client_id", "").catch(() => "")) || null;

  // Without a real unit id (or with test mode on) we show the labelled
  // placeholder instead of an empty container.
  const live = !testMode && network !== "none" && Boolean(placement.slotId);

  return {
    slot,
    render: true,
    mode: live ? "live" : "test",
    network,
    unitId: placement.slotId,
    format,
    clientId,
  };
}

/** Resolve several slots with a single viewer lookup. */
export async function resolveAdSlots(slots: AdSlotKey[]): Promise<Record<string, ResolvedAdSlot>> {
  const viewer = await getAdViewerContext();
  const entries = await Promise.all(
    slots.map(async (slot) => [slot, await resolveAdSlot(slot, viewer)] as const),
  );
  return Object.fromEntries(entries);
}

export async function listAdPlacements() {
  return prisma.adPlacement.findMany({ include: { network: true }, orderBy: { key: "asc" } });
}
