import { argon2id } from "@noble/hashes/argon2.js";
import { bytesToHex, utf8ToBytes } from "@noble/hashes/utils.js";
import { randomBytes } from "node:crypto";
import { getEnv } from "../../config/env";
import { prisma } from "../../lib/db";
import { purgeLegacyInjectedMessages } from "../../server/services/legacy-data-cleanup";
import { blogCategories, blogPosts } from "./blog-content";

async function hashPassword(password: string) {
  const salt = randomBytes(16);
  const hash = argon2id(utf8ToBytes(password), salt, { t: 3, m: 32 * 1024, p: 1, dkLen: 32 });
  return `argon2id$${bytesToHex(salt)}$${bytesToHex(hash)}`;
}

async function upsertSetting(key: string, value: string, group: string, type = "string") {
  await prisma.systemSetting.upsert({
    where: { key },
    update: { value, group, type },
    create: { key, value, group, type },
  });
}

async function upsertFlag(key: string, enabled: boolean, description: string) {
  await prisma.featureFlag.upsert({
    where: { key },
    update: { enabled, description },
    create: { key, enabled, description },
  });
}

async function main() {
  await purgeLegacyInjectedMessages();

  const permissions = [
    ["admin.access", "admin", "Access the admin console"],
    ["admin.users.read", "users", "View users"],
    ["admin.users.write", "users", "Edit, suspend, or ban users"],
    ["admin.mailboxes.read", "mailboxes", "View mailbox metadata"],
    ["admin.mailboxes.write", "mailboxes", "Expire or purge mailboxes"],
    ["admin.domains.write", "domains", "Manage email domains"],
    ["admin.providers.write", "providers", "Manage email/SMS providers"],
    ["admin.plans.write", "billing", "Edit plans and limits"],
    ["admin.payments.write", "billing", "Review payments"],
    ["admin.ads.write", "ads", "Manage ad placements"],
    ["admin.cms.write", "cms", "Edit pages, blog, FAQ"],
    ["admin.settings.write", "settings", "Change system settings"],
    ["admin.security.write", "security", "Manage bans and rate limits"],
    ["admin.audit.read", "security", "Read audit logs"],
    ["admin.tickets.write", "support", "Handle support tickets"],
    ["admin.reports.write", "security", "Handle abuse reports"],
    ["admin.analytics.read", "analytics", "View analytics"],
  ];
  for (const [key, group, description] of permissions) {
    await prisma.permission.upsert({ where: { key }, update: { group, description }, create: { key, group, description } });
  }
  const allPerms = await prisma.permission.findMany();

  const roles: { key: string; name: string; perm?: string[] }[] = [
    { key: "SUPER_ADMIN", name: "Super Admin" },
    { key: "ADMIN", name: "Admin" },
    {
      key: "MODERATOR",
      name: "Moderator",
      perm: ["admin.access", "admin.mailboxes.read", "admin.reports.write", "admin.tickets.write"],
    },
    {
      key: "SUPPORT",
      name: "Support",
      perm: ["admin.access", "admin.users.read", "admin.tickets.write", "admin.mailboxes.read"],
    },
    { key: "ANALYST", name: "Analyst", perm: ["admin.access", "admin.analytics.read", "admin.audit.read"] },
    { key: "USER", name: "User", perm: [] },
  ];

  for (const r of roles) {
    const role = await prisma.role.upsert({
      where: { key: r.key },
      update: { name: r.name, isSystem: true },
      create: { key: r.key, name: r.name, isSystem: true },
    });
    await prisma.rolePermission.deleteMany({ where: { roleId: role.id } });
    const assign =
      r.key === "SUPER_ADMIN" || r.key === "ADMIN" ? allPerms : allPerms.filter((p) => r.perm?.includes(p.key));
    if (assign.length) {
      await prisma.rolePermission.createMany({
        data: assign.map((p) => ({ roleId: role.id, permissionId: p.id })),
      });
    }
  }

  const services = [
    { key: "temp_email", name: "Temporary Email", description: "Disposable inboxes that expire automatically.", href: "/inbox", icon: "inbox", sortOrder: 1 },
    { key: "temp_sms", name: "Temporary Phone", description: "Receive SMS for testing and personal privacy.", href: "/temporary-phone", icon: "smartphone", sortOrder: 2 },
    { key: "file_drop", name: "File Drop", description: "Auto-expiring encrypted file sharing.", href: "/tools", icon: "file", sortOrder: 3, enabled: false },
    { key: "burner_link", name: "Burner Links", description: "Self-destructing notes and links.", href: "/tools", icon: "link", sortOrder: 4, enabled: false },
    { key: "temp_chat", name: "Temporary Chat", description: "Ephemeral rooms with no long-term logs.", href: "/tools", icon: "message", sortOrder: 5, enabled: false },
    { key: "smtp_sandbox", name: "SMTP Sandbox", description: "Capture mail for QA and developers.", href: "/temporary-email-for-testing", icon: "server", sortOrder: 6, enabled: true },
    { key: "breach_check", name: "Breach Checker", description: "See if a username appears in known dumps.", href: "/tools/breach-checker", icon: "shield", sortOrder: 7 },
    { key: "fingerprint", name: "Tracker Check", description: "Inspect what your browser reveals.", href: "/tools/fingerprint", icon: "scan", sortOrder: 8 },
  ];
  for (const s of services) {
    await prisma.service.upsert({
      where: { key: s.key },
      update: { name: s.name, description: s.description, href: s.href, icon: s.icon, sortOrder: s.sortOrder, enabled: s.enabled ?? true },
      create: { ...s, enabled: s.enabled ?? true },
    });
  }

  const domains = [
    // .test domains (development)
    { domain: "mail.haven.test", displayName: "Haven Mail", status: "ACTIVE", eligibility: "FREE", weight: 70, mxOk: true },
    { domain: "inbox.haven.test", displayName: "Haven Inbox", status: "ACTIVE", eligibility: "FREE", weight: 65, mxOk: true },
    { domain: "quick.haven.test", displayName: "Haven Quick", status: "ACTIVE", eligibility: "FREE", weight: 60, mxOk: true },

    // Professional .com domains (FREE tier) - realistic temp mail style (like temp-mail.org)
    { domain: "playboot.com", displayName: "Playboot", status: "ACTIVE", eligibility: "FREE", weight: 130, mxOk: true },
    { domain: "inboxhub.com", displayName: "InboxHub", status: "ACTIVE", eligibility: "FREE", weight: 120, mxOk: true },
    { domain: "maildrop.com", displayName: "MailDrop", status: "ACTIVE", eligibility: "FREE", weight: 115, mxOk: true },
    { domain: "tempinbox.com", displayName: "TempInbox", status: "ACTIVE", eligibility: "FREE", weight: 110, mxOk: true },
    { domain: "quickmail.com", displayName: "QuickMail", status: "ACTIVE", eligibility: "FREE", weight: 105, mxOk: true },
    { domain: "disposablemail.com", displayName: "DisposableMail", status: "ACTIVE", eligibility: "FREE", weight: 100, mxOk: true },

    // Premium domains
    { domain: "pro.haven.test", displayName: "Haven Pro", status: "ACTIVE", eligibility: "PREMIUM_ONLY", weight: 40, mxOk: true },
    { domain: "corp.haven.test", displayName: "Haven Business", status: "ACTIVE", eligibility: "BUSINESS_ONLY", weight: 20, mxOk: true },
  ];
  for (const d of domains) {
    await prisma.emailDomain.upsert({
      where: { domain: d.domain },
      update: d,
      create: { ...d, mxRequired: true, catchAll: true, lastHealthAt: new Date(), lastHealthNote: "seed" },
    });
  }

  await prisma.emailProvider.upsert({
    where: { key: "mock" },
    update: { enabled: true, isDefault: true, adapter: "mock", healthStatus: "HEALTHY" },
    create: { key: "mock", name: "Development inbound", adapter: "mock", enabled: true, isDefault: true, healthStatus: "HEALTHY" },
  });
  await prisma.emailProvider.upsert({
    where: { key: "mailgun" },
    update: { adapter: "mailgun" },
    create: { key: "mailgun", name: "Mailgun", adapter: "mailgun", enabled: false },
  });
  await prisma.emailProvider.upsert({
    where: { key: "postmark" },
    update: { adapter: "postmark" },
    create: { key: "postmark", name: "Postmark", adapter: "postmark", enabled: false },
  });
  await prisma.emailProvider.upsert({
    where: { key: "smtp" },
    update: { adapter: "smtp" },
    create: { key: "smtp", name: "Direct SMTP", adapter: "smtp", enabled: false },
  });

  await prisma.smsProvider.upsert({
    where: { key: "mock" },
    update: { enabled: true, isDefault: true, adapter: "mock", healthStatus: "HEALTHY" },
    create: { key: "mock", name: "Development SMS", adapter: "mock", enabled: true, isDefault: true, healthStatus: "HEALTHY" },
  });
  await prisma.smsProvider.upsert({
    where: { key: "twilio" },
    update: {},
    create: { key: "twilio", name: "Twilio", adapter: "twilio", enabled: false },
  });
  await prisma.smsProvider.upsert({
    where: { key: "telnyx" },
    update: {},
    create: { key: "telnyx", name: "Telnyx", adapter: "telnyx", enabled: false },
  });
  await prisma.smsProvider.upsert({
    where: { key: "vonage" },
    update: {},
    create: { key: "vonage", name: "Vonage", adapter: "vonage", enabled: false },
  });

  const planDefs = [
    {
      key: "FREE",
      name: "Free",
      description: "Instant disposable inboxes. No account required.",
      highlight: null,
      sortOrder: 0,
      isDefault: true,
      prices: [] as { currency: string; interval: string; amountCents: number }[],
      limits: {
        max_active_mailboxes: "3",
        mailbox_ttl_minutes: "10",
        custom_usernames: "true",
        max_aliases: "0",
        api_rpm: "0",
        ads_excluded: "false",
        persistent_mailbox: "false",
        forwarding: "false",
        premium_domains: "false",
      },
    },
    {
      key: "PRO",
      name: "Pro",
      description: "Longer lifetimes, premium domains, and an ad-free inbox.",
      highlight: "Most popular",
      sortOrder: 1,
      prices: [
        { currency: "USD", interval: "month", amountCents: 600 },
        { currency: "USD", interval: "year", amountCents: 6000 },
        { currency: "EUR", interval: "month", amountCents: 600 },
        { currency: "GBP", interval: "month", amountCents: 500 },
        { currency: "PKR", interval: "month", amountCents: 150000 },
        { currency: "AED", interval: "month", amountCents: 2200 },
      ],
      limits: {
        max_active_mailboxes: "15",
        mailbox_ttl_minutes: "1440",
        custom_usernames: "true",
        max_aliases: "10",
        api_rpm: "30",
        ads_excluded: "true",
        persistent_mailbox: "true",
        forwarding: "true",
        premium_domains: "true",
      },
    },
    {
      key: "DEVELOPER",
      name: "Developer",
      description: "API access, webhooks, sandbox domains, and higher limits.",
      highlight: "For builders",
      sortOrder: 2,
      prices: [
        { currency: "USD", interval: "month", amountCents: 1800 },
        { currency: "USD", interval: "year", amountCents: 18000 },
        { currency: "EUR", interval: "month", amountCents: 1700 },
        { currency: "GBP", interval: "month", amountCents: 1500 },
        { currency: "PKR", interval: "month", amountCents: 450000 },
        { currency: "AED", interval: "month", amountCents: 6600 },
      ],
      limits: {
        max_active_mailboxes: "50",
        mailbox_ttl_minutes: "4320",
        custom_usernames: "true",
        max_aliases: "50",
        api_rpm: "120",
        ads_excluded: "true",
        persistent_mailbox: "true",
        forwarding: "true",
        premium_domains: "true",
      },
    },
    {
      key: "BUSINESS",
      name: "Business",
      description: "Team provisioning, business domains, and priority support.",
      highlight: null,
      sortOrder: 3,
      lifetime: false,
      prices: [
        { currency: "USD", interval: "month", amountCents: 4900 },
        { currency: "USD", interval: "year", amountCents: 49000 },
        { currency: "USD", interval: "lifetime", amountCents: 24900 },
        { currency: "EUR", interval: "month", amountCents: 4500 },
        { currency: "GBP", interval: "month", amountCents: 3900 },
        { currency: "PKR", interval: "month", amountCents: 1200000 },
        { currency: "AED", interval: "month", amountCents: 17900 },
      ],
      limits: {
        max_active_mailboxes: "250",
        mailbox_ttl_minutes: "10080",
        custom_usernames: "true",
        max_aliases: "250",
        api_rpm: "600",
        ads_excluded: "true",
        persistent_mailbox: "true",
        forwarding: "true",
        premium_domains: "true",
      },
    },
  ];

  for (const p of planDefs) {
    const plan = await prisma.plan.upsert({
      where: { key: p.key },
      update: { name: p.name, description: p.description, highlight: p.highlight, sortOrder: p.sortOrder, isDefault: Boolean(p.isDefault) },
      create: { key: p.key, name: p.name, description: p.description, highlight: p.highlight, sortOrder: p.sortOrder, isDefault: Boolean(p.isDefault), lifetime: Boolean(p.lifetime) },
    });
    for (const price of p.prices) {
      await prisma.planPrice.upsert({
        where: { planId_currency_interval: { planId: plan.id, currency: price.currency, interval: price.interval } },
        update: { amountCents: price.amountCents, active: true },
        create: { planId: plan.id, ...price, active: true },
      });
    }
    for (const [k, v] of Object.entries(p.limits)) {
      await prisma.planLimit.upsert({
        where: { planId_key: { planId: plan.id, key: k } },
        update: { value: v },
        create: { planId: plan.id, key: k, value: v },
      });
    }
  }

  const currencies = [
    { code: "USD", name: "US Dollar", symbol: "$", isDefault: true, localeHint: "en" },
    { code: "EUR", name: "Euro", symbol: "€", localeHint: "fr" },
    { code: "GBP", name: "British Pound", symbol: "£", localeHint: "en" },
    { code: "PKR", name: "Pakistani Rupee", symbol: "₨", localeHint: "ur" },
    { code: "AED", name: "UAE Dirham", symbol: "د.إ", localeHint: "ar" },
  ];
  for (const c of currencies) {
    await prisma.currency.upsert({
      where: { code: c.code },
      update: c,
      create: c,
    });
  }

  const settings: [string, string, string, string][] = [
    ["brand.name", "Haven", "brand", "string"],
    ["brand.tagline", "Your private inbox. Instantly.", "brand", "string"],
    ["mailbox.default_ttl_minutes", "10", "mailbox", "number"],
    ["mailbox.premium_ttl_minutes", "1440", "mailbox", "number"],
    ["mailbox.max_extension_minutes", "120", "mailbox", "number"],
    ["mailbox.expiring_soon_minutes", "5", "mailbox", "number"],
    ["mailbox.max_message_bytes", "2097152", "mailbox", "number"],
    ["mailbox.max_attachment_bytes", "5242880", "mailbox", "number"],
    ["mailbox.username_min", "3", "mailbox", "number"],
    ["mailbox.username_max", "32", "mailbox", "number"],
    ["message.retention_minutes_free", "1440", "privacy", "number"],
    ["message.retention_minutes_premium", "10080", "privacy", "number"],
    ["attachment.retention_minutes", "1440", "privacy", "number"],
    ["sms.default_ttl_minutes", "10", "sms", "number"],
    // A released number is never re-assigned until this quarantine elapses,
    // so a new visitor can never receive the previous renter's SMS.
    ["sms.quarantine_minutes", "1440", "sms", "number"],
    ["maintenance.enabled", "false", "system", "bool"],
    ["feature.registration", "true", "system", "bool"],
    ["i18n.default_locale", "en", "i18n", "string"],
    ["billing.default_currency", "USD", "billing", "string"],
    ["ads.enabled", "true", "ads", "bool"],
    // Test mode ships on: real units only render once an operator adds a
    // network client id and turns test mode off in the admin panel.
    ["ads.test_mode", "true", "ads", "bool"],
    ["ads.client_id", "", "ads", "string"],
    ["referral.reward_cents", "300", "billing", "number"],
    ["referral.max_rewards_per_user", "25", "billing", "number"],
    ["seo.default_title", "Haven — Temporary Email & Privacy Tools", "seo", "string"],
    ["seo.default_description", "Create a disposable email address in seconds. No signup. Messages are sanitized before you see them and auto-delete.", "seo", "string"],
  ];
  for (const [k, v, g, t] of settings) await upsertSetting(k, v, g, t);

  const flags: [string, boolean, string][] = [
    ["temp_email", true, "Temporary email product"],
    ["temp_sms", true, "Temporary phone / SMS"],
    ["developer_api", true, "Public developer API"],
    ["premium", true, "Paid plans"],
    ["ads", true, "Advertising placements"],
    ["blog", true, "Public blog"],
    ["registration", true, "Account registration"],
    ["custom_domains", true, "Custom / premium domains"],
    ["aliases", true, "Email aliases"],
    ["maintenance_mode", false, "Global maintenance mode"],
  ];
  for (const [k, e, d] of flags) await upsertFlag(k, e, d);

  const rules: [string, string, number, number, number][] = [
    ["anon.mailbox.create", "ip", 8, 60, 2],
    ["anon.mailbox.create.hour", "ip", 40, 3600, 0],
    ["auth.login", "ip", 8, 300, 0],
    ["auth.register", "ip", 5, 3600, 0],
    ["api.default", "apikey", 60, 60, 10],
    ["inbound.webhook", "ip", 300, 60, 50],
    ["contact.form", "ip", 4, 3600, 0],
    ["report.abuse", "ip", 8, 3600, 0],
  ];
  for (const [key, scope, limit, windowSec, burst] of rules) {
    await prisma.rateLimitRule.upsert({
      where: { key },
      update: { scope, limit, windowSec, burst, enabled: true },
      create: { key, scope, limit, windowSec, burst, enabled: true },
    });
  }

  const faqs = [
    ["How fast do I get an address?", "A disposable address is created as soon as the page loads. You can copy it immediately — no account, no extra click.", "general"],
    ["Do I need to sign up?", "No. Signup is optional and only needed for saved addresses, aliases, API keys, and paid plans.", "general"],
    ["How long do messages stay?", "Free inboxes expire on a short timer (configurable by the operator, typically 10 minutes) and messages are purged according to the retention policy. Paid plans keep mail longer.", "privacy"],
    ["Is my email content safe to open?", "Every message is treated as hostile input. Scripts and dangerous markup are stripped, HTML is sanitized, and the viewer runs in a sandboxed frame.", "safety"],
    ["Can I receive attachments?", "Yes, with an allowlist. Executables are blocked. Downloads are served as attachments with nosniff headers.", "safety"],
    ["Do you claim this is anonymous?", "No. We minimize what we store and delete on a schedule, but we do not claim the service is anonymous or untraceable.", "privacy"],
    ["How do paid plans work?", "Plans and limits live in the database. Card payments go through Stripe webhooks. Regional rails (bank transfer, JazzCash, Easypaisa) require admin approval before premium activates.", "billing"],
    ["Can developers use an API?", "Yes. Create a key in the dashboard. Live keys are hashed at rest and shown once. Sandbox mode never touches production domains or quota.", "api"],
    ["What is the SMS number for?", "Temporary numbers are for QA, developer testing, and personal privacy on accounts you own. Using them to abuse third-party services is prohibited.", "sms"],
    ["How do I report abuse?", "Use Report on any message, or visit the abuse page. Reports land in the admin queue.", "safety"],
  ];
  if ((await prisma.faq.count()) === 0) {
    await prisma.faq.createMany({
      data: faqs.map((f, i) => ({ question: f[0]!, answer: f[1]!, category: f[2]!, sortOrder: i, locale: "en", published: true })),
    });
  }

  const pages = [
    {
      slug: "privacy",
      title: "Privacy Policy",
      contentHtml: privacyHtml(),
      seoTitle: "Privacy Policy — Haven",
      seoDescription:
        "What data Haven collects when you use a temporary inbox, how long messages and logs are kept, who they are shared with, and how to have your data deleted.",
    },
    {
      slug: "terms",
      title: "Terms of Service",
      contentHtml: termsHtml(),
      seoTitle: "Terms of Service — Haven",
      seoDescription:
        "The terms governing use of Haven temporary email and privacy services, including account rules, plan billing, service availability, and limitation of liability.",
    },
    {
      slug: "cookies",
      title: "Cookie Policy",
      contentHtml: cookiesHtml(),
      seoTitle: "Cookie Policy — Haven",
      seoDescription:
        "The cookies and similar technologies Haven uses, including the guest mailbox cookie and session cookie, what each stores, and how long they persist.",
    },
    {
      slug: "acceptable-use",
      title: "Acceptable Use Policy",
      contentHtml: aupHtml(),
      seoTitle: "Acceptable Use — Haven",
      seoDescription:
        "What you may not do with Haven temporary email: bulk account creation, ban evasion, harassment, defeating third-party anti-fraud controls, and other prohibited uses.",
    },
    {
      slug: "abuse",
      title: "Abuse Policy",
      contentHtml: abuseHtml(),
      seoTitle: "Abuse Policy — Haven",
      seoDescription:
        "How to report abusive mail, phishing, or misuse of a Haven address, what information helps us act, and how the moderation queue handles each report.",
    },
    {
      slug: "security",
      title: "Security",
      contentHtml: securityHtml(),
      seoTitle: "Security — Haven",
      seoDescription:
        "How Haven protects inboxes and accounts: HTML sanitization, sandboxed rendering, attachment allowlists, Argon2id password hashing, and responsible disclosure.",
    },
  ];
  for (const p of pages) {
    await prisma.page.upsert({
      where: { slug: p.slug },
      update: { title: p.title, contentHtml: p.contentHtml, seoTitle: p.seoTitle, seoDescription: p.seoDescription, published: true },
      create: { ...p, published: true },
    });
  }

  // Editorial content: categories and long-form explainers. Existing posts are
  // never overwritten, so operator edits survive re-seeding.
  const categoryIds = new Map<string, string>();
  for (const category of blogCategories) {
    const existing = await prisma.blogCategory.findUnique({ where: { slug: category.slug } });
    const row =
      existing ??
      (await prisma.blogCategory.create({
        data: { slug: category.slug, name: category.name, description: category.description },
      }));
    categoryIds.set(category.slug, row.id);
  }

  let publishedOffset = 0;
  for (const post of blogPosts) {
    if (await prisma.blogPost.findUnique({ where: { slug: post.slug } })) continue;
    // Stagger publication dates so the feed is not one identical timestamp.
    publishedOffset += 1;
    await prisma.blogPost.create({
      data: {
        slug: post.slug,
        title: post.title,
        excerpt: post.excerpt,
        contentHtml: post.html,
        contentMd: post.excerpt,
        status: "PUBLISHED",
        authorName: "Haven Editorial",
        publishedAt: new Date(Date.now() - publishedOffset * 3 * 86400000),
        categoryId: categoryIds.get(post.category),
        seoTitle: post.seoTitle,
        seoDescription: post.seoDescription,
      },
    });
  }

  // Go through getEnv so a quoted/padded/invalid ADMIN_EMAIL in .env cannot
  // seed a broken admin account — it validates and falls back to the default.
  const { ADMIN_EMAIL: adminEmail, ADMIN_PASSWORD: adminPass } = getEnv();
  let admin = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (!admin) {
    admin = await prisma.user.create({
      data: {
        email: adminEmail,
        passwordHash: await hashPassword(adminPass),
        name: "Haven Operator",
        displayName: "Operator",
        referralCode: "HAVENOP",
        emailVerifiedAt: new Date(),
        status: "ACTIVE",
      },
    });
    const superRole = await prisma.role.findUnique({ where: { key: "SUPER_ADMIN" } });
    if (superRole) {
      await prisma.userRole.create({ data: { userId: admin.id, roleId: superRole.id } });
    }
  }

  const network = await prisma.adNetwork.upsert({
    where: { key: "internal" },
    update: { enabled: true, adapter: "generic" },
    create: { key: "internal", name: "Internal / house", adapter: "generic", enabled: true },
  });
  // Payment methods an operator can turn on and fill in from the admin panel.
  // They ship disabled and empty: no credentials are ever hardcoded.
  const paymentMethods: {
    key: string;
    kind: string;
    name: string;
    displayName: string;
    description: string;
    instructions: string;
    currency: string;
    sortOrder: number;
  }[] = [
    {
      key: "stripe",
      kind: "STRIPE",
      name: "Stripe",
      displayName: "Card payment",
      description: "Pay by card. Premium activates automatically once Stripe confirms the payment.",
      instructions: "",
      currency: "USD",
      sortOrder: 0,
    },
    {
      key: "jazzcash",
      kind: "MANUAL",
      name: "JazzCash",
      displayName: "JazzCash",
      description: "Send the amount to the JazzCash account below, then submit your transaction ID.",
      instructions: "Open JazzCash, send the exact amount, and paste the TID from your receipt.",
      currency: "PKR",
      sortOrder: 1,
    },
    {
      key: "easypaisa",
      kind: "MANUAL",
      name: "Easypaisa",
      displayName: "Easypaisa",
      description: "Send the amount to the Easypaisa account below, then submit your transaction ID.",
      instructions: "Open Easypaisa, send the exact amount, and paste the TID from your receipt.",
      currency: "PKR",
      sortOrder: 2,
    },
    {
      key: "bank_transfer",
      kind: "MANUAL",
      name: "Bank transfer",
      displayName: "Bank transfer",
      description: "Transfer to the bank account below, then submit your reference number.",
      instructions: "Use your account email as the transfer reference where possible.",
      currency: "PKR",
      sortOrder: 3,
    },
  ];
  for (const method of paymentMethods) {
    const existing = await prisma.paymentMethod.findUnique({ where: { key: method.key } });
    if (!existing) {
      await prisma.paymentMethod.create({
        data: { ...method, enabled: false, status: "ACTIVE", planKeysJson: "[]" },
      });
    }
  }

  // One placement row per canonical slot so every slot is administrable from
  // day one. Enabled by default, but test mode keeps them as placeholders.
  const canonicalSlots: [string, string][] = [
    ["top_leaderboard", "header"],
    ["hero", "hero"],
    ["content", "content"],
    ["rectangle", "content"],
    ["right_rail", "rail"],
    ["left_rail", "rail"],
    ["mobile", "mobile"],
    ["blog", "blog"],
    ["tools", "tools"],
    ["footer", "footer"],
  ];
  for (const [slot, zone] of canonicalSlots) {
    await prisma.adPlacement.upsert({
      where: { key: `slot_${slot}` },
      update: { zone },
      create: {
        networkId: network.id,
        key: `slot_${slot}`,
        zone,
        slotId: null,
        excludePremium: true,
        enabled: true,
      },
    });
  }

  if ((await prisma.announcement.count()) === 0) {
    await prisma.announcement.create({
      data: {
        kind: "INFO",
        title: "Inboxes expire automatically",
        body: "Free addresses are short-lived by design. Copy what you need before the timer ends.",
        audience: "ANON",
        enabled: true,
      },
    });
  }

  console.log("Haven seed complete.");
}

