import { AdSlot } from "@/components/ads/ad-slot";
import { resolveAdSlots } from "@/server/services/ads";

/**
 * 160×600 rails for very wide screens only.
 *
 * The rails are absolutely positioned outside the content column, so the app
 * is never squeezed to make room for them, and they disappear entirely below
 * 1600px rather than being scaled down.
 */
export async function RailAds() {
  const slots = await resolveAdSlots(["LEFT_RAIL", "RIGHT_RAIL"]);
  const left = slots.LEFT_RAIL;
  const right = slots.RIGHT_RAIL;
  if (!left?.render && !right?.render) return null;

  return (
    <div aria-hidden={false} className="pointer-events-none hidden min-[1600px]:block">
      {left?.render ? (
        <div className="pointer-events-auto fixed left-4 top-28 z-10 w-[176px] 2xl:left-8">
          <AdSlot slot="LEFT_RAIL" resolved={left} />
        </div>
      ) : null}
      {right?.render ? (
        <div className="pointer-events-auto fixed right-4 top-28 z-10 w-[176px] 2xl:right-8">
          <AdSlot slot="RIGHT_RAIL" resolved={right} />
        </div>
      ) : null}
    </div>
  );
}
