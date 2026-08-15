import { describe, expect, it } from "vitest";
import { detectOtpCode, detectOtpInEmail } from "@/lib/otp";

describe("OTP detection", () => {
  it("detects a code announced by a keyword", () => {
    expect(detectOtpCode("Your verification code is 482913")).toBe("482913");
    expect(detectOtpCode("482913 is your login code")).toBe("482913");
    expect(detectOtpCode("Your OTP: 12345678.")).toBe("12345678");
    expect(detectOtpCode("Code: 482 913 — expires soon")).toBe("482913");
    expect(detectOtpCode("Your security code: 482-913")).toBe("482913");
    expect(detectOtpCode("Utilisez le code 771234 pour continuer")).toBe("771234");
  });

  it("detects classic prefixed and bare-code messages", () => {
    expect(detectOtpCode("G-482913 is your Google verification code")).toBe("482913");
    expect(detectOtpCode("482913")).toBe("482913");
  });

  it("does not invent codes for ordinary numbers", () => {
    expect(detectOtpCode("Order #591823 has shipped")).toBeNull();
    expect(detectOtpCode("Meeting at 1830 hours, room 204")).toBeNull();
    expect(detectOtpCode("Call +1 415 555 2671 tomorrow")).toBeNull();
    expect(detectOtpCode("Your invoice total is $1,204.99")).toBeNull();
    expect(detectOtpCode("")).toBeNull();
    expect(detectOtpCode(null)).toBeNull();
    expect(detectOtpCode(undefined)).toBeNull();
  });

  it("rejects trivially guessable placeholders", () => {
    expect(detectOtpCode("Enter 000000 to proceed")).toBeNull();
    expect(detectOtpCode("PIN 123456")).toBe("123456");
  });

  it("keeps codes within 4–8 digits", () => {
    expect(detectOtpCode("code 123")).toBeNull();
    expect(detectOtpCode("code 123456789")).toBeNull();
  });

  it("extracts codes from HTML email content without executing it", () => {
    const html = `<p>Hello,</p><p>Your <b>verification code</b> is <strong>77 42 91</strong></p><script>alert(1)</script>`;
    expect(detectOtpInEmail("", html)).toBe("774291");
    // and stays null when no code exists
    expect(detectOtpInEmail("no code here", "<p>Hello there</p>")).toBeNull();
    // text body takes precedence
    expect(detectOtpInEmail("Your code is 555111", html)).toBe("555111");
  });
});
