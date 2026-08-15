import { DatabaseSync } from "node:sqlite";
import { readFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import { randomBytes } from "node:crypto";

const RESERVED = new Set(["group", "limit", "order", "index", "key"]);
const BOOL_FIELDS = new Set([
  "enabled",
  "isSystem",
  "totpEnabled",
  "mxRequired",
  "mxOk",
  "catchAll",
  "custom",
  "sandbox",
  "spamFlag",
  "read",
  "starred",
  "hasAttachments",
  "blocked",
  "isPublic",
  "isDefault",
  "lifetime",
  "active",
  "cancelAtPeriodEnd",
  "dismissible",
  "published",
  "noindex",
  "staff",
  "handled",
  "excludePremium",
]);
const DATE_SUFFIX = /At$/;
const DATE_FIELDS = new Set([
  "expiresAt",
  "currentPeriodStart",
  "currentPeriodEnd",
  "trialEndsAt",
  "validFrom",
  "validUntil",
  "activeFrom",
  "activeTo",
  "nextRetryAt",
  "publishedAt",
  "reviewedAt",
  "finishedAt",
  "startedAt",
  "receivedAt",
  "lastSeenAt",
  "lastHealthAt",
  "lastExtendedAt",
  "lastMessageAt",
  "lastActivityAt",
  "lastUsedAt",
  "lastLoginAt",
  "emailVerifiedAt",
  "deletedAt",
  "purgedAt",
  "revokedAt",
  "canceledAt",
  "usedAt",
  "readAt",
  "graceUntil",
  "quarantineUntil",
  "assignedAt",
  "createdAt",
  "updatedAt",
]);

function col(name: string): string {
  return RESERVED.has(name) ? `"${name}"` : name;
}

function cuid(): string {
  return `c${Date.now().toString(36)}${randomBytes(8).toString("hex")}`;
}

function nowIso(): string {
  return new Date().toISOString();
}

interface ColumnInfo {
  name: string;
  required: boolean;
}

type Rel =
  | { kind: "many"; model: string; fk: string }
  | { kind: "one"; model: string; fk: string; owner?: boolean };

const REL: Record<string, Record<string, Rel>> = {
  User: {
    referredBy: { kind: "one", model: "User", fk: "referredById" },
    referralsMade: { kind: "many", model: "User", fk: "referredById" },
    roles: { kind: "many", model: "UserRole", fk: "userId" },
    sessions: { kind: "many", model: "Session", fk: "userId" },
    oauthAccounts: { kind: "many", model: "OAuthAccount", fk: "userId" },
    recoveryCodes: { kind: "many", model: "RecoveryCode", fk: "userId" },
    apiKeys: { kind: "many", model: "ApiKey", fk: "userId" },
    mailboxes: { kind: "many", model: "TemporaryMailbox", fk: "userId" },
    aliases: { kind: "many", model: "Alias", fk: "userId" },
    favorites: { kind: "many", model: "MailboxFavorite", fk: "userId" },
    subscriptions: { kind: "many", model: "Subscription", fk: "userId" },
    payments: { kind: "many", model: "Payment", fk: "userId" },
    notifications: { kind: "many", model: "Notification", fk: "userId" },
    tickets: { kind: "many", model: "SupportTicket", fk: "userId" },
    abuseReports: { kind: "many", model: "AbuseReport", fk: "userId" },
    activityLogs: { kind: "many", model: "ActivityLog", fk: "userId" },
    forwardingAddresses: { kind: "many", model: "ForwardingAddress", fk: "userId" },
    blockedSenders: { kind: "many", model: "BlockedSender", fk: "userId" },
    serviceInstances: { kind: "many", model: "ServiceInstance", fk: "userId" },
    manualPayments: { kind: "many", model: "ManualPayment", fk: "userId" },
  },
  Role: {
    permissions: { kind: "many", model: "RolePermission", fk: "roleId" },
    users: { kind: "many", model: "UserRole", fk: "roleId" },
  },
  Permission: { roles: { kind: "many", model: "RolePermission", fk: "permissionId" } },
  RolePermission: {
    role: { kind: "one", model: "Role", fk: "roleId" },
    permission: { kind: "one", model: "Permission", fk: "permissionId" },
  },
  UserRole: {
    user: { kind: "one", model: "User", fk: "userId" },
    role: { kind: "one", model: "Role", fk: "roleId" },
  },
  Session: { user: { kind: "one", model: "User", fk: "userId" } },
  Service: { instances: { kind: "many", model: "ServiceInstance", fk: "serviceId" } },
  ServiceInstance: {
    service: { kind: "one", model: "Service", fk: "serviceId" },
    user: { kind: "one", model: "User", fk: "userId" },
    mailbox: { kind: "one", model: "TemporaryMailbox", fk: "serviceInstanceId", owner: true },
    smsNumber: { kind: "one", model: "SmsNumber", fk: "serviceInstanceId", owner: true },
  },
  EmailDomain: {
    mailboxes: { kind: "many", model: "TemporaryMailbox", fk: "domainId" },
    aliases: { kind: "many", model: "Alias", fk: "domainId" },
  },
  TemporaryMailbox: {
    serviceInstance: { kind: "one", model: "ServiceInstance", fk: "serviceInstanceId" },
    domain: { kind: "one", model: "EmailDomain", fk: "domainId" },
    user: { kind: "one", model: "User", fk: "userId" },
    messages: { kind: "many", model: "EmailMessage", fk: "mailboxId" },
    events: { kind: "many", model: "MailboxEvent", fk: "mailboxId" },
    favorites: { kind: "many", model: "MailboxFavorite", fk: "mailboxId" },
  },
  EmailMessage: {
    mailbox: { kind: "one", model: "TemporaryMailbox", fk: "mailboxId" },
    attachments: { kind: "many", model: "EmailAttachment", fk: "messageId" },
  },
  EmailAttachment: { message: { kind: "one", model: "EmailMessage", fk: "messageId" } },
  Alias: {
    user: { kind: "one", model: "User", fk: "userId" },
    domain: { kind: "one", model: "EmailDomain", fk: "domainId" },
    forwardTo: { kind: "one", model: "ForwardingAddress", fk: "forwardToId" },
  },
  SmsProvider: { numbers: { kind: "many", model: "SmsNumber", fk: "providerId" } },
  SmsNumber: {
    serviceInstance: { kind: "one", model: "ServiceInstance", fk: "serviceInstanceId" },
    provider: { kind: "one", model: "SmsProvider", fk: "providerId" },
    messages: { kind: "many", model: "SmsMessage", fk: "numberId" },
  },
  SmsMessage: { number: { kind: "one", model: "SmsNumber", fk: "numberId" } },
  Plan: {
    prices: { kind: "many", model: "PlanPrice", fk: "planId" },
    limits: { kind: "many", model: "PlanLimit", fk: "planId" },
    subscriptions: { kind: "many", model: "Subscription", fk: "planId" },
  },
  PlanPrice: { plan: { kind: "one", model: "Plan", fk: "planId" } },
  PlanLimit: { plan: { kind: "one", model: "Plan", fk: "planId" } },
  Subscription: {
    user: { kind: "one", model: "User", fk: "userId" },
    plan: { kind: "one", model: "Plan", fk: "planId" },
    payments: { kind: "many", model: "Payment", fk: "subscriptionId" },
  },
  Payment: {
    user: { kind: "one", model: "User", fk: "userId" },
    subscription: { kind: "one", model: "Subscription", fk: "subscriptionId" },
    manual: { kind: "one", model: "ManualPayment", fk: "paymentId", owner: true },
  },
  ManualPayment: {
    payment: { kind: "one", model: "Payment", fk: "paymentId" },
    user: { kind: "one", model: "User", fk: "userId" },
  },
  Coupon: { redemptions: { kind: "many", model: "CouponRedemption", fk: "couponId" } },
  ApiKey: {
    user: { kind: "one", model: "User", fk: "userId" },
    usage: { kind: "many", model: "ApiUsage", fk: "apiKeyId" },
  },
  Webhook: {
    user: { kind: "one", model: "User", fk: "userId" },
    deliveries: { kind: "many", model: "WebhookDelivery", fk: "webhookId" },
  },
  WebhookDelivery: { webhook: { kind: "one", model: "Webhook", fk: "webhookId" } },
  AdNetwork: { placements: { kind: "many", model: "AdPlacement", fk: "networkId" } },
  AdPlacement: {
    network: { kind: "one", model: "AdNetwork", fk: "networkId" },
    impressions: { kind: "many", model: "AdImpression", fk: "placementId" },
    clicks: { kind: "many", model: "AdClick", fk: "placementId" },
  },
  BlogCategory: { posts: { kind: "many", model: "BlogPost", fk: "categoryId" } },
  BlogPost: {
    category: { kind: "one", model: "BlogCategory", fk: "categoryId" },
    tags: { kind: "many", model: "BlogPostTag", fk: "postId" },
  },
  SupportTicket: {
    user: { kind: "one", model: "User", fk: "userId" },
    replies: { kind: "many", model: "TicketReply", fk: "ticketId" },
  },
  TicketReply: {
    ticket: { kind: "one", model: "SupportTicket", fk: "ticketId" },
    user: { kind: "one", model: "User", fk: "userId" },
  },
};

const UNIQUES: Record<string, string[][]> = {
  User: [["email"], ["referralCode"], ["id"]],
  Role: [["key"], ["id"]],
  Permission: [["key"], ["id"]],
  RolePermission: [["roleId", "permissionId"]],
  UserRole: [["userId", "roleId"]],
  Session: [["tokenHash"], ["id"]],
  Service: [["key"], ["id"]],
  ServiceInstance: [["id"]],
  EmailDomain: [["domain"], ["id"]],
  EmailProvider: [["key"], ["id"]],
  TemporaryMailbox: [["address"], ["publicToken"], ["serviceInstanceId"], ["id"]],
  EmailMessage: [["idempotencyKey"], ["id"]],
  EmailAttachment: [["id"]],
  Alias: [["address"], ["id"]],
  SmsProvider: [["key"], ["id"]],
  SmsNumber: [["serviceInstanceId"], ["id"]],
  SmsMessage: [["idempotencyKey"], ["id"]],
  Plan: [["key"], ["id"]],
  PlanPrice: [["planId", "currency", "interval"], ["id"]],
  PlanLimit: [["planId", "key"], ["id"]],
  Subscription: [["id"]],
  Payment: [["id"]],
  ManualPayment: [["paymentId"], ["id"]],
  PaymentMethod: [["key"], ["id"]],
  Coupon: [["code"], ["id"]],
  CouponRedemption: [["couponId", "userId"]],
  Referral: [["refereeId"], ["id"]],
  Currency: [["code"], ["id"]],
  ApiKey: [["keyHash"], ["id"]],
  ApiUsage: [["apiKeyId", "day"], ["id"]],
  Webhook: [["id"]],
  WebhookDelivery: [["id"]],
  AdNetwork: [["key"], ["id"]],
  AdPlacement: [["key"], ["id"]],
  AdImpression: [["placementId", "day"], ["id"]],
  AdClick: [["placementId", "day"], ["id"]],
  BlogCategory: [["slug"], ["id"]],
  BlogTag: [["slug"], ["id"]],
  BlogPost: [["slug"], ["id"]],
  Page: [["slug"], ["id"]],
  SystemSetting: [["key"], ["id"]],
  FeatureFlag: [["key"], ["id"]],
  RateLimitRule: [["key"], ["id"]],
  AnalyticsDaily: [["day"], ["id"]],
  SeoEntry: [["path"], ["id"]],
  IpBan: [["cidr"], ["id"]],
  Translation: [["locale", "namespace", "key"]],
  Faq: [["id"]],
  Announcement: [["id"]],
  SupportTicket: [["id"]],
  AbuseReport: [["id"]],
  Notification: [["id"]],
  AuditLog: [["id"]],
  SecurityEvent: [["id"]],
  JobRun: [["id"]],
  ContactSubmission: [["id"]],
  MailboxEvent: [["id"]],
  MailboxFavorite: [["userId", "mailboxId"], ["id"]],
  ForwardingAddress: [["userId", "email"], ["id"]],
  BlockedSender: [["id"]],
  OAuthAccount: [["provider", "providerAccountId"], ["id"]],
  RecoveryCode: [["id"]],
  ActivityLog: [["id"]],
  ApiRequestLog: [["id"]],
  TicketReply: [["id"]],
  BlogPostTag: [["postId", "tagId"]],
};

const MODELS = [
  "User",
  "Role",
  "Permission",
  "RolePermission",
  "UserRole",
  "Session",
  "OAuthAccount",
  "RecoveryCode",
  "ActivityLog",
  "Service",
  "ServiceInstance",
  "EmailDomain",
  "EmailProvider",
  "TemporaryMailbox",
  "MailboxEvent",
  "MailboxFavorite",
  "EmailMessage",
  "EmailAttachment",
  "Alias",
  "ForwardingAddress",
  "BlockedSender",
  "SmsProvider",
  "SmsNumber",
  "SmsMessage",
  "Plan",
  "PlanPrice",
  "PlanLimit",
  "Subscription",
  "Payment",
  "ManualPayment",
  "PaymentMethod",
  "Coupon",
  "CouponRedemption",
  "Referral",
  "Currency",
  "ApiKey",
  "ApiUsage",
  "ApiRequestLog",
  "Webhook",
  "WebhookDelivery",
  "AdNetwork",
  "AdPlacement",
  "AdImpression",
  "AdClick",
  "BlogCategory",
  "BlogTag",
  "BlogPost",
  "BlogPostTag",
  "Faq",
  "Page",
  "Announcement",
  "Translation",
  "SeoEntry",
  "SupportTicket",
  "TicketReply",
  "AbuseReport",
  "Notification",
  "AuditLog",
  "SecurityEvent",
  "IpBan",
  "SystemSetting",
  "FeatureFlag",
  "RateLimitRule",
  "AnalyticsDaily",
  "JobRun",
  "ContactSubmission",
] as const;

type AnyRec = Record<string, unknown>;

function encode(field: string, value: unknown): unknown {
  if (value === undefined) return null;
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "boolean") return value ? 1 : 0;
  if (BOOL_FIELDS.has(field) && typeof value === "number") return value;
  if (typeof value === "object" && value !== null) return JSON.stringify(value);
  return value;
}

