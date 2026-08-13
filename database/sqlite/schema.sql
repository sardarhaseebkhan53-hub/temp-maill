-- Haven schema (SQLite). Mirrors database/prisma/schema.prisma

CREATE TABLE IF NOT EXISTS User (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  emailVerifiedAt TEXT,
  passwordHash TEXT,
  name TEXT,
  displayName TEXT,
  avatarUrl TEXT,
  locale TEXT NOT NULL DEFAULT 'en',
  timezone TEXT NOT NULL DEFAULT 'UTC',
  theme TEXT NOT NULL DEFAULT 'system',
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  totpSecretEnc TEXT,
  totpEnabled INTEGER NOT NULL DEFAULT 0,
  referralCode TEXT NOT NULL UNIQUE,
  referredById TEXT,
  country TEXT,
  notesInternal TEXT,
  lastLoginAt TEXT,
  lastLoginIp TEXT,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL,
  deletedAt TEXT
);
CREATE INDEX IF NOT EXISTS User_status_idx ON User(status);
CREATE INDEX IF NOT EXISTS User_createdAt_idx ON User(createdAt);
CREATE INDEX IF NOT EXISTS User_referredById_idx ON User(referredById);

CREATE TABLE IF NOT EXISTS Role (
  id TEXT PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  isSystem INTEGER NOT NULL DEFAULT 0,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS Permission (
  id TEXT PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  "group" TEXT NOT NULL,
  description TEXT
);

CREATE TABLE IF NOT EXISTS RolePermission (
  roleId TEXT NOT NULL,
  permissionId TEXT NOT NULL,
  PRIMARY KEY (roleId, permissionId)
);
CREATE INDEX IF NOT EXISTS RolePermission_permissionId_idx ON RolePermission(permissionId);

CREATE TABLE IF NOT EXISTS UserRole (
  userId TEXT NOT NULL,
  roleId TEXT NOT NULL,
  assignedAt TEXT NOT NULL,
  assignedBy TEXT,
  PRIMARY KEY (userId, roleId)
);
CREATE INDEX IF NOT EXISTS UserRole_roleId_idx ON UserRole(roleId);

CREATE TABLE IF NOT EXISTS Session (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  tokenHash TEXT NOT NULL UNIQUE,
  userAgent TEXT,
  ip TEXT,
  createdAt TEXT NOT NULL,
  expiresAt TEXT NOT NULL,
  lastSeenAt TEXT NOT NULL,
  revokedAt TEXT,
  rotatedFromId TEXT
);
CREATE INDEX IF NOT EXISTS Session_userId_idx ON Session(userId);
CREATE INDEX IF NOT EXISTS Session_expiresAt_idx ON Session(expiresAt);

CREATE TABLE IF NOT EXISTS OAuthAccount (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  provider TEXT NOT NULL,
  providerAccountId TEXT NOT NULL,
  accessTokenEnc TEXT,
  refreshTokenEnc TEXT,
  expiresAt TEXT,
  createdAt TEXT NOT NULL,
  UNIQUE (provider, providerAccountId)
);
CREATE INDEX IF NOT EXISTS OAuthAccount_userId_idx ON OAuthAccount(userId);

CREATE TABLE IF NOT EXISTS RecoveryCode (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  codeHash TEXT NOT NULL,
  usedAt TEXT,
  createdAt TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS RecoveryCode_userId_idx ON RecoveryCode(userId);

CREATE TABLE IF NOT EXISTS ActivityLog (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  action TEXT NOT NULL,
  metaJson TEXT NOT NULL DEFAULT '{}',
  ip TEXT,
  createdAt TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS ActivityLog_userId_createdAt_idx ON ActivityLog(userId, createdAt);

CREATE TABLE IF NOT EXISTS Service (
  id TEXT PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  enabled INTEGER NOT NULL DEFAULT 1,
  icon TEXT,
  href TEXT,
  sortOrder INTEGER NOT NULL DEFAULT 0,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS ServiceInstance (
  id TEXT PRIMARY KEY,
  serviceId TEXT NOT NULL,
  userId TEXT,
  guestKey TEXT,
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  metadata TEXT NOT NULL DEFAULT '{}',
  expiresAt TEXT,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS ServiceInstance_serviceId_status_idx ON ServiceInstance(serviceId, status);
CREATE INDEX IF NOT EXISTS ServiceInstance_userId_idx ON ServiceInstance(userId);
CREATE INDEX IF NOT EXISTS ServiceInstance_guestKey_idx ON ServiceInstance(guestKey);
CREATE INDEX IF NOT EXISTS ServiceInstance_expiresAt_idx ON ServiceInstance(expiresAt);

CREATE TABLE IF NOT EXISTS EmailDomain (
  id TEXT PRIMARY KEY,
  domain TEXT NOT NULL UNIQUE,
  displayName TEXT,
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  eligibility TEXT NOT NULL DEFAULT 'FREE',
  mxRequired INTEGER NOT NULL DEFAULT 1,
  mxOk INTEGER NOT NULL DEFAULT 0,
  weight INTEGER NOT NULL DEFAULT 100,
  lastHealthAt TEXT,
  lastHealthNote TEXT,
  catchAll INTEGER NOT NULL DEFAULT 1,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS EmailProvider (
  id TEXT PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  adapter TEXT NOT NULL,
  enabled INTEGER NOT NULL DEFAULT 0,
  isDefault INTEGER NOT NULL DEFAULT 0,
  configJson TEXT NOT NULL DEFAULT '{}',
  healthStatus TEXT NOT NULL DEFAULT 'UNKNOWN',
  lastHealthAt TEXT,
  lastError TEXT,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS TemporaryMailbox (
  id TEXT PRIMARY KEY,
  serviceInstanceId TEXT NOT NULL UNIQUE,
  address TEXT NOT NULL UNIQUE,
  localPart TEXT NOT NULL,
  domainId TEXT NOT NULL,
  userId TEXT,
  accessTokenHash TEXT NOT NULL,
  publicToken TEXT NOT NULL UNIQUE,
  state TEXT NOT NULL DEFAULT 'ACTIVE',
  custom INTEGER NOT NULL DEFAULT 0,
  sandbox INTEGER NOT NULL DEFAULT 0,
  expiresAt TEXT NOT NULL,
  lastExtendedAt TEXT,
  extensionMinutes INTEGER NOT NULL DEFAULT 0,
  messageCount INTEGER NOT NULL DEFAULT 0,
  unreadCount INTEGER NOT NULL DEFAULT 0,
  lastMessageAt TEXT,
  createdIp TEXT,
  userAgent TEXT,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL,
  purgedAt TEXT
);
CREATE INDEX IF NOT EXISTS TemporaryMailbox_userId_state_idx ON TemporaryMailbox(userId, state);
CREATE INDEX IF NOT EXISTS TemporaryMailbox_domainId_idx ON TemporaryMailbox(domainId);
CREATE INDEX IF NOT EXISTS TemporaryMailbox_state_expiresAt_idx ON TemporaryMailbox(state, expiresAt);
CREATE INDEX IF NOT EXISTS TemporaryMailbox_localPart_domainId_idx ON TemporaryMailbox(localPart, domainId);
CREATE INDEX IF NOT EXISTS TemporaryMailbox_createdAt_idx ON TemporaryMailbox(createdAt);

CREATE TABLE IF NOT EXISTS MailboxEvent (
  id TEXT PRIMARY KEY,
  mailboxId TEXT NOT NULL,
  fromState TEXT,
  toState TEXT NOT NULL,
  reason TEXT,
  createdAt TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS MailboxEvent_mailboxId_createdAt_idx ON MailboxEvent(mailboxId, createdAt);

CREATE TABLE IF NOT EXISTS MailboxFavorite (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  mailboxId TEXT NOT NULL,
  createdAt TEXT NOT NULL,
  UNIQUE (userId, mailboxId)
);

CREATE TABLE IF NOT EXISTS EmailMessage (
  id TEXT PRIMARY KEY,
  mailboxId TEXT NOT NULL,
  providerId TEXT,
  idempotencyKey TEXT NOT NULL UNIQUE,
  fromAddress TEXT NOT NULL,
  fromName TEXT,
  toAddress TEXT NOT NULL,
  subject TEXT NOT NULL DEFAULT '(no subject)',
  snippet TEXT NOT NULL DEFAULT '',
  textBody TEXT NOT NULL DEFAULT '',
  htmlRaw TEXT NOT NULL DEFAULT '',
  htmlSafe TEXT NOT NULL DEFAULT '',
  headersJson TEXT NOT NULL DEFAULT '{}',
  sizeBytes INTEGER NOT NULL DEFAULT 0,
  spamScore REAL NOT NULL DEFAULT 0,
  spamFlag INTEGER NOT NULL DEFAULT 0,
  read INTEGER NOT NULL DEFAULT 0,
  starred INTEGER NOT NULL DEFAULT 0,
  hasAttachments INTEGER NOT NULL DEFAULT 0,
  receivedAt TEXT NOT NULL,
  deletedAt TEXT,
  purgedAt TEXT,
  createdAt TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS EmailMessage_mailboxId_receivedAt_idx ON EmailMessage(mailboxId, receivedAt);
CREATE INDEX IF NOT EXISTS EmailMessage_mailboxId_read_idx ON EmailMessage(mailboxId, read);
CREATE INDEX IF NOT EXISTS EmailMessage_fromAddress_idx ON EmailMessage(fromAddress);
CREATE INDEX IF NOT EXISTS EmailMessage_deletedAt_idx ON EmailMessage(deletedAt);

CREATE TABLE IF NOT EXISTS EmailAttachment (
  id TEXT PRIMARY KEY,
  messageId TEXT NOT NULL,
  filename TEXT NOT NULL,
  mimeType TEXT NOT NULL,
  sizeBytes INTEGER NOT NULL,
  storageKey TEXT NOT NULL,
  checksum TEXT NOT NULL,
  blocked INTEGER NOT NULL DEFAULT 0,
  blockReason TEXT,
  scanStatus TEXT NOT NULL DEFAULT 'PENDING',
  scanResult TEXT,
  createdAt TEXT NOT NULL,
  expiresAt TEXT,
  purgedAt TEXT
);
CREATE INDEX IF NOT EXISTS EmailAttachment_messageId_idx ON EmailAttachment(messageId);
CREATE INDEX IF NOT EXISTS EmailAttachment_expiresAt_idx ON EmailAttachment(expiresAt);

CREATE TABLE IF NOT EXISTS Alias (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  domainId TEXT NOT NULL,
  address TEXT NOT NULL UNIQUE,
  localPart TEXT NOT NULL,
  label TEXT,
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  forwardToId TEXT,
  messagesReceived INTEGER NOT NULL DEFAULT 0,
  lastActivityAt TEXT,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS Alias_userId_status_idx ON Alias(userId, status);
CREATE INDEX IF NOT EXISTS Alias_domainId_idx ON Alias(domainId);

CREATE TABLE IF NOT EXISTS ForwardingAddress (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  email TEXT NOT NULL,
  verifiedAt TEXT,
  verifyToken TEXT,
  createdAt TEXT NOT NULL,
  UNIQUE (userId, email)
);

CREATE TABLE IF NOT EXISTS BlockedSender (
  id TEXT PRIMARY KEY,
  userId TEXT,
  mailboxId TEXT,
  pattern TEXT NOT NULL,
  kind TEXT NOT NULL DEFAULT 'ADDRESS',
  createdAt TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS BlockedSender_userId_idx ON BlockedSender(userId);
CREATE INDEX IF NOT EXISTS BlockedSender_mailboxId_idx ON BlockedSender(mailboxId);

CREATE TABLE IF NOT EXISTS SmsProvider (
  id TEXT PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  adapter TEXT NOT NULL,
  enabled INTEGER NOT NULL DEFAULT 0,
  isDefault INTEGER NOT NULL DEFAULT 0,
  configJson TEXT NOT NULL DEFAULT '{}',
  healthStatus TEXT NOT NULL DEFAULT 'UNKNOWN',
  lastHealthAt TEXT,
  lastError TEXT,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS SmsNumber (
  id TEXT PRIMARY KEY,
  serviceInstanceId TEXT NOT NULL UNIQUE,
  providerId TEXT NOT NULL,
  e164 TEXT NOT NULL,
  country TEXT NOT NULL,
  userId TEXT,
  guestKey TEXT,
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  expiresAt TEXT NOT NULL,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS SmsNumber_status_expiresAt_idx ON SmsNumber(status, expiresAt);
CREATE INDEX IF NOT EXISTS SmsNumber_country_status_idx ON SmsNumber(country, status);
CREATE INDEX IF NOT EXISTS SmsNumber_e164_idx ON SmsNumber(e164);

CREATE TABLE IF NOT EXISTS SmsMessage (
  id TEXT PRIMARY KEY,
  numberId TEXT NOT NULL,
  fromNumber TEXT NOT NULL,
  body TEXT NOT NULL,
  receivedAt TEXT NOT NULL,
  read INTEGER NOT NULL DEFAULT 0,
  idempotencyKey TEXT NOT NULL UNIQUE,
  providerMeta TEXT NOT NULL DEFAULT '{}'
);
CREATE INDEX IF NOT EXISTS SmsMessage_numberId_receivedAt_idx ON SmsMessage(numberId, receivedAt);

CREATE TABLE IF NOT EXISTS Plan (
  id TEXT PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  highlight TEXT,
  sortOrder INTEGER NOT NULL DEFAULT 0,
  isPublic INTEGER NOT NULL DEFAULT 1,
  isDefault INTEGER NOT NULL DEFAULT 0,
  lifetime INTEGER NOT NULL DEFAULT 0,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS PlanPrice (
  id TEXT PRIMARY KEY,
  planId TEXT NOT NULL,
  currency TEXT NOT NULL,
  interval TEXT NOT NULL,
  amountCents INTEGER NOT NULL,
  stripePriceId TEXT,
  active INTEGER NOT NULL DEFAULT 1,
  UNIQUE (planId, currency, interval)
);
CREATE INDEX IF NOT EXISTS PlanPrice_currency_idx ON PlanPrice(currency);

CREATE TABLE IF NOT EXISTS PlanLimit (
  id TEXT PRIMARY KEY,
  planId TEXT NOT NULL,
  key TEXT NOT NULL,
  value TEXT NOT NULL,
  UNIQUE (planId, key)
);

CREATE TABLE IF NOT EXISTS Subscription (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  planId TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'TRIALING',
  interval TEXT NOT NULL DEFAULT 'month',
  currency TEXT NOT NULL DEFAULT 'USD',
  currentPeriodStart TEXT NOT NULL,
  currentPeriodEnd TEXT NOT NULL,
  cancelAtPeriodEnd INTEGER NOT NULL DEFAULT 0,
  canceledAt TEXT,
  trialEndsAt TEXT,
  provider TEXT NOT NULL DEFAULT 'manual',
  providerSubscriptionId TEXT,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS Subscription_userId_status_idx ON Subscription(userId, status);
CREATE INDEX IF NOT EXISTS Subscription_planId_idx ON Subscription(planId);
CREATE INDEX IF NOT EXISTS Subscription_status_currentPeriodEnd_idx ON Subscription(status, currentPeriodEnd);

CREATE TABLE IF NOT EXISTS Payment (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  subscriptionId TEXT,
  provider TEXT NOT NULL,
  providerPaymentId TEXT,
  amountCents INTEGER NOT NULL,
  currency TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING',
  description TEXT,
  rawJson TEXT NOT NULL DEFAULT '{}',
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS Payment_userId_createdAt_idx ON Payment(userId, createdAt);
CREATE INDEX IF NOT EXISTS Payment_status_idx ON Payment(status);
CREATE INDEX IF NOT EXISTS Payment_providerPaymentId_idx ON Payment(providerPaymentId);

CREATE TABLE IF NOT EXISTS ManualPayment (
  id TEXT PRIMARY KEY,
  paymentId TEXT NOT NULL UNIQUE,
  userId TEXT NOT NULL,
  method TEXT NOT NULL,
  transactionId TEXT NOT NULL,
  screenshotKey TEXT,
  adminStatus TEXT NOT NULL DEFAULT 'PENDING',
  adminNote TEXT,
  reviewerId TEXT,
  reviewedAt TEXT,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS ManualPayment_adminStatus_createdAt_idx ON ManualPayment(adminStatus, createdAt);

CREATE TABLE IF NOT EXISTS Coupon (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  description TEXT,
  percentOff INTEGER,
  amountOffCents INTEGER,
  currency TEXT,
  maxRedemptions INTEGER,
  redeemedCount INTEGER NOT NULL DEFAULT 0,
  validFrom TEXT,
  validUntil TEXT,
  planKey TEXT,
  active INTEGER NOT NULL DEFAULT 1,
  createdAt TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS CouponRedemption (
  id TEXT PRIMARY KEY,
  couponId TEXT NOT NULL,
  userId TEXT NOT NULL,
  createdAt TEXT NOT NULL,
  UNIQUE (couponId, userId)
);

CREATE TABLE IF NOT EXISTS Referral (
  id TEXT PRIMARY KEY,
  referrerId TEXT NOT NULL,
  refereeId TEXT NOT NULL UNIQUE,
  rewardCents INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'PENDING',
  createdAt TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS Referral_referrerId_idx ON Referral(referrerId);

CREATE TABLE IF NOT EXISTS Currency (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  symbol TEXT NOT NULL,
  enabled INTEGER NOT NULL DEFAULT 1,
  isDefault INTEGER NOT NULL DEFAULT 0,
  localeHint TEXT,
  sortOrder INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS ApiKey (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  name TEXT NOT NULL,
  prefix TEXT NOT NULL,
  keyHash TEXT NOT NULL UNIQUE,
  lastFour TEXT NOT NULL,
  mode TEXT NOT NULL DEFAULT 'live',
  scopesJson TEXT NOT NULL DEFAULT '[]',
  rateLimitRpm INTEGER NOT NULL DEFAULT 60,
  revokedAt TEXT,
  expiresAt TEXT,
  lastUsedAt TEXT,
  graceUntil TEXT,
  rotatedFromId TEXT,
  createdAt TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS ApiKey_userId_idx ON ApiKey(userId);
CREATE INDEX IF NOT EXISTS ApiKey_prefix_idx ON ApiKey(prefix);

CREATE TABLE IF NOT EXISTS ApiUsage (
  id TEXT PRIMARY KEY,
  apiKeyId TEXT NOT NULL,
  day TEXT NOT NULL,
  requests INTEGER NOT NULL DEFAULT 0,
  errors INTEGER NOT NULL DEFAULT 0,
  bytesOut INTEGER NOT NULL DEFAULT 0,
  lastPath TEXT,
  updatedAt TEXT NOT NULL,
  UNIQUE (apiKeyId, day)
);

CREATE TABLE IF NOT EXISTS ApiRequestLog (
  id TEXT PRIMARY KEY,
  correlationId TEXT NOT NULL,
  apiKeyId TEXT,
  method TEXT NOT NULL,
  path TEXT NOT NULL,
  status INTEGER NOT NULL,
  durationMs INTEGER NOT NULL,
  ip TEXT,
  errorCode TEXT,
  createdAt TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS ApiRequestLog_apiKeyId_createdAt_idx ON ApiRequestLog(apiKeyId, createdAt);
CREATE INDEX IF NOT EXISTS ApiRequestLog_correlationId_idx ON ApiRequestLog(correlationId);
CREATE INDEX IF NOT EXISTS ApiRequestLog_createdAt_idx ON ApiRequestLog(createdAt);

CREATE TABLE IF NOT EXISTS Webhook (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  url TEXT NOT NULL,
  secretHash TEXT NOT NULL,
  eventsJson TEXT NOT NULL DEFAULT '[]',
  active INTEGER NOT NULL DEFAULT 1,
  sandbox INTEGER NOT NULL DEFAULT 0,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS Webhook_userId_active_idx ON Webhook(userId, active);

CREATE TABLE IF NOT EXISTS WebhookDelivery (
  id TEXT PRIMARY KEY,
  webhookId TEXT NOT NULL,
  event TEXT NOT NULL,
  payloadJson TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING',
  attempts INTEGER NOT NULL DEFAULT 0,
  lastStatus INTEGER,
  lastError TEXT,
  nextRetryAt TEXT,
  createdAt TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS WebhookDelivery_webhookId_createdAt_idx ON WebhookDelivery(webhookId, createdAt);
CREATE INDEX IF NOT EXISTS WebhookDelivery_status_nextRetryAt_idx ON WebhookDelivery(status, nextRetryAt);

CREATE TABLE IF NOT EXISTS AdNetwork (
  id TEXT PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  adapter TEXT NOT NULL,
  enabled INTEGER NOT NULL DEFAULT 0,
  configJson TEXT NOT NULL DEFAULT '{}',
  createdAt TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS AdPlacement (
  id TEXT PRIMARY KEY,
  networkId TEXT NOT NULL,
  key TEXT NOT NULL UNIQUE,
  zone TEXT NOT NULL,
  slotId TEXT,
  devicesJson TEXT NOT NULL DEFAULT '[]',
  countriesJson TEXT NOT NULL DEFAULT '[]',
  activeFrom TEXT,
  activeTo TEXT,
  priority INTEGER NOT NULL DEFAULT 0,
  frequencyCap INTEGER,
  excludePremium INTEGER NOT NULL DEFAULT 1,
  abBucket TEXT,
  enabled INTEGER NOT NULL DEFAULT 1,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS AdImpression (
  id TEXT PRIMARY KEY,
  placementId TEXT NOT NULL,
  day TEXT NOT NULL,
  count INTEGER NOT NULL DEFAULT 0,
  estimatedCents INTEGER NOT NULL DEFAULT 0,
  UNIQUE (placementId, day)
);

CREATE TABLE IF NOT EXISTS AdClick (
  id TEXT PRIMARY KEY,
  placementId TEXT NOT NULL,
  day TEXT NOT NULL,
  count INTEGER NOT NULL DEFAULT 0,
  UNIQUE (placementId, day)
);

CREATE TABLE IF NOT EXISTS BlogCategory (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT
);

CREATE TABLE IF NOT EXISTS BlogTag (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS BlogPost (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  excerpt TEXT NOT NULL DEFAULT '',
  contentMd TEXT NOT NULL DEFAULT '',
  contentHtml TEXT NOT NULL DEFAULT '',
  coverImage TEXT,
  authorName TEXT NOT NULL DEFAULT 'Haven Editorial',
  status TEXT NOT NULL DEFAULT 'DRAFT',
  publishedAt TEXT,
  seoTitle TEXT,
  seoDescription TEXT,
  categoryId TEXT,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS BlogPost_status_publishedAt_idx ON BlogPost(status, publishedAt);

CREATE TABLE IF NOT EXISTS BlogPostTag (
  postId TEXT NOT NULL,
  tagId TEXT NOT NULL,
  PRIMARY KEY (postId, tagId)
);

CREATE TABLE IF NOT EXISTS Faq (
  id TEXT PRIMARY KEY,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  sortOrder INTEGER NOT NULL DEFAULT 0,
  locale TEXT NOT NULL DEFAULT 'en',
  published INTEGER NOT NULL DEFAULT 1,
  updatedAt TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS Page (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  contentMd TEXT NOT NULL DEFAULT '',
  contentHtml TEXT NOT NULL DEFAULT '',
  seoTitle TEXT,
  seoDescription TEXT,
  published INTEGER NOT NULL DEFAULT 1,
  updatedAt TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS Announcement (
  id TEXT PRIMARY KEY,
  kind TEXT NOT NULL DEFAULT 'INFO',
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  href TEXT,
  audience TEXT NOT NULL DEFAULT 'ALL',
  countries TEXT NOT NULL DEFAULT '[]',
  devices TEXT NOT NULL DEFAULT '[]',
  activeFrom TEXT,
  activeTo TEXT,
  dismissible INTEGER NOT NULL DEFAULT 1,
  enabled INTEGER NOT NULL DEFAULT 1,
  createdAt TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS Translation (
  id TEXT PRIMARY KEY,
  locale TEXT NOT NULL,
  namespace TEXT NOT NULL,
  key TEXT NOT NULL,
  value TEXT NOT NULL,
  UNIQUE (locale, namespace, key)
);
CREATE INDEX IF NOT EXISTS Translation_locale_namespace_idx ON Translation(locale, namespace);

CREATE TABLE IF NOT EXISTS SeoEntry (
  id TEXT PRIMARY KEY,
  path TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  ogImage TEXT,
  noindex INTEGER NOT NULL DEFAULT 0,
  updatedAt TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS SupportTicket (
  id TEXT PRIMARY KEY,
  userId TEXT,
  email TEXT NOT NULL,
  subject TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'OPEN',
  priority TEXT NOT NULL DEFAULT 'NORMAL',
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS SupportTicket_status_createdAt_idx ON SupportTicket(status, createdAt);
CREATE INDEX IF NOT EXISTS SupportTicket_email_idx ON SupportTicket(email);

CREATE TABLE IF NOT EXISTS TicketReply (
  id TEXT PRIMARY KEY,
  ticketId TEXT NOT NULL,
  userId TEXT,
  author TEXT NOT NULL,
  body TEXT NOT NULL,
  staff INTEGER NOT NULL DEFAULT 0,
  createdAt TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS AbuseReport (
  id TEXT PRIMARY KEY,
  userId TEXT,
  mailboxId TEXT,
  messageId TEXT,
  reporterIp TEXT,
  category TEXT NOT NULL,
  details TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'OPEN',
  resolution TEXT,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS AbuseReport_status_createdAt_idx ON AbuseReport(status, createdAt);

CREATE TABLE IF NOT EXISTS Notification (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  href TEXT,
  readAt TEXT,
  createdAt TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS Notification_userId_createdAt_idx ON Notification(userId, createdAt);

CREATE TABLE IF NOT EXISTS AuditLog (
  id TEXT PRIMARY KEY,
  actorId TEXT,
  actorEmail TEXT,
  action TEXT NOT NULL,
  targetType TEXT NOT NULL,
  targetId TEXT,
  beforeJson TEXT NOT NULL DEFAULT '{}',
  afterJson TEXT NOT NULL DEFAULT '{}',
  ip TEXT,
  createdAt TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS AuditLog_createdAt_idx ON AuditLog(createdAt);
CREATE INDEX IF NOT EXISTS AuditLog_targetType_targetId_idx ON AuditLog(targetType, targetId);
CREATE INDEX IF NOT EXISTS AuditLog_actorId_idx ON AuditLog(actorId);

CREATE TABLE IF NOT EXISTS SecurityEvent (
  id TEXT PRIMARY KEY,
  userId TEXT,
  type TEXT NOT NULL,
  ip TEXT,
  userAgent TEXT,
  metaJson TEXT NOT NULL DEFAULT '{}',
  createdAt TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS SecurityEvent_type_createdAt_idx ON SecurityEvent(type, createdAt);
CREATE INDEX IF NOT EXISTS SecurityEvent_ip_createdAt_idx ON SecurityEvent(ip, createdAt);

CREATE TABLE IF NOT EXISTS IpBan (
  id TEXT PRIMARY KEY,
  cidr TEXT NOT NULL UNIQUE,
  reason TEXT NOT NULL,
  expiresAt TEXT,
  createdAt TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS SystemSetting (
  id TEXT PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  value TEXT NOT NULL,
  "group" TEXT NOT NULL DEFAULT 'general',
  type TEXT NOT NULL DEFAULT 'string',
  updatedAt TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS FeatureFlag (
  id TEXT PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  enabled INTEGER NOT NULL DEFAULT 1,
  description TEXT,
  updatedAt TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS RateLimitRule (
  id TEXT PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  scope TEXT NOT NULL,
  "limit" INTEGER NOT NULL,
  windowSec INTEGER NOT NULL,
  burst INTEGER NOT NULL DEFAULT 0,
  description TEXT,
  enabled INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS AnalyticsDaily (
  id TEXT PRIMARY KEY,
  day TEXT NOT NULL UNIQUE,
  visitors INTEGER NOT NULL DEFAULT 0,
  mailboxesCreated INTEGER NOT NULL DEFAULT 0,
  messagesReceived INTEGER NOT NULL DEFAULT 0,
  signups INTEGER NOT NULL DEFAULT 0,
  premiumStarts INTEGER NOT NULL DEFAULT 0,
  apiRequests INTEGER NOT NULL DEFAULT 0,
  revenueCents INTEGER NOT NULL DEFAULT 0,
  adImpressions INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS JobRun (
  id TEXT PRIMARY KEY,
  job TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'RUNNING',
  startedAt TEXT NOT NULL,
  finishedAt TEXT,
  resultJson TEXT NOT NULL DEFAULT '{}',
  error TEXT
);
CREATE INDEX IF NOT EXISTS JobRun_job_startedAt_idx ON JobRun(job, startedAt);

CREATE TABLE IF NOT EXISTS ContactSubmission (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  topic TEXT NOT NULL,
  message TEXT NOT NULL,
  ip TEXT,
  createdAt TEXT NOT NULL,
  handled INTEGER NOT NULL DEFAULT 0
);
