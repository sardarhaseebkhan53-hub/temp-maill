import { POST as inbound } from "@/app/api/v1/inbound/[provider]/route";

/**
 * Spec-canonical webhook URL (equivalent to /api/v1/inbound/postmark):
 * the shared handler verifies the provider signature, then parses,
 * de-duplicates, sanitizes and stores the message.
 */
export async function POST(req: Request) {
  return inbound(req, { params: Promise.resolve({ provider: "postmark" }) });
}
