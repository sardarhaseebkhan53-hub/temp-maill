import { z } from "zod";

export const usernameSchema = z
  .string()
  .min(3)
  .max(32)
  .regex(/^[a-z0-9](?:[a-z0-9._-]*[a-z0-9])$/i, "Use letters, numbers, dots, hyphens, or underscores.");

export const emailSchema = z.string().email().max(254);

export const passwordSchema = z
  .string()
  .min(10, "Use at least 10 characters.")
  .max(128)
  .refine((v) => /[a-z]/.test(v), "Add a lowercase letter.")
  .refine((v) => /[A-Z]/.test(v) || /\d/.test(v), "Add a number or uppercase letter.");

export const paginationSchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(25),
});

export const mailboxCreateSchema = z.object({
  localPart: z.string().optional(),
  domainId: z.string().optional(),
  custom: z.boolean().optional(),
  sandbox: z.boolean().optional(),
  ttlMinutes: z.number().int().min(5).max(60 * 24 * 30).optional(),
});

export const messageQuerySchema = paginationSchema.extend({
  mailboxId: z.string().optional(),
  q: z.string().max(200).optional(),
  sort: z.enum(["newest", "oldest", "unread"]).default("newest"),
  filter: z.enum(["all", "unread", "has-attachment"]).default("all"),
  sender: z.string().optional(),
});

export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  name: z.string().min(1).max(80).optional(),
  locale: z.string().min(2).max(8).optional(),
  referralCode: z.string().max(16).optional(),
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1).max(128),
  remember: z.boolean().optional().default(true),
});

export const webhookCreateSchema = z.object({
  url: z.string().url().refine((u) => u.startsWith("https://") || u.startsWith("http://localhost"), {
    message: "Webhook URL must be https (or localhost in development).",
  }),
  events: z.array(z.string()).min(1).default(["message.received"]),
  sandbox: z.boolean().optional(),
});

export const supportTicketSchema = z.object({
  email: emailSchema,
  subject: z.string().min(3).max(160),
  message: z.string().min(10).max(5000),
});

export const contactSchema = z.object({
  name: z.string().min(2).max(80),
  email: emailSchema,
  topic: z.string().min(2).max(80),
  message: z.string().min(10).max(5000),
});

export const abuseReportSchema = z.object({
  mailboxId: z.string().optional(),
  messageId: z.string().optional(),
  category: z.enum(["spam", "phishing", "malware", "harassment", "illegal", "other"]),
  details: z.string().min(5).max(4000),
});

export const manualPaymentSchema = z.object({
  planKey: z.enum(["PRO", "DEVELOPER", "BUSINESS"]),
  interval: z.enum(["month", "year", "lifetime"]),
  currency: z.string().min(3).max(3),
  // Any method key the operator configured; existence and eligibility are
  // verified server-side against the PaymentMethod table.
  method: z
    .string()
    .trim()
    .min(2)
    .max(40)
    .regex(/^[a-z0-9_]+$/),
  transactionId: z.string().trim().min(4).max(80),
  /** What the customer says they sent; the charge uses the plan price. */
  amountCents: z.number().int().positive().optional(),
  screenshotUrl: z.string().url().max(500).optional(),
});

export const aliasCreateSchema = z.object({
  localPart: z.string().optional(),
  domainId: z.string().optional(),
  label: z.string().max(60).optional(),
});

export function parseBody<T>(schema: z.ZodType<T>, data: unknown): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    const message = result.error.issues[0]?.message || "Invalid request.";
    const err = new Error(message) as Error & { issues: z.ZodIssue[]; code: string };
    err.issues = result.error.issues;
    err.code = "VALIDATION_ERROR";
    throw err;
  }
  return result.data;
}
