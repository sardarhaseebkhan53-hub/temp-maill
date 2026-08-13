import { describe, expect, it } from "vitest";
import { generateApiKey, hashPassword, hashSecret, verifyPassword } from "@/lib/crypto";

describe("crypto", () => {
  it("hashes and verifies argon2id passwords", async () => {
    const hash = await hashPassword("Correct-Horse-1");
    expect(hash.startsWith("argon2id$")).toBe(true);
    expect(await verifyPassword("Correct-Horse-1", hash)).toBe(true);
    expect(await verifyPassword("wrong", hash)).toBe(false);
  });

  it("generates prefixed API keys", () => {
    const live = generateApiKey("live");
    expect(live.plaintext.startsWith("tmp_live_")).toBe(true);
    expect(hashSecret(live.plaintext)).toHaveLength(64);
    const test = generateApiKey("test");
    expect(test.plaintext.startsWith("tmp_test_")).toBe(true);
  });
});
