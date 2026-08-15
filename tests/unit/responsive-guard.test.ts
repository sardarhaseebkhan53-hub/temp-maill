import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { AD_SLOT_FORMATS } from "@/server/services/ads";

/**
 * Static guard against the classic responsive regressions: a full-viewport-width
 * element or an oversized fixed width sneaks in, works on the developer's
 * desktop, then overflows a 320px phone. Layout behaviour is verified in
 * review; this catches the patterns that must never appear at all.
 */
function collectSources(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (entry === "node_modules" || entry.startsWith(".")) continue;
    if (statSync(full).isDirectory()) collectSources(full, out);
    else if (/\.(tsx?|css)$/.test(entry)) out.push(full);
  }
  return out;
}

const roots = ["app", "components", "styles"].map((dir) => path.resolve(process.cwd(), dir));
const files = roots.flatMap((dir) => collectSources(dir));

const FORBIDDEN: { pattern: RegExp; why: string }[] = [
  { pattern: /width:\s*100vw/, why: "width:100vw includes the scrollbar and overflows" },
  { pattern: /(?<![\w-])w-screen(?![\w-])/, why: "w-screen ignores the scrollbar and overflows" },
  { pattern: /min-width:\s*(7(?:6[8-9]|[7-9]\d)|[89]\d{2}|\d{4,})px/, why: "huge fixed min-width breaks small screens" },
];

describe("responsive source guard", () => {
  it("reviews a non-trivial source set", () => {
    expect(files.length).toBeGreaterThan(80);
  });

  it("contains no known horizontal-overflow patterns", () => {
    const offenders: string[] = [];
    for (const file of files) {
      const source = readFileSync(file, "utf8");
      for (const { pattern, why } of FORBIDDEN) {
        if (pattern.test(source)) {
          offenders.push(`${path.relative(process.cwd(), file)} — ${why}`);
        }
      }
    }
    expect(offenders).toEqual([]);
  });

  it("keeps mobile ad formats inside a 320px viewport", () => {
    // The MOBILE slot renders on the smallest supported screens; its creative
    // must never be wider than the device itself.
    expect(AD_SLOT_FORMATS.MOBILE.width).toBeLessThanOrEqual(320);
    expect(AD_SLOT_FORMATS.MOBILE.responsive).toBe(true);
  });

  it("reserves bounded heights so ads cannot cause unbounded CLS", () => {
    for (const [slot, format] of Object.entries(AD_SLOT_FORMATS)) {
      expect(format.height, slot).toBeLessThanOrEqual(600);
      expect(format.height, slot).toBeGreaterThan(0);
    }
  });
});