function wrap(title: string, body: string) {
  return `<article class="prose"><h1>${title}</h1>${body}</article>`;
}

function privacyHtml() {
  return wrap(
    "Privacy Policy",
    `<p>Last updated: 13 August 2026.</p>
<p>Haven provides temporary inboxes and related privacy tools. We store the minimum needed to operate the service.</p>
<h2>What we store</h2>
<ul>
<li>Disposable mailbox addresses, expiry time, and messages until the retention window elapses.</li>
<li>If you create an account: email, password hash (Argon2id), plan, and security events.</li>
<li>Technical logs (IP, user agent) for abuse prevention, kept for a limited window.</li>
</ul>
<h2>What we do not do</h2>
<ul>
<li>We do not sell the contents of your disposable mail.</li>
<li>We do not claim the service is anonymous or untraceable.</li>
<li>We do not keep message bodies after the configured retention period.</li>
</ul>
<h2>Your choices</h2>
<p>Delete an inbox at any time. Registered users may export or delete their account from settings. Contact us if you need help.</p>`,
  );
}

function termsHtml() {
  return wrap(
    "Terms of Service",
    `<p>Last updated: 13 August 2026.</p>
<p>By using Haven you agree to these terms and to the Acceptable Use Policy.</p>
<h2>The service</h2>
<p>Temporary addresses and messages expire. We may refuse, rate-limit, or terminate access to protect the platform and other users.</p>
<h2>Accounts</h2>
<p>You are responsible for credentials issued to you. Paid features activate only after a verified payment event (Stripe webhook) or manual admin approval.</p>
<h2>No warranty</h2>
<p>The service is provided as-is. Disposable mail is not a substitute for a long-term identity or a legal mailbox.</p>`,
  );
}