function decodeRow(row: AnyRec | undefined | null): AnyRec | null {
  if (!row) return null;
  const out: AnyRec = {};
  for (const [k, v] of Object.entries(row)) {
    if (v == null) {
      out[k] = v;
      continue;
    }
    if (BOOL_FIELDS.has(k)) {
      out[k] = Boolean(v);
      continue;
    }
    if ((DATE_FIELDS.has(k) || DATE_SUFFIX.test(k)) && typeof v === "string" && v) {
      out[k] = new Date(v);
      continue;
    }
    out[k] = v;
  }
  return out;
}

function flattenWhere(model: string, where?: AnyRec): AnyRec | undefined {
  if (!where) return where;
  const out: AnyRec = {};
  for (const [k, v] of Object.entries(where)) {
    if (k === "OR" || k === "AND" || k === "NOT") {
      out[k] = v;
      continue;
    }
    // Only expand genuine compound-unique lookups such as
    // `{ placementId_day: { placementId, day } }`. A single-column unique
    // named e.g. `key` must not swallow a filter object like
    // `{ key: { not: "FREE" } }`.
    const uniques = UNIQUES[model] || [];
    const match = uniques.find((u) => u.length > 1 && u.join("_") === k);
    if (
      match &&
      v &&
      typeof v === "object" &&
      !Array.isArray(v) &&
      !(v instanceof Date) &&
      match.every((field) => field in (v as AnyRec))
    ) {
      Object.assign(out, v as AnyRec);
      continue;
    }
    out[k] = v;
  }
  return out;
}

