import path from "node:path";
import { MiniPrisma } from "@/lib/orm";

function resolveSqliteFile(): string {
  const raw = process.env.DATABASE_URL || "file:./dev.db";
  if (raw.startsWith("file:")) {
    const rel = raw.slice("file:".length);
    if (path.isAbsolute(rel)) return rel;
    return path.resolve(process.cwd(), "database/data", path.basename(rel));
  }
  return path.resolve(process.cwd(), "database/data/haven.db");
}

type Row = Record<string, any>; // Prisma-shaped rows; fields vary by model

export type Delegate = {
  findUnique: (args?: Row) => Promise<Row | null>;
  findFirst: (args?: Row) => Promise<Row | null>;
  findMany: (args?: Row) => Promise<Row[]>;
  create: (args?: Row) => Promise<Row>;
  createMany: (args?: Row) => Promise<{ count: number }>;
  update: (args?: Row) => Promise<Row>;
  updateMany: (args?: Row) => Promise<{ count: number }>;
  delete: (args?: Row) => Promise<Row | null>;
  deleteMany: (args?: Row) => Promise<{ count: number }>;
  count: (args?: Row) => Promise<number>;
  upsert: (args?: Row) => Promise<Row>;
  aggregate: (args?: Row) => Promise<Row>;
};

export type DbClient = MiniPrisma & {
  user: Delegate;
  role: Delegate;
  permission: Delegate;
  rolePermission: Delegate;
  userRole: Delegate;
  session: Delegate;
  oAuthAccount: Delegate;
  recoveryCode: Delegate;
  activityLog: Delegate;
  service: Delegate;
  serviceInstance: Delegate;
  emailDomain: Delegate;
  emailProvider: Delegate;
  temporaryMailbox: Delegate;
  mailboxEvent: Delegate;
  mailboxFavorite: Delegate;
  emailMessage: Delegate;
  emailAttachment: Delegate;
  alias: Delegate;
  forwardingAddress: Delegate;
  blockedSender: Delegate;
  smsProvider: Delegate;
  smsNumber: Delegate;
  smsMessage: Delegate;
  plan: Delegate;
  planPrice: Delegate;
  planLimit: Delegate;
  subscription: Delegate;
  payment: Delegate;
  manualPayment: Delegate;
  paymentMethod: Delegate;
  coupon: Delegate;
  couponRedemption: Delegate;
  referral: Delegate;
  currency: Delegate;
  apiKey: Delegate;
  apiUsage: Delegate;
  apiRequestLog: Delegate;
  webhook: Delegate;
  webhookDelivery: Delegate;
  adNetwork: Delegate;
  adPlacement: Delegate;
  adImpression: Delegate;
  adClick: Delegate;
  blogCategory: Delegate;
  blogTag: Delegate;
  blogPost: Delegate;
  blogPostTag: Delegate;
  faq: Delegate;
  page: Delegate;
  announcement: Delegate;
  translation: Delegate;
  seoEntry: Delegate;
  supportTicket: Delegate;
  ticketReply: Delegate;
  abuseReport: Delegate;
  notification: Delegate;
  auditLog: Delegate;
  securityEvent: Delegate;
  ipBan: Delegate;
  systemSetting: Delegate;
  featureFlag: Delegate;
  rateLimitRule: Delegate;
  analyticsDaily: Delegate;
  jobRun: Delegate;
  contactSubmission: Delegate;
};

const globalForDb = globalThis as unknown as { prisma?: DbClient };

export const prisma: DbClient =
  globalForDb.prisma ?? (new MiniPrisma(resolveSqliteFile()) as unknown as DbClient);

if (process.env.NODE_ENV !== "production") {
  globalForDb.prisma = prisma;
}

export async function pingDb(): Promise<{ ok: boolean; latencyMs: number; detail?: string }> {
  const start = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    return { ok: true, latencyMs: Date.now() - start };
  } catch (err) {
    return {
      ok: false,
      latencyMs: Date.now() - start,
      detail: err instanceof Error ? err.message : "db error",
    };
  }
}
