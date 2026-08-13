export class AppError extends Error {
  readonly code: string;
  readonly status: number;
  readonly details?: unknown;

  constructor(code: string, message: string, status = 400, details?: unknown) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

export const Errors = {
  unauthorized: () => new AppError("UNAUTHORIZED", "Authentication is required.", 401),
  forbidden: () => new AppError("FORBIDDEN", "You do not have permission to do that.", 403),
  notFound: (what = "Resource") => new AppError("NOT_FOUND", `${what} was not found.`, 404),
  validation: (message: string, details?: unknown) =>
    new AppError("VALIDATION_ERROR", message, 422, details),
  rateLimited: (retryAfterSec?: number) =>
    new AppError("RATE_LIMITED", "Too many requests. Please wait and try again.", 429, {
      retryAfterSec,
    }),
  mailboxExpired: () =>
    new AppError("MAILBOX_EXPIRED", "This temporary mailbox has expired.", 410),
  mailboxPurged: () =>
    new AppError("MAILBOX_PURGED", "This mailbox and its messages have been permanently deleted.", 410),
  domainUnavailable: () =>
    new AppError("DOMAIN_UNAVAILABLE", "That domain is not available for your plan.", 403),
  usernameTaken: () =>
    new AppError("USERNAME_TAKEN", "That address is already in use. Try another.", 409),
  usernameBlocked: () =>
    new AppError("USERNAME_BLOCKED", "That username is not allowed.", 422),
  planLimit: (message: string) => new AppError("PLAN_LIMIT", message, 402),
  captchaRequired: () =>
    new AppError("CAPTCHA_REQUIRED", "Please complete the verification challenge.", 428),
  providerDown: (name: string) =>
    new AppError("PROVIDER_UNAVAILABLE", `${name} is temporarily unavailable.`, 503),
  maintenance: () =>
    new AppError("MAINTENANCE", "Haven is undergoing scheduled maintenance.", 503),
  conflict: (message: string) => new AppError("CONFLICT", message, 409),
  payloadTooLarge: () => new AppError("PAYLOAD_TOO_LARGE", "That file or message is too large.", 413),
  unsupportedMedia: () =>
    new AppError("UNSUPPORTED_MEDIA", "That file type is not allowed.", 415),
  paymentUnverified: () =>
    new AppError("PAYMENT_UNVERIFIED", "Payment has not been verified yet.", 402),
  csrf: () => new AppError("CSRF", "The request could not be verified. Refresh and try again.", 403),
  internal: () => new AppError("INTERNAL", "Something went wrong. Please try again.", 500),
};

export function toErrorEnvelope(err: unknown, correlationId?: string) {
  if (err instanceof AppError) {
    return {
      status: err.status,
      body: {
        success: false as const,
        error: { code: err.code, message: err.message, details: err.details },
        correlationId,
      },
    };
  }
  return {
    status: 500,
    body: {
      success: false as const,
      error: { code: "INTERNAL", message: "Something went wrong. Please try again." },
      correlationId,
    },
  };
}