function whereClause(where: AnyRec | undefined, params: unknown[], table?: string): string {
  if (!where || Object.keys(where).length === 0) return "1=1";
  where = table ? flattenWhere(table, where) : where;
  if (!where) return "1=1";
  const parts: string[] = [];
  for (const [key, val] of Object.entries(where)) {
    if (key === "OR" && Array.isArray(val)) {
      const inner = val.map((w) => `(${whereClause(w as AnyRec, params, table)})`).join(" OR ");
      parts.push(`(${inner || "0"})`);
      continue;
    }
    if (key === "AND" && Array.isArray(val)) {
      const inner = val.map((w) => `(${whereClause(w as AnyRec, params, table)})`).join(" AND ");
      parts.push(`(${inner || "1"})`);
      continue;
    }
    if (key === "NOT" && val && typeof val === "object") {
      parts.push(`NOT (${whereClause(val as AnyRec, params, table)})`);
      continue;
    }
    if (val === null) {
      parts.push(`${col(key)} IS NULL`);
      continue;
    }
    if (val && typeof val === "object" && !Array.isArray(val) && !(val instanceof Date)) {
      const obj = val as AnyRec;
      if ("in" in obj && Array.isArray(obj.in)) {
        if (obj.in.length === 0) {
          parts.push("0");
          continue;
        }
        const qs = obj.in.map((v) => {
          params.push(encode(key, v));
          return "?";
        });
        parts.push(`${col(key)} IN (${qs.join(",")})`);
        continue;
      }
      if ("not" in obj) {
        if (obj.not === null) {
          parts.push(`${col(key)} IS NOT NULL`);
        } else if (obj.not && typeof obj.not === "object" && "in" in (obj.not as AnyRec)) {
          const arr = (obj.not as AnyRec).in as unknown[];
          const qs = arr.map((v) => {
            params.push(encode(key, v));
            return "?";
          });
          parts.push(`${col(key)} NOT IN (${qs.join(",")})`);
        } else {
          params.push(encode(key, obj.not));
          parts.push(`${col(key)} != ?`);
        }
        continue;
      }
      if ("contains" in obj) {
        params.push(`%${obj.contains}%`);
        parts.push(`${col(key)} LIKE ?`);
        continue;
      }
      if ("gte" in obj) {
        params.push(encode(key, obj.gte));
        parts.push(`${col(key)} >= ?`);
      }
      if ("lte" in obj) {
        params.push(encode(key, obj.lte));
        parts.push(`${col(key)} <= ?`);
      }
      if ("gt" in obj) {
        params.push(encode(key, obj.gt));
        parts.push(`${col(key)} > ?`);
      }
      if ("lt" in obj) {
        params.push(encode(key, obj.lt));
        parts.push(`${col(key)} < ?`);
      }
      continue;
    }
    params.push(encode(key, val));
    parts.push(`${col(key)} = ?`);
  }
  return parts.join(" AND ") || "1=1";
}

