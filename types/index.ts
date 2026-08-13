export type Locale = "en" | "ur" | "hi" | "ar" | "es" | "fr" | "de";

export const LOCALES: Locale[] = ["en", "ur", "hi", "ar", "es", "fr", "de"];
export const RTL_LOCALES: Locale[] = ["ar", "ur"];

export type MailboxState = "ACTIVE" | "EXPIRING_SOON" | "EXPIRED" | "PURGED";
export type UserStatus = "ACTIVE" | "SUSPENDED" | "BANNED" | "DELETED";
export type SubscriptionStatus = "TRIALING" | "ACTIVE" | "PAST_DUE" | "CANCELED" | "EXPIRED";
export type RoleKey = "SUPER_ADMIN" | "ADMIN" | "MODERATOR" | "SUPPORT" | "ANALYST" | "USER";
export type DomainStatus = "ACTIVE" | "DEGRADED" | "DISABLED";
export type DomainEligibility = "FREE" | "PREMIUM_ONLY" | "BUSINESS_ONLY";
export type TicketStatus = "OPEN" | "IN_PROGRESS" | "WAITING" | "RESOLVED" | "CLOSED";
export type PaymentStatus = "PENDING" | "SUCCEEDED" | "FAILED" | "REFUNDED" | "CANCELED";
export type ManualPaymentStatus = "PENDING" | "APPROVED" | "REJECTED" | "NEEDS_INFO";
export type PlanKey = "FREE" | "PRO" | "DEVELOPER" | "BUSINESS";

export interface ApiErrorBody {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
  correlationId?: string;
}

export interface ApiSuccess<T> {
  success: true;
  data: T;
  correlationId?: string;
}

export type ApiResult<T> = ApiSuccess<T> | ApiErrorBody;

export interface PublicMailbox {
  id: string;
  address: string;
  localPart: string;
  domain: string;
  state: MailboxState;
  expiresAt: string;
  custom: boolean;
  publicToken: string;
  createdAt: string;
  messageCount: number;
  unreadCount: number;
  favorite?: boolean;
}

export interface PublicMessage {
  id: string;
  fromAddress: string;
  fromName: string | null;
  toAddress: string;
  subject: string;
  snippet: string;
  receivedAt: string;
  read: boolean;
  hasAttachments: boolean;
  spamFlag: boolean;
  sizeBytes: number;
}

export interface PublicMessageDetail extends PublicMessage {
  textBody: string;
  htmlSafe: string;
  attachments: PublicAttachment[];
}

export interface PublicAttachment {
  id: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  blocked: boolean;
}

export interface SessionUser {
  id: string;
  email: string;
  name: string | null;
  displayName: string | null;
  locale: string;
  theme: string;
  status: UserStatus;
  roles: RoleKey[];
  permissions: string[];
  planKey: PlanKey;
  subscriptionStatus: SubscriptionStatus | null;
}

export interface PlanView {
  key: PlanKey;
  name: string;
  description: string;
  highlight: string | null;
  prices: { currency: string; interval: string; amountCents: number }[];
  limits: Record<string, string>;
}

export interface PublicStats {
  mailboxesCreated: number;
  messagesReceived: number;
  activeMailboxes: number;
  countriesServed: number;
}

export interface HealthStatus {
  status: "ok" | "degraded" | "down";
  version: string;
  checks: Record<string, { ok: boolean; latencyMs?: number; detail?: string }>;
}
