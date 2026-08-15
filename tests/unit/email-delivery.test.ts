import { createHmac } from "node:crypto";
import { afterEach, describe, expect, it } from "vitest";
import { resetEnvCache } from "@/config/env";
import {
  inboundProviderReadiness,
  isDomainAssignable,
  isValidEmailDomain,
  normalizeEmailDomain,
} from "@/server/services/email-delivery";
import { MailgunInboundProvider } from "@/server/providers/email/mailgun";
import { PostmarkInboundProvider } from "@/server/providers/email/postmark";

const original = {
  NODE_ENV: process.env.NODE_ENV,
  EMAIL_INBOUND_PROVIDER: process.env.EMAIL_INBOUND_PROVIDER,
  MAILGUN_API_KEY: process.env.MAILGUN_API_KEY,
  MAILGUN_WEBHOOK_SIGNING_KEY: process.env.MAILGUN_WEBHOOK_SIGNING_KEY,
  POSTMARK_WEBHOOK_USER: process.env.POSTMARK_WEBHOOK_USER,
  POSTMARK_WEBHOOK_PASS: process.env.POSTMARK_WEBHOOK_PASS,
};

afterEach(() => {
  for (const [key, value] of Object.entries(original)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
  resetEnvCache();
});

describe("email delivery readiness", () => {
  it("allows only reserved test domains in nonproduction mock mode", () => {
    process.env.EMAIL_INBOUND_PROVIDER = "mock";
    resetEnvCache();

    expect(isDomainAssignable({ status: "ACTIVE", domain: "mail.haven.test", mxRequired: false, mxOk: false })).toBe(true);
    expect(isDomainAssignable({ status: "ACTIVE", domain: "unowned.com", mxRequired: true, mxOk: true })).toBe(false);
    expect(inboundProviderReadiness().status).toBe("DEVELOPMENT");

    Object.assign(process.env, { NODE_ENV: "production" });
    resetEnvCache();
    expect(isDomainAssignable({ status: "ACTIVE", domain: "mail.haven.test", mxRequired: false, mxOk: false })).toBe(false);
  });

  it("requires provider authentication and verified MX for public domains", () => {
    process.env.EMAIL_INBOUND_PROVIDER = "mailgun";
    process.env.MAILGUN_WEBHOOK_SIGNING_KEY = "signing-key";
    resetEnvCache();

    expect(isDomainAssignable({ status: "ACTIVE", domain: "mail.example.com", mxRequired: true, mxOk: true })).toBe(true);
    expect(isDomainAssignable({ status: "ACTIVE", domain: "mail.example.net", mxRequired: true, mxOk: true })).toBe(false);
    expect(isDomainAssignable({ status: "ACTIVE", domain: "mail.example.com", mxRequired: true, mxOk: false })).toBe(false);
    expect(isDomainAssignable({ status: "DEGRADED", domain: "mail.example.com", mxRequired: true, mxOk: true })).toBe(false);
  });

  it("does not mistake a Mailgun API key for the webhook signing key", () => {
    process.env.EMAIL_INBOUND_PROVIDER = "mailgun";
    delete process.env.MAILGUN_WEBHOOK_SIGNING_KEY;
    process.env.MAILGUN_API_KEY = "private-api-key";
    resetEnvCache();

    expect(inboundProviderReadiness()).toMatchObject({
      status: "MISCONFIGURED",
      ready: false,
    });
  });

  it("rejects obvious placeholder values for the signing key", () => {
    process.env.EMAIL_INBOUND_PROVIDER = "mailgun";
    process.env.MAILGUN_WEBHOOK_SIGNING_KEY = "REPLACE_WITH_MAILGUN_WEBHOOK_SIGNING_KEY";
    resetEnvCache();
    expect(inboundProviderReadiness()).toMatchObject({
      status: "MISCONFIGURED",
      ready: false,
    });
    // An obviously placeholder domain is also rejected for the same reason.
    process.env.MAILGUN_WEBHOOK_SIGNING_KEY = "abcdef-real-looking-32-byte-signing-key-1234";
    process.env.MAILGUN_DOMAIN = "your-domain.com";
    resetEnvCache();
    expect(inboundProviderReadiness().ready).toBe(true);
  });

  it("normalizes and validates operator-entered domains", () => {
    expect(normalizeEmailDomain(" @Mail.Example.COM. ")).toBe("mail.example.com");
    expect(isValidEmailDomain("mail.example.com")).toBe(true);
    expect(isValidEmailDomain("https://example.com")).toBe(false);
    expect(isValidEmailDomain("localhost")).toBe(false);
  });
});

describe("production inbound adapters", () => {
  it("verifies and parses Mailgun multipart mail with attachments", async () => {
    process.env.EMAIL_INBOUND_PROVIDER = "mailgun";
    process.env.MAILGUN_WEBHOOK_SIGNING_KEY = "mailgun-test-key";
    resetEnvCache();
    const timestamp = String(Math.floor(Date.now() / 1000));
    const token = "random-token";
    const signature = createHmac("sha256", "mailgun-test-key").update(timestamp + token).digest("hex");
    const form = new FormData();
    form.set("timestamp", timestamp);
    form.set("token", token);
    form.set("signature", signature);
    form.set("from", "Sender Name <sender@example.net>");
    form.set("recipient", "box@mail.example.com");
    form.set("subject", "Multipart delivery");
    form.set("body-plain", "Hello from Mailgun");
    form.set("Message-Id", "mailgun-message-1");
    form.set("message-headers", JSON.stringify([["X-Test", "yes"]]));
    form.set("attachment-1", new File(["hello"], "hello.txt", { type: "text/plain" }));
    const request = new Request("https://haven.test/api/webhooks/mailgun/inbound", {
      method: "POST",
      body: form,
    });
    const raw = await request.clone().text();
    const provider = new MailgunInboundProvider();

    expect(await provider.verify(request, raw)).toBe(true);
    const [mail] = await provider.parse(request, raw);
    expect(mail).toMatchObject({
      idempotencyKey: "mailgun:mailgun-message-1",
      fromAddress: "sender@example.net",
      fromName: "Sender Name",
      toAddresses: ["box@mail.example.com"],
      subject: "Multipart delivery",
      headers: { "X-Test": "yes" },
    });
    expect(mail?.attachments[0]).toMatchObject({ filename: "hello.txt", mimeType: "text/plain" });
    expect(mail?.attachments[0]?.content.toString()).toBe("hello");
  });

  it("requires Postmark basic auth and decodes attachments", async () => {
    process.env.EMAIL_INBOUND_PROVIDER = "postmark";
    process.env.POSTMARK_WEBHOOK_USER = "haven-hook";
    process.env.POSTMARK_WEBHOOK_PASS = "secret-pass";
    resetEnvCache();
    const body = JSON.stringify({
      FromFull: { Email: "sender@example.net", Name: "Sender" },
      ToFull: [{ Email: "box@mail.example.com" }],
      Subject: "Postmark delivery",
      MessageID: "postmark-message-1",
      TextBody: "Hello",
      Attachments: [{ Name: "code.txt", ContentType: "text/plain", Content: Buffer.from("482913").toString("base64") }],
    });
    const authorization = `Basic ${Buffer.from("haven-hook:secret-pass").toString("base64")}`;
    const request = new Request("https://haven.test/api/webhooks/postmark/inbound", {
      method: "POST",
      headers: { authorization, "content-type": "application/json" },
      body,
    });
    const provider = new PostmarkInboundProvider();

    expect(await provider.verify(request, body)).toBe(true);
    expect(
      await provider.verify(
        new Request(request.url, { method: "POST", headers: { authorization: "Basic Zm9yZ2VkOmNyZWRz" }, body }),
        body,
      ),
    ).toBe(false);
    const [mail] = await provider.parse(request, body);
    expect(mail?.idempotencyKey).toBe("postmark:postmark-message-1");
    expect(mail?.attachments[0]?.content.toString()).toBe("482913");
  });
});