function orderSql(orderBy: unknown): string {
  if (!orderBy) return "";
  const list = Array.isArray(orderBy) ? orderBy : [orderBy];
  const bits = list
    .map((o) => {
      const [k, dir] = Object.entries(o as AnyRec)[0] ?? [];
      if (!k) return "";
      return `${col(k)} ${String(dir).toLowerCase() === "asc" ? "ASC" : "DESC"}`;
    })
    .filter(Boolean);
  return bits.length ? `ORDER BY ${bits.join(", ")}` : "";
}

/**
 * Idempotent column migrations for databases that existed before a column
 * was added. schema.sql only creates *new* tables; these ALTERs bring older
 * dev/test databases up to date. Production PostgreSQL is migrated from
 * database/prisma/schema.prisma, the source of truth.
 */
const COLUMN_MIGRATIONS: [table: string, column: string, ddl: string][] = [
  ["SmsNumber", "publicToken", "ALTER TABLE SmsNumber ADD COLUMN publicToken TEXT"],
  ["SmsNumber", "providerNumberId", "ALTER TABLE SmsNumber ADD COLUMN providerNumberId TEXT"],
  ["SmsNumber", "assignedAt", "ALTER TABLE SmsNumber ADD COLUMN assignedAt TEXT"],
  ["SmsNumber", "lastActivityAt", "ALTER TABLE SmsNumber ADD COLUMN lastActivityAt TEXT"],
  ["SmsNumber", "releasedAt", "ALTER TABLE SmsNumber ADD COLUMN releasedAt TEXT"],
  ["SmsNumber", "quarantineUntil", "ALTER TABLE SmsNumber ADD COLUMN quarantineUntil TEXT"],
  ["SmsMessage", "providerMessageId", "ALTER TABLE SmsMessage ADD COLUMN providerMessageId TEXT"],
  ["SmsMessage", "detectedCode", "ALTER TABLE SmsMessage ADD COLUMN detectedCode TEXT"],
  ["EmailMessage", "detectedCode", "ALTER TABLE EmailMessage ADD COLUMN detectedCode TEXT"],
];

