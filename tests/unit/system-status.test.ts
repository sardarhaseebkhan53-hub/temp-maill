import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { resetEnvCache } from "@/config/env";
import { getSystemStatus } from "@/server/services/system-status";

function setNodeEnv(value: string) {
  Object.assign(process.env, { NODE_ENV: value });
}

const original = {
  NODE_ENV: process.env.NODE_ENV,
  EMAIL_INBOUND_PROVIDER: process.env.EMAIL_INBOUND_PROVIDER,
  MAILGUN_WEBHOOK_SIGNING_KEY: process.env.MAILGUN_WEBHOOK_SIGNING_KEY,
  AUTH_SECRET: process.env.AUTH_SECRET,
  CRON_SECRET: process.env.CRON_SECRET,
  SMS_PROVIDER: process.env.SMS_PROVIDER,
  STORAGE_DRIVER: process.env.STORAGE_DRIVER,
};

afterEach(() => {
  for (const [key, value] of Object.entries(original)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
  resetEnvCache();
});

beforeEach(() => {
  resetEnvCache();
});

describe("getSystemStatus", () => {
  it("reports mock-only readiness without claiming real production readiness", async () => {
    setNodeEnv("development");
    Object.assign(process.env, {
      EMAIL_INBOUND_PROVIDER: "mock",
      SMS_PROVIDER: "mock",
      STORAGE_DRIVER: "local",
    });
    resetEnvCache();

    const status = await getSystemStatus();
    expect(status.environment).toBe("development");
    expect(status.ready.email).toBe(true); // mock is fine in dev
    expect(status.ready.sms).toBe(false); // mock is never production-ready
    expect(status.ready.storage).toBe(true);
    expect(status.checks.emailInbound.ok).toBe(true);
    expect(status.checks.emailInbound.detail).toMatch(/development|mock|adapter/i);
    expect(status.checks.providers.mailgun?.ok).toBe(false);
  });

  it("rejects placeholder AUTH_SECRET and CRON_SECRET", async () => {
    setNodeEnv("production");
    Object.assign(process.env, {
      AUTH_SECRET: "REPLACE_WITH_LONG_RANDOM_AUTH_SECRET",
      CRON_SECRET: "change-me-cron-secret",
    });
    resetEnvCache();

    const status = await getSystemStatus();
    expect(status.ready.authSecretStrong).toBe(false);
    expect(status.ready.cronSecretStrong).toBe(false);
  });

  it("accepts a real strong AUTH_SECRET", async () => {
    setNodeEnv("production");
    Object.assign(process.env, {
      AUTH_SECRET: "abcdef1234567890abcdef1234567890abcdef12345678",
      CRON_SECRET: "abcdef1234567890abcdef12345678",
    });
    resetEnvCache();
    const status = await getSystemStatus();
    expect(status.ready.authSecretStrong).toBe(true);
    expect(status.ready.cronSecretStrong).toBe(true);
  });

  it("reports ads.test_mode correctly", async () => {
    setNodeEnv("development");
    Object.assign(process.env, {
      EMAIL_INBOUND_PROVIDER: "mock",
      SMS_PROVIDER: "mock",
    });
    resetEnvCache();
    const status = await getSystemStatus();
    expect(status.checks.ads.testMode).toBe(true);
    expect(status.checks.ads.detail).toMatch(/test mode/i);
  });

  it("reports CAPTCH provider state", async () => {
    setNodeEnv("development");
    Object.assign(process.env, { CAPTCHA_PROVIDER: "none" });
    resetEnvCache();
    const status = await getSystemStatus();
    expect(status.checks.captcha.provider).toBe("none");
    expect(status.checks.captcha.ok).toBe(false);
  });
});
