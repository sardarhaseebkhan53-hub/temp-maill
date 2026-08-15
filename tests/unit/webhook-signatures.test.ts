import { createHmac, generateKeyPairSync, sign as cryptoSign } from "node:crypto";
import { describe, expect, it } from "vitest";
import { twilioSignature } from "@/server/providers/sms/twilio";
import { telnyxVerify } from "@/server/providers/sms/telnyx";
import { vonageSignature } from "@/server/providers/sms/vonage";

describe("Twilio webhook signature", () => {
  const url = "https://haven.example.com/api/webhooks/twilio/sms";
  const token = "test-auth-token-0123456789abcdef";
  const params = { To: "+12025550143", From: "+13105550199", Body: "Your code is 482913", MessageSid: "SM123" };

  it("validates a genuine signature", () => {
    const sorted = Object.keys(params).sort().map((k) => `${k}${(params as Record<string, string>)[k]}`).join("");
    const expected = createHmac("sha1", token).update(url + sorted).digest("base64");
    // Independent computation (hello-world order equals Twilio's ordering here).
    expect(twilioSignature(url, params, token)).toBe(expected);
  });

  it("changes when the URL or body changes (no replay across endpoints)", () => {
    const a = twilioSignature(url, params, token);
    expect(twilioSignature("https://haven.example.com/other", params, token)).not.toBe(a);
    expect(twilioSignature(url, { ...params, Body: "tampered" }, token)).not.toBe(a);
    expect(twilioSignature(url, params, "other-token")).not.toBe(a);
  });
});

describe("Telnyx webhook signature (Ed25519)", () => {
  const { publicKey, privateKey } = generateKeyPairSync("ed25519");
  const rawPublic = publicKey.export({ format: "der", type: "spki" }).subarray(-32).toString("base64");
  const timestamp = String(Math.floor(Date.now() / 1000));
  const body = '{"data":{"event_type":"message.received","payload":{"text":"hi"}}}';

  it("validates a genuine signature", () => {
    const sig = cryptoSign(null, Buffer.from(`${timestamp}|${body}`), privateKey).toString("base64");
    expect(telnyxVerify(rawPublic, timestamp, body, sig)).toBe(true);
  });

  it("rejects forged payloads and wrong timestamps", () => {
    const sig = cryptoSign(null, Buffer.from(`${timestamp}|${body}`), privateKey).toString("base64");
    expect(telnyxVerify(rawPublic, timestamp, '{"data":{}}', sig)).toBe(false);
    expect(telnyxVerify(rawPublic, String(Number(timestamp) + 30), body, sig)).toBe(false);
    expect(telnyxVerify(rawPublic, timestamp, body, "aW52YWxpZHNpZw==")).toBe(false);
  });
});

describe("Vonage webhook signature", () => {
  const secret = "vonage-secret-123";
  const params = { msisdn: "447700900000", to: "12025550143", messageId: "0A00...", text: "hi", "message-timestamp": "2026-08-14 12:00:00" };

  it("produces the documented md5 form and the sha256-hmac form", () => {
    const md5 = vonageSignature(params, secret, "md5");
    const hmac = vonageSignature(params, secret, "sha256_hmac");
    expect(md5).toMatch(/^[0-9a-f]{32}$/);
    expect(hmac).toMatch(/^[0-9a-f]{64}$/);
    expect(vonageSignature(params, secret + "x", "md5")).not.toBe(md5);
    expect(vonageSignature({ ...params, text: "changed" }, secret, "md5")).not.toBe(md5);
  });

  it("excludes the sig parameter itself", () => {
    const withSig = { ...params, sig: "whatever" };
    expect(vonageSignature(withSig, secret, "md5")).toBe(vonageSignature(params, secret, "md5"));
  });
});
