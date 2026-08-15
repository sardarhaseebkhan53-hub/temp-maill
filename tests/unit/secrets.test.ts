import { describe, expect, it } from "vitest";
import { isMeaningfulSecret } from "@/lib/secrets";

describe("isMeaningfulSecret", () => {
  it("rejects empty, null, and short values", () => {
    expect(isMeaningfulSecret(undefined)).toBe(false);
    expect(isMeaningfulSecret(null)).toBe(false);
    expect(isMeaningfulSecret("")).toBe(false);
    expect(isMeaningfulSecret("   ")).toBe(false);
    expect(isMeaningfulSecret("short")).toBe(false);
  });

  it("rejects the obvious placeholders shipped in the .env example", () => {
    expect(isMeaningfulSecret("REPLACE_WITH_MAILGUN_WEBHOOK_SIGNING_KEY")).toBe(false);
    expect(isMeaningfulSecret("replace_with_anything")).toBe(false);
    expect(isMeaningfulSecret("REPLACE-WITH-")).toBe(false);
    expect(isMeaningfulSecret("your-domain.com")).toBe(false);
    expect(isMeaningfulSecret("YOUR_DOMAIN")).toBe(false);
    expect(isMeaningfulSecret("your_domain")).toBe(false);
  });

  it("accepts realistic Mailgun-shaped secrets", () => {
    // The values below are clearly synthetic. They are just long enough and
    // shaped like a real credential, but they are NOT real API keys. Real
    // operators obtain their credentials from the Mailgun dashboard.
    expect(isMeaningfulSecret("example-signing-key-AAAAAAAAAA-BBB-CCC-DDD-EEEEEEEEEEEE")).toBe(true);
    expect(isMeaningfulSecret("not-a-real-key-just-a-shape-test-value-12345")).toBe(true);
  });
});