function tableColumns(db: DatabaseSync, table: string): string[] {
  try {
    return (db.prepare(`PRAGMA table_info(${table})`).all() as { name: string }[]).map((c) => c.name);
  } catch {
    return [];
  }
}

/** Pre-schema phase: add new columns to pre-existing tables only. */
function applyColumnMigrations(db: DatabaseSync): void {
  for (const [table, column, ddl] of COLUMN_MIGRATIONS) {
    const cols = tableColumns(db, table);
    if (cols.length === 0) continue; // fresh DBs get the column from schema.sql
    if (!cols.includes(column)) db.exec(ddl);
  }
}

/** Post-schema phase: data migrations + indexes for the new columns. */
function applyDataMigrations(db: DatabaseSync): void {
  if (!tableColumns(db, "SmsNumber").length) return;
  // Status vocabulary migration: legacy ACTIVE/RELEASED rows map onto the
  // ASSIGNED/QUARANTINED lifecycle.
  db.exec("UPDATE SmsNumber SET status = 'ASSIGNED', assignedAt = COALESCE(assignedAt, createdAt) WHERE status = 'ACTIVE'");
  db.exec(
    "UPDATE SmsNumber SET status = 'QUARANTINED', releasedAt = COALESCE(releasedAt, updatedAt), quarantineUntil = COALESCE(quarantineUntil, updatedAt) WHERE status = 'RELEASED'",
  );
  // Unique indexes that accompany the new columns (no-ops when present).
  for (const ddl of [
    "CREATE UNIQUE INDEX IF NOT EXISTS SmsNumber_publicToken_idx ON SmsNumber(publicToken)",
    "CREATE INDEX IF NOT EXISTS SmsNumber_quarantineUntil_idx ON SmsNumber(quarantineUntil)",
    "CREATE UNIQUE INDEX IF NOT EXISTS SmsMessage_numberId_providerMessageId_idx ON SmsMessage(numberId, providerMessageId)",
  ]) {
    db.exec(ddl);
  }
}

