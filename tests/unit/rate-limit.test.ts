import { describe, expect, it } from "vitest";
import { hitRateLimit } from "@/lib/rate-limit";

describe("rate limit", () => {
  it("allows traffic under the cap", async () => {
    const id = `t-${Date.now()}`;
    const a = await hitRateLimit({ ruleKey: "contact.form", identifier: id });
    expect(a.allowed).toBe(true);
  });
});
