import { InboxGenerator } from "@/components/features/generator";
import { getOrCreateGuestMailbox, listDomainsForViewer } from "@/server/services/guest-mailbox";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Inbox — Haven",
  description: "Your current temporary inbox.",
  path: "/inbox",
  noindex: true,
});

export default async function InboxPage() {
  const [mailbox, domains] = await Promise.all([getOrCreateGuestMailbox(), listDomainsForViewer()]);
  return (
    <div className="container py-8">
      <h1 className="font-display text-2xl font-semibold mb-6">Inbox</h1>
      <InboxGenerator
        initialMailbox={mailbox}
        domains={domains.map((d) => ({ id: d.id, domain: d.domain, eligibility: d.eligibility }))}
      />
    </div>
  );
}
