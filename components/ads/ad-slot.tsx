import { cn } from "@/lib/utils";
import { resolveAdSlot, type AdSlotKey, type ResolvedAdSlot } from "@/server/services/ads";
import { AdUnit } from "@/components/ads/ad-unit";

export type { AdSlotKey };

interface AdSlotProps {
  slot: AdSlotKey;
  className?: string;
  /** Pass a pre-resolved slot to avoid re-resolving on pages with many slots. */
  resolved?: ResolvedAdSlot;
}

/**
 * The single advertising primitive used across Haven.
 *
 * Every slot is explicitly labelled "Advertisement", is visually distinct from
 * app controls, never overlaps interactive UI, and reserves its own height so
 * loading an ad cannot shift the page. Premium viewers get nothing at all.
 */
export async function AdSlot({ slot, className, resolved }: AdSlotProps) {
  const config = resolved ?? (await resolveAdSlot(slot));
  if (!config.render) return null;

  const { format } = config;

  return (
    <aside
      aria-label="Advertisement"
      data-ad-slot={slot}
      className={cn(
        "not-prose relative isolate mx-auto flex w-full min-w-0 max-w-full flex-col overflow-hidden rounded-2xl border border-purple-500/25 bg-[#0b0e18]/90",
        className,
      )}
      style={{ maxWidth: `min(100%, ${format.width}px)` }}
    >
      <div className="flex items-center justify-between gap-2 border-b border-white/[0.06] px-2.5 py-1.5">
        <span className="rounded-full border border-purple-500/40 bg-purple-500/15 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.12em] text-purple-300">
          {config.mode === "test" ? "Test ad" : "Advertisement"}
        </span>
        <span className="truncate text-[9px] font-medium uppercase tracking-wider text-slate-500">
          Sponsored
        </span>
      </div>

      <div
        className="flex min-w-0 items-center justify-center p-2"
        style={{ minHeight: `${Math.min(format.height, 250)}px` }}
      >
        {config.mode === "live" ? (
          <AdUnit
            network={config.network}
            unitId={config.unitId}
            clientId={config.clientId}
            responsive={format.responsive}
            width={format.width}
            height={format.height}
          />
        ) : (
          <Placeholder
            label={format.label}
            width={format.width}
            height={format.height}
            responsive={format.responsive}
          />
        )}
      </div>
    </aside>
  );
}

function Placeholder({
  label,
  width,
  height,
  responsive,
}: {
  label: string;
  width: number;
  height: number;
  responsive: boolean;
}) {
  return (
    <div className="flex w-full flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-purple-500/20 bg-purple-500/[0.04] px-3 py-4 text-center">
      <span className="font-display text-base font-bold tracking-tight text-slate-200">
        {responsive ? "Responsive" : `${width} × ${height}`}
      </span>
      <span className="text-[10px] font-medium text-slate-500">{label}</span>
      <span className="text-[9px] text-slate-600">Placeholder shown while ads are in test mode</span>
    </div>
  );
}
