import { getEnv, allowMockProviders } from "@/config/env";
import type { InboundEmailProvider } from "@/server/providers/email/types";
import { MockInboundEmailProvider } from "@/server/providers/email/mock";
import { MailgunInboundProvider } from "@/server/providers/email/mailgun";
import { PostmarkInboundProvider } from "@/server/providers/email/postmark";
import { SmtpInboundProvider } from "@/server/providers/email/smtp";

const registry: Record<string, InboundEmailProvider> = {
  mock: new MockInboundEmailProvider(),
  mailgun: new MailgunInboundProvider(),
  postmark: new PostmarkInboundProvider(),
  smtp: new SmtpInboundProvider(),
};

export function getInboundProvider(key?: string): InboundEmailProvider {
  const env = getEnv();
  const requested = (key || env.EMAIL_INBOUND_PROVIDER).toLowerCase();
  if (requested === "mock" && !allowMockProviders()) {
    return registry.smtp!;
  }
  return registry[requested] ?? registry.mock!;
}

export function listInboundProviders(): InboundEmailProvider[] {
  return Object.values(registry).filter((p) => p.key !== "mock" || allowMockProviders());
}

export type { InboundEmail, InboundEmailProvider } from "@/server/providers/email/types";
