import { describe, expect, it } from "vitest";
import { Errors, toErrorEnvelope } from "@/lib/errors";

describe("error envelope", () => {
  it("never includes a stack", () => {
    const env = toErrorEnvelope(Errors.mailboxExpired(), "abc");
    expect(env.status).toBe(410);
    expect(env.body.success).toBe(false);
    expect(env.body.error.code).toBe("MAILBOX_EXPIRED");
    expect(JSON.stringify(env.body)).not.toMatch(/stack/i);
  });

  it("hides unknown errors", () => {
    const env = toErrorEnvelope(new Error("secret internal"));
    expect(env.status).toBe(500);
    expect(env.body.error.message).not.toContain("secret");
  });
});
