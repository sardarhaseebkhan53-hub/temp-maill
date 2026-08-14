# Advertising

Haven's advertising is entirely database-driven. Nothing about a placement is
hardcoded in a page, and no page decides on its own whether an ad renders.

## Slots

Ten canonical slots are declared in `server/services/ads.ts`:

| Slot | Intrinsic size | Typical use |
| --- | --- | --- |
| `TOP_LEADERBOARD` | 728×90 responsive | Above the fold on content pages |
| `HERO` | 300×250 | Beside the hero / inbox |
| `CONTENT` | 728×90 responsive | Between content sections |
| `RECTANGLE` | 300×250 | Sidebar |
| `LEFT_RAIL` / `RIGHT_RAIL` | 160×600 | Screens ≥1600px only |
| `MOBILE` | 320×100 responsive | Small screens |
| `BLOG` | 728×90 responsive | In-article |
| `TOOLS` | 728×90 responsive | Between tool sections |
| `FOOTER` | 728×90 responsive | Page end |

Each slot has one `AdPlacement` row keyed `slot_<lowercase name>`.

## Rendering

```tsx
import { AdSlot } from "@/components/ads/ad-slot";

<AdSlot slot="TOP_LEADERBOARD" />
```

On pages with several slots, resolve them together to avoid repeated lookups:

```tsx
const ads = await resolveAdSlots(["TOP_LEADERBOARD", "RECTANGLE"]);
<AdSlot slot="RECTANGLE" resolved={ads.RECTANGLE} />
```

`AdSlot` returns `null` — rendering no container at all — when ads are globally
disabled, the placement is disabled, or **the viewer is on a paid plan**.

## Premium is ad-free

Plan is resolved server-side from the active subscription in
`getAdViewerContext()`. The browser cannot ask for or suppress ads. Pro and
Business see no advertising anywhere on the site; the free tier is unchanged.

## Test vs production

`ads.test_mode` ships enabled. While it is on, every slot renders a clearly
labelled placeholder rather than a live unit. To go live:

1. Admin → Ads → set the provider and publisher/client ID.
2. Fill in the ad unit ID for each slot you want to serve.
3. Turn **Test mode** off.

A slot with no unit ID always falls back to the placeholder, so a
misconfiguration can never produce an empty, collapsed container.

## Policy guarantees

These are enforced in code, not left to page authors:

- Every slot is wrapped in `<aside aria-label="Advertisement">` and carries a
  visible "Advertisement" / "Test ad" label.
- Slots reserve their height, so a loading ad cannot shift the page or move a
  button under a user's finger.
- Ads are never placed over controls, and controls are never placed over ads.
- A unit is pushed exactly once per mount. Haven never refreshes a slot on a
  timer, so no impression is generated that a visitor did not see.
- Rails are `position: fixed` outside the content column and only exist at
  ≥1600px, so the application is never squeezed to make room for them.
- Mobile never receives a rail layout.