export class MiniPrisma {
  readonly db: DatabaseSync;
  private delegates: Record<string, ReturnType<MiniPrisma["makeDelegate"]>> = {};

  constructor(file: string) {
    mkdirSync(path.dirname(file), { recursive: true });
    this.db = new DatabaseSync(file);
    this.db.exec("PRAGMA journal_mode = WAL;");
    this.db.exec("PRAGMA foreign_keys = ON;");
    applyColumnMigrations(this.db);
    const schemaPath = path.join(process.cwd(), "database/sqlite/schema.sql");
    this.db.exec(readFileSync(schemaPath, "utf8"));
    applyDataMigrations(this.db);
    for (const m of MODELS) {
      const name = m[0]!.toLowerCase() + m.slice(1);
      this.delegates[name] = this.makeDelegate(m);
      (this as unknown as AnyRec)[name] = this.delegates[name];
    }
  }

  private makeDelegate(model: string) {
    // Delegate methods close over the client instance.
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this;
    return {
      async findUnique(args: { where: AnyRec; include?: AnyRec; select?: AnyRec }) {
        return self.find(model, flattenWhere(model, args.where), { include: args.include, take: 1 }).then((r) => r[0] ?? null);
      },
      async findFirst(args: { where?: AnyRec; include?: AnyRec; orderBy?: unknown } = {}) {
        const rows = await self.find(model, flattenWhere(model, args.where), {
          include: args.include,
          orderBy: args.orderBy,
          take: 1,
        });
        return rows[0] ?? null;
      },
      async findMany(args: {
        where?: AnyRec;
        include?: AnyRec;
        orderBy?: unknown;
        take?: number;
        skip?: number;
        select?: AnyRec;
      } = {}) {
        return self.find(model, flattenWhere(model, args.where), args);
      },
      async create(args: { data: AnyRec; include?: AnyRec }) {
        return self.create(model, args.data, args.include);
      },
      async createMany(args: { data: AnyRec[] }) {
        for (const d of args.data) await self.create(model, d);
        return { count: args.data.length };
      },
      async update(args: { where: AnyRec; data: AnyRec; include?: AnyRec }) {
        return self.update(model, flattenWhere(model, args.where)!, args.data, args.include);
      },
      async updateMany(args: { where?: AnyRec; data: AnyRec }) {
        return self.updateMany(model, flattenWhere(model, args.where), args.data);
      },
      async delete(args: { where: AnyRec }) {
        const row = await this.findUnique({ where: args.where });
        const params: unknown[] = [];
        const sql = `DELETE FROM ${model} WHERE ${whereClause(flattenWhere(model, args.where), params, model)}`;
        self.db.prepare(sql).run(...(params as never[]));
        return row;
      },
      async deleteMany(args: { where?: AnyRec } = {}) {
        const params: unknown[] = [];
        const sql = `DELETE FROM ${model} WHERE ${whereClause(flattenWhere(model, args.where), params, model)}`;
        const res = self.db.prepare(sql).run(...(params as never[]));
        return { count: Number(res.changes ?? 0) };
      },
      async count(args: { where?: AnyRec } = {}) {
        const params: unknown[] = [];
        const sql = `SELECT COUNT(*) as c FROM ${model} WHERE ${whereClause(flattenWhere(model, args.where), params, model)}`;
        const row = self.db.prepare(sql).get(...(params as never[])) as { c: number };
        return Number(row.c);
      },
      async upsert(args: { where: AnyRec; update: AnyRec; create: AnyRec }) {
        const existing = await this.findUnique({ where: args.where });
        if (existing) return self.update(model, flattenWhere(model, args.where)!, args.update);
        return self.create(model, args.create);
      },
      async aggregate(args: { where?: AnyRec; _sum?: AnyRec }) {
        const sums = args._sum ? Object.keys(args._sum) : [];
        const params: unknown[] = [];
        const select = sums.length ? sums.map((s) => `SUM(${col(s)}) as ${s}`).join(", ") : "COUNT(*) as c";
        const sql = `SELECT ${select} FROM ${model} WHERE ${whereClause(flattenWhere(model, args.where), params, model)}`;
        const row = (self.db.prepare(sql).get(...(params as never[])) as AnyRec) || {};
        const _sum: AnyRec = {};
        for (const s of sums) _sum[s] = row[s] == null ? null : Number(row[s]);
        return { _sum };
      },
    };
  }

