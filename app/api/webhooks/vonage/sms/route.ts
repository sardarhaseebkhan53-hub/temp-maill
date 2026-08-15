import { POST as inbound } from "@/app/api/v1/sms/inbound/[provider]/route";

/**
 * Spec-canonical webhook URL (equivalent to /api/v1/sms/inbound/vonage):
 * the shared handler verifies the provider signature, normalises the event,
 * de-duplicates it, and stores the SMS against the assigned number.
 */
export async function POST(req: Request) {
  return inbound(req, { params: Promise.resolve({ provider: "vonage" }) });
}
