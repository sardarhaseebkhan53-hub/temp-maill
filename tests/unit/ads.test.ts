import { describe, expect, it } from "vitest";
import { AD_SLOTS, AD_SLOT_FORMATS, resolveAdSlot } from "@/server/services/ads";
import { splitHtmlForInContentAd } from "@/lib/content";

describe("ad slots", () => {
  it("declares a format for every canonical slot", () => {
    for (const slot of AD_SLOTS) {
      const format = AD_SLOT_FORMATS[slot];
      expect(format).toBeTruthy();
      expect(format.width).toBeGreaterThan(0);
      expect(format.height).toBeGreaterThan(0);
    }
  });

  it("renders nothing at all for a premium viewer", async () => {
    for (const slot of AD_SLOTS) {
      const resolved = await resolveAdSlot(slot, { premium: true });
      expect(resolved.render).toBe(false);
      expect(resolved.unitId).toBeNull();
    }
  });

  it("defaults to labelled test placeholders rather than live units", async () => {
    const resolved = await resolveAdSlot("TOP_LEADERBOARD", { premium: false });
    // Seeded config has test mode on and no unit id, so nothing live can render.
    if (resolved.render) expect(resolved.mode).toBe("test");
  });
});

describe("in-content ad placement", () => {
  it("splits only at a block boundary", () => {
    const html = "<p>One</p><p>Two</p><p>Three</p><p>Four</p><p>Five</p><p>Six</p>";
    const [first, second] = splitHtmlForInContentAd(html);

    expect(first + second).toBe(html);
    expect(first.endsWith("</p>")).toBe(true);
    expect(second.startsWith("<p>")).toBe(true);
  });

  it("leaves short articles unsplit", () => {
    const html = "<p>Only</p><p>Two</p>";
    expect(splitHtmlForInContentAd(html)).toEqual([html, ""]);
  });

  it("handles empty content", () => {
    expect(splitHtmlForInContentAd("")).toEqual(["", ""]);
  });
});
