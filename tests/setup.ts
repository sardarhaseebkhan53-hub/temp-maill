import path from "node:path";
import { mkdirSync } from "node:fs";

if (!process.env.NODE_ENV) {
  Object.assign(process.env, { NODE_ENV: "test" });
}
process.env.AUTH_SECRET = process.env.AUTH_SECRET || "test-auth-secret-please-change-32bxx";
process.env.DATABASE_URL = process.env.DATABASE_URL || `file:${path.resolve(process.cwd(), "database/data/test.db")}`;
process.env.EMAIL_INBOUND_PROVIDER = "mock";
process.env.SMS_PROVIDER = "mock";
process.env.PAYMENT_PROVIDER = "manual";
mkdirSync(path.resolve(process.cwd(), "database/data"), { recursive: true });