function cookiesHtml() {
  return wrap(
    "Cookie Policy",
    `<p>We use a small number of first-party cookies:</p>
<ul>
<li><strong>haven_session</strong> — httpOnly session for signed-in users.</li>
<li><strong>haven_guest</strong> — signed guest token so your inbox survives a refresh.</li>
<li><strong>haven_locale / theme</strong> — interface preferences.</li>
</ul>
<p>We do not use third-party advertising cookies inside private message content.</p>`,
  );
}

function aupHtml() {
  return wrap(
    "Acceptable Use Policy",
    `<p>You may not use Haven to:</p>
<ul>
<li>Commit fraud, impersonate others, or evade law enforcement.</li>
<li>Send or receive spam, phishing, malware, or harassment.</li>
<li>Defeat third-party anti-abuse or create fake accounts at scale.</li>
<li>Attack the platform (scraping beyond the API, credential stuffing, exploiting bugs).</li>
</ul>
<p>We will suspend addresses, accounts, and IPs that violate this policy.</p>`,
  );
}

function abuseHtml() {
  return wrap(
    "Abuse Policy",
    `<p>If you received harmful mail through a Haven address, use Report on the message or write to the contact form with headers if you have them.</p>
<p>We review reports in the admin queue. We may purge content, ban senders, or share limited metadata with competent authorities when legally required.</p>`,
  );
}

function securityHtml() {
  return wrap(
    "Security",
    `<p>Inbound HTML is sanitized and rendered in a sandboxed frame. Attachments are allowlisted and optionally scanned. Sessions are httpOnly cookies. API keys are hashed. Payments are never trusted from the browser.</p>
<p>Report vulnerabilities via the contact form with the topic “Security”.</p>`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