  private async find(model: string, where: AnyRec | undefined, opts: {
    include?: AnyRec;
    orderBy?: unknown;
    take?: number;
    skip?: number;
  }) {
    const params: unknown[] = [];
    let sql = `SELECT * FROM ${model} WHERE ${whereClause(where, params)} ${orderSql(opts.orderBy)}`;
    if (opts.take) sql += ` LIMIT ${Number(opts.take)}`;
    if (opts.skip) sql += ` OFFSET ${Number(opts.skip)}`;
    const rows = this.db.prepare(sql).all(...(params as never[])) as AnyRec[];
    const decoded = rows.map((r) => decodeRow(r)!);
    if (opts.include) {
      for (const row of decoded) await this.attachIncludes(model, row, opts.include);
    }
    return decoded;
  }

  private async attachIncludes(model: string, row: AnyRec, include: AnyRec) {
    const rels = REL[model] || {};
    for (const [name, spec] of Object.entries(include)) {
      if (!spec) continue;
      const rel = rels[name];
      if (!rel) continue;
      const nested = typeof spec === "object" ? (spec as AnyRec) : {};
      const childInclude = (nested.include as AnyRec) || undefined;
      const childWhere = (nested.where as AnyRec) || {};
      const childOrder = nested.orderBy;
      const childTake = nested.take as number | undefined;
      if (rel.kind === "many") {
        const where = { ...childWhere, [rel.fk]: row.id };
        row[name] = await this.find(rel.model, where, { include: childInclude, orderBy: childOrder, take: childTake });
      } else if (rel.owner) {
        const where = { ...childWhere, [rel.fk]: row.id };
        const found = await this.find(rel.model, where, { include: childInclude, take: 1 });
        row[name] = found[0] ?? null;
      } else {
        const fkVal = row[rel.fk];
        if (!fkVal) {
          row[name] = null;
          continue;
        }
        const found = await this.find(rel.model, { id: fkVal, ...childWhere }, { include: childInclude, take: 1 });
        row[name] = found[0] ?? null;
      }
    }
  }

  private columnCache: Record<string, ColumnInfo[]> = {};

  private columns(model: string): ColumnInfo[] {
    const cached = this.columnCache[model];
    if (cached) return cached;
    const info = this.db.prepare(`PRAGMA table_info(${model})`).all() as {
      name: string;
      notnull: number;
      dflt_value: unknown;
      pk: number;
    }[];
    const mapped: ColumnInfo[] = info.map((c) => ({
      name: c.name,
      required: c.notnull === 1 && c.dflt_value == null && c.pk === 0,
    }));
    this.columnCache[model] = mapped;
    return mapped;
  }

  private hasColumn(model: string, name: string): boolean {
    return this.columns(model).some((c) => c.name === name);
  }

  /**
   * SQLite has no `@default(now())`, so NOT NULL timestamp columns must be
   * filled in by the client. Prisma does this from the schema; we derive the
   * same behaviour from the table definition so that no insert can ever fail
   * with "NOT NULL constraint failed" on a timestamp the caller did not set.
   */
  private requiredTimestampColumns(model: string): string[] {
    return this.columns(model)
      .filter((c) => c.required && (DATE_FIELDS.has(c.name) || DATE_SUFFIX.test(c.name)))
      .map((c) => c.name);
  }

