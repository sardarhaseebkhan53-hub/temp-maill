import { describe, expect, it } from "vitest";
import { classifyAttachment, sanitizeEmailHtml } from "@/lib/sanitize";

describe("email HTML sanitizer", () => {
  it("strips script tags", () => {
    const out = sanitizeEmailHtml(`<p>Hi</p><script>alert(1)</script>`);
    expect(out).not.toMatch(/script/i);
    expect(out).toMatch(/Hi/);
  });

  it("strips event handlers", () => {
    const out = sanitizeEmailHtml(`<img src="https://x.test/a.png" onerror="alert(1)">`);
    expect(out.toLowerCase()).not.toContain("onerror");
  });

  it("blocks javascript URIs", () => {
    const out = sanitizeEmailHtml(`<a href="javascript:alert(1)">x</a>`);
    expect(out.toLowerCase()).not.toContain("javascript:");
  });

  it("blocks non-image data URIs", () => {
    const out = sanitizeEmailHtml(`<img src="data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==">`);
    expect(out).not.toContain("data:text/html");
  });

  it("keeps safe links with rel", () => {
    const out = sanitizeEmailHtml(`<a href="https://example.com">ok</a>`);
    expect(out).toContain("https://example.com");
    expect(out).toContain("noopener");
  });
});

describe("attachments", () => {
  it("blocks executables", () => {
    expect(classifyAttachment("payload.exe", "application/octet-stream").blocked).toBe(true);
    expect(classifyAttachment("note.pdf", "application/pdf").blocked).toBe(false);
  });
});
