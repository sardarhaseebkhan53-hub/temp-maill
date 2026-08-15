# Mobile responsiveness & advertising

Haven ships a deliberate mobile experience rather than a shrunken desktop
page. This document describes the architecture that keeps phones, tablets and
desktops on a single codebase without layout compromises.

## Breakpoints

One system, used everywhere (Tailwind defaults plus two extensions):

| Token | From | Purpose |
| ----- | ---- | ------- |
| `xs`  | 375px | fine typography tuning on phones |
| `sm`  | 640px | large phone / small tablet |
| `md`  | 768px | tablet portrait |
| `lg`  | 1024px | tablet landscape / small laptop |
| `xl`  | 1280px | desktop multi-pane layouts |
| `2xl` | 1536px | wide desktop |
| `3xl` | 1920px | ultra-wide (ad rails only appear above 1600px) |

The design targets are 320 / 360 / 375 / 390 / 393 / 414 / 430 / 480 / 600 /
768px widths, in portrait and landscape. Everything fluid sizes with
`min-w-0` + `w-full`; fixed widths are banned below desktop (see
`tests/unit/responsive-guard.test.ts`, which rejects `width: 100vw`,
`w-screen` and oversized fixed `min-width` values at CI time).

## Page structure

- **Header** — desktop keeps the full menu; below `lg` a hamburger opens an
  animated drawer (`animate-menu-down`) with backdrop, body scroll-lock,
  Escape handling and focus management. The drawer sits at `z-50`, above all
  advertising.
- **Bottom tab bar** — Home / Inbox / Tools / Premium / Account, fixed, with
  `env(safe-area-inset-bottom)` padding. A matching in-flow spacer
  (`MobileNavSpacer`) reserves exactly its height so content is never hidden
  behind it on notched devices.
- **Footer** — phones get collapsible accordion sections
  (native `<details>`, keyboard accessible); `sm` and up render the full
  six-column sitemap.

## The temporary inbox on phones

The generator card is always above the fold and is never lazy-loaded. The
address row wraps safely (`break-all`) instead of overflowing, and every
action keeps a ≥ 44px touch target.

Reading mail follows the native-mail pattern instead of forcing the desktop
three-pane layout onto a phone:

- below `xl`: message list → tap → **full-screen reader**
  (`MobileMessageReader`) with a labelled back action, safe-area padding,
  scroll lock, Escape support and a slide-in transition;
- `xl` and up: the classic list + reader split view.

Only genuinely received messages are displayed. An empty mailbox renders the
"Your inbox is ready" state; there are no sample or fake messages anywhere
in the inbox pipeline (guarded by `tests/ui/mobile-shell.test.tsx`).

## Advertising

Ads are a first-class, opt-in system (`server/services/ads.ts` +
`components/ads/`):

- every slot is a labelled `Advertisement` container that **reserves its
  intrinsic height** before the creative loads, so nothing below it jumps
  (no CLS);
- AdSense units always render responsively (`data-ad-format="auto"`,
  `data-full-width-responsive="true"`), so a fixed-size creative can never
  be cropped at 320px;
- mobile placements use 320×100 / 300×250 class formats; desktop adds
  leaderboards and 160×600 rails (rails only exist above 1600px);
- no ad is ever placed between the address and its actions, inside a message
  body, or above navigation — the z-order forbids it structurally;
- **test mode** (the seeded default) renders clearly labelled placeholders.
  Go live by setting a network + unit IDs in **Admin → Advertising** and
  turning test mode off there. Nothing secret ever reaches the client;
- premium plans (PRO/BUSINESS) resolve ad-free server-side
  (`getAdViewerContext`) — the client never decides.

## Forms

All form controls render at `text-base` (16px) below `sm` so iOS Safari
never auto-zooms on focus, stepping down to the compact desktop size at
`sm` and up. `interactiveWidget: "resizes-content"` keeps focused fields
visible while the software keyboard is open.

## Motion

Micro-interactions use `transform`/`opacity` only, and the global
`prefers-reduced-motion` block neutralises animations for users who ask for
that. There is no WebGL or particle work on any render path — the "3D" brand
imagery is static SVG with a CSS float.