  private async create(model: string, data: AnyRec, include?: AnyRec): Promise<AnyRec> {
    const nested: { name: string; payload: AnyRec }[] = [];
    const row: AnyRec = { ...data };
    if (!row.id && this.hasColumn(model, "id")) row.id = cuid();
    const ts = nowIso();
    if (this.hasColumn(model, "createdAt") && !row.createdAt) row.createdAt = ts;
    if (this.hasColumn(model, "updatedAt") && !row.updatedAt) row.updatedAt = ts;
    // Fill any other NOT NULL timestamp column (lastSeenAt, assignedAt,
    // receivedAt, startedAt, …) that the caller left unset.
    for (const name of this.requiredTimestampColumns(model)) {
      if (row[name] === undefined || row[name] === null) row[name] = ts;
    }

    for (const [k, v] of Object.entries(row)) {
      if (v && typeof v === "object" && !Array.isArray(v) && !(v instanceof Date) && ("create" in (v as AnyRec) || "createMany" in (v as AnyRec))) {
        nested.push({ name: k, payload: v as AnyRec });
        delete row[k];
      }
    }

    for (const k of Object.keys(row)) {
      if (row[k] === undefined) delete row[k];
    }
    const keys = Object.keys(row);
    const placeholders = keys.map(() => "?").join(", ");
    const sql = `INSERT INTO ${model} (${keys.map(col).join(", ")}) VALUES (${placeholders})`;
    const values = keys.map((k) => encode(k, row[k]));
    this.db.prepare(sql).run(...(values as never[]));

    for (const n of nested) {
      const rel = REL[model]?.[n.name];
      if (!rel) continue;
      const creates: AnyRec[] = [];
      if (n.payload.create) {
        if (Array.isArray(n.payload.create)) creates.push(...n.payload.create);
        else creates.push(n.payload.create as AnyRec);
      }
      for (const c of creates) {
        const child = { ...c };
        if (rel.kind === "many") child[rel.fk] = row.id;
        await this.create(rel.model, child);
      }
    }

    if (this.hasColumn(model, "id") && row.id) {
      const created = (await this.find(model, { id: row.id }, { include, take: 1 }))[0];
      return created ?? decodeRow(row)!;
    }
    return decodeRow(row)!;
  }

  private async update(model: string, where: AnyRec, data: AnyRec, include?: AnyRec): Promise<AnyRec> {
    const existing = (await this.find(model, where, { take: 1 }))[0];
    if (!existing) throw new Error(`${model} not found`);
    const sets: string[] = [];
    const params: unknown[] = [];
    for (const [k, v] of Object.entries(data)) {
      if (v && typeof v === "object" && !Array.isArray(v) && !(v instanceof Date) && "increment" in (v as AnyRec)) {
        sets.push(`${col(k)} = ${col(k)} + ?`);
        params.push((v as AnyRec).increment);
        continue;
      }
      if (v === undefined) continue;
      sets.push(`${col(k)} = ?`);
      params.push(encode(k, v));
    }
    if (this.hasColumn(model, "updatedAt") && !("updatedAt" in data)) {
      sets.push(`updatedAt = ?`);
      params.push(nowIso());
    }
    if (sets.length) {
      const wparams: unknown[] = [];
      const wsql = whereClause(where, wparams);
      this.db.prepare(`UPDATE ${model} SET ${sets.join(", ")} WHERE ${wsql}`).run(...([...params, ...wparams] as never[]));
    }
    const updated = (await this.find(model, where, { include, take: 1 }))[0];
    return updated ?? existing;
  }

  private async updateMany(model: string, where: AnyRec | undefined, data: AnyRec) {
    const sets: string[] = [];
    const params: unknown[] = [];
    for (const [k, v] of Object.entries(data)) {
      sets.push(`${col(k)} = ?`);
      params.push(encode(k, v));
    }
    if (!sets.length) return { count: 0 };
    const wparams: unknown[] = [];
    const wsql = whereClause(where, wparams);
    const res = this.db.prepare(`UPDATE ${model} SET ${sets.join(", ")} WHERE ${wsql}`).run(
      ...([...params, ...wparams] as never[]),
    );
    return { count: Number(res.changes ?? 0) };
  }

  async $queryRaw(strings: TemplateStringsArray, ..._values: unknown[]) {
    const sql = strings.join("?");
    return this.db.prepare(sql).all();
  }

  async $disconnect() {
    this.db.close();
  }
}

export type PrismaLike = MiniPrisma & Record<string, ReturnType<MiniPrisma["makeDelegate"]>>;
