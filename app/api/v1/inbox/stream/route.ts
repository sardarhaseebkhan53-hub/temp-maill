import { cache, mailboxChannel } from "@/lib/redis";
import { canAccessMailbox, getMailboxById } from "@/server/services/mailbox";
import { requestContext } from "@/server/api/context";
import { Errors } from "@/lib/errors";
import { prisma } from "@/lib/db";
import { toPublicMessage } from "@/server/services/messages";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const mailboxId = url.searchParams.get("mailboxId") || "";
  const token = url.searchParams.get("token") || "";
  try {
    const box = await getMailboxById(mailboxId);
    const auth = await requestContext(req);
    if (!(await canAccessMailbox(box, { userId: auth.user?.id, guestBoxes: auth.guest.boxes, token }))) {
      throw Errors.forbidden();
    }
  } catch {
    return new Response("forbidden", { status: 403 });
  }

  const encoder = new TextEncoder();
  let unsub: (() => void) | null = null;
  const stream = new ReadableStream({
    start(controller) {
      const send = (data: string) => {
        try {
          controller.enqueue(encoder.encode(`data: ${data}\n\n`));
        } catch {
          /* closed */
        }
      };
      send(JSON.stringify({ type: "hello" }));
      unsub = cache.subscribe(mailboxChannel(mailboxId), async (msg) => {
        try {
          const parsed = JSON.parse(msg) as { messageId?: string; type?: string };
          if (parsed.messageId) {
            const row = await prisma.emailMessage.findUnique({ where: { id: parsed.messageId } });
            if (row) send(JSON.stringify({ type: "message.received", message: toPublicMessage(row) }));
            else send(msg);
          } else send(msg);
        } catch {
          send(msg);
        }
      });
      const beat = setInterval(() => send(JSON.stringify({ type: "heartbeat", t: Date.now() })), 15000);
      const close = () => {
        clearInterval(beat);
        unsub?.();
        try {
          controller.close();
        } catch {
          /* ignore */
        }
      };
      req.signal.addEventListener("abort", close);
    },
    cancel() {
      unsub?.();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
