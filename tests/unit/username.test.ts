import { describe, expect, it } from "vitest";
import { randomLocalPart, validateLocalPart } from "@/lib/username";

describe("usernames", () => {
  it("accepts a normal local part", () => {
    const r = validateLocalPart("quietcove");
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value).toBe("quietcove");
  });

  it("rejects reserved names", () => {
    expect(validateLocalPart("admin").ok).toBe(false);
    expect(validateLocalPart("postmaster").ok).toBe(false);
  });

  it("rejects profanity", () => {
    expect(validateLocalPart("fuckoff").ok).toBe(false);
  });

  it("rejects short or illegal characters", () => {
    expect(validateLocalPart("ab").ok).toBe(false);
    expect(validateLocalPart("bad name").ok).toBe(false);
    expect(validateLocalPart("-leading").ok).toBe(false);
  });

  it("generates a valid random local part", () => {
    for (let i = 0; i < 20; i++) {
      const v = validateLocalPart(randomLocalPart());
      expect(v.ok).toBe(true);
    }
  });
});
