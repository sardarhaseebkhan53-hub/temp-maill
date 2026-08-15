import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const KEYS = [
  "NODE_ENV",
  "ADMIN_EMAIL",
  "ADMIN_PASSWORD",
  "APP_URL",
  "DATABASE_URL",
  "AUTH_SECRET",
  "SMTP_PORT",
  "MAILBOX_TTL_MINUTES",
  "EMAIL_INBOUND_PROVIDER",
  "CRON_SECRET",
] as const;

let saved: Record<string, string | undefined> = {};

/** `NODE_ENV` is typed read-only, so go through Object.assign. */
function setNodeEnv(value: string) {
  Object.assign(process.env, { NODE_ENV: value });
}

/** Load a fresh copy of the module so its internal cache is empty. */
async function loadEnv() {
  vi.resetModules();
  return import("@/config/env");
}

beforeEach(() => {
  saved = {};
  for (const key of KEYS) saved[key] = process.env[key];
});

afterEach(() => {
  for (const key of KEYS) {
    if (saved[key] === undefined) delete process.env[key];
    else Object.assign(process.env, { [key]: saved[key] });
  }
  vi.restoreAllMocks();
});

describe("getEnv", () => {
  it("applies defaults when a variable is absent", async () => {
    delete process.env.ADMIN_EMAIL;
    const { getEnv } = await loadEnv();
    expect(getEnv().ADMIN_EMAIL).toBe("admin@haven.local");
  });

  it("treats an empty assignment as unset instead of throwing", async () => {
    process.env.ADMIN_EMAIL = "";
    const { getEnv } = await loadEnv();
    expect(getEnv().ADMIN_EMAIL).toBe("admin@haven.local");
  });

  it("trims surrounding whitespace from values", async () => {
    process.env.ADMIN_EMAIL = "  ops@haven.dev  ";
    const { getEnv } = await loadEnv();
    expect(getEnv().ADMIN_EMAIL).toBe("ops@haven.dev");
  });

  it("strips wrapping quotes copied from .env files", async () => {
    process.env.ADMIN_EMAIL = '"ops@haven.dev"';
    process.env.DATABASE_URL = "'file:./dev.db'";
    const { getEnv } = await loadEnv();
    expect(getEnv().ADMIN_EMAIL).toBe("ops@haven.dev");
    expect(getEnv().DATABASE_URL).toBe("file:./dev.db");
  });

  it("falls back to the default and warns for an invalid value in development", async () => {
    setNodeEnv("development");
    process.env.ADMIN_EMAIL = "not-an-email";
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const { getEnv } = await loadEnv();
    expect(getEnv().ADMIN_EMAIL).toBe("admin@haven.local");
    expect(warn).toHaveBeenCalledOnce();
    expect(String(warn.mock.calls[0]?.[0])).toContain("ADMIN_EMAIL");
  });

  it("keeps valid values when another variable is invalid", async () => {
    setNodeEnv("development");
    process.env.ADMIN_EMAIL = "not-an-email";
    process.env.APP_NAME = "Custom";
    process.env.MAILBOX_TTL_MINUTES = "42";
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const { getEnv } = await loadEnv();
    expect(getEnv().MAILBOX_TTL_MINUTES).toBe(42);
    expect(getEnv().ADMIN_EMAIL).toBe("admin@haven.local");
  });

  it("throws in production so bad config fails the deploy", async () => {
    setNodeEnv("production");
    process.env.ADMIN_EMAIL = "not-an-email";
    const { getEnv } = await loadEnv();
    expect(() => getEnv()).toThrow(/ADMIN_EMAIL/);
  });

  it("caches the parsed result", async () => {
    process.env.ADMIN_EMAIL = "first@haven.dev";
    const { getEnv } = await loadEnv();
    expect(getEnv().ADMIN_EMAIL).toBe("first@haven.dev");
    process.env.ADMIN_EMAIL = "second@haven.dev";
    expect(getEnv().ADMIN_EMAIL).toBe("first@haven.dev");
  });

  it("resetEnvCache re-reads the environment", async () => {
    process.env.ADMIN_EMAIL = "first@haven.dev";
    const { getEnv, resetEnvCache } = await loadEnv();
    expect(getEnv().ADMIN_EMAIL).toBe("first@haven.dev");
    process.env.ADMIN_EMAIL = "second@haven.dev";
    resetEnvCache();
    expect(getEnv().ADMIN_EMAIL).toBe("second@haven.dev");
  });

  it("missingProductionEnv reports variables left unset", async () => {
    delete process.env.ADMIN_EMAIL;
    const { missingProductionEnv } = await loadEnv();
    expect(missingProductionEnv()).toContain("ADMIN_EMAIL");
  });
});
