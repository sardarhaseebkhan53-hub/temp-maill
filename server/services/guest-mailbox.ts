import { getGuest } from "@/lib/guest";
import { createMailbox, getMailboxById, refreshMailboxState, toPublicMailbox } from "@/server/services/mailbox";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import type { PublicMailbox } from "@/types";

export async function getOrCreateGuestMailbox(): Promise<PublicMailbox> {
  const user = (await getCurrentUser().catch(() => null))?.user ?? null;
  const guest = await getGuest();
  if (guest.boxes[0]) {
    try {
      const existing = await getMailboxById(guest.boxes[0]);
      if (existing.state === "ACTIVE" || existing.state === "EXPIRING_SOON") {
        return toPublicMailbox(existing);
      }
    } catch {
      /* create new */
    }
  }
  if (user) {
    const latest = await prisma.temporaryMailbox.findFirst({
      where: { userId: user.id, state: { in: ["ACTIVE", "EXPIRING_SOON"] } },
      include: { domain: true },
      orderBy: { createdAt: "desc" },
    });
    if (latest) return toPublicMailbox(await refreshMailboxState(latest));
  }
  const created = await createMailbox({ user, guestKey: guest.gid });
  return toPublicMailbox(created.mailbox);
}

export async function listDomainsForViewer() {
  const user = (await getCurrentUser().catch(() => null))?.user ?? null;
  const plan = user?.planKey ?? "FREE";
  const { listAssignableDomains } = await import("@/server/services/mailbox");
  return listAssignableDomains(plan);
}
