import { ok, fail, readJson } from "@/lib/http";

const COMMON = new Set([
  "password",
  "123456",
  "qwerty",
  "letmein",
  "admin",
  "welcome",
  "iloveyou",
  "abc123",
  "monkey",
  "dragon",
]);

export async function POST(req: Request) {
  try {
    const body = await readJson<{ username?: string; password?: string }>(req);
    const issues: string[] = [];
    const user = (body.username || "").toLowerCase();
    const pass = body.password || "";
    if (user && COMMON.has(user)) issues.push("That username is extremely common.");
    if (pass && COMMON.has(pass.toLowerCase())) issues.push("That password appears on every starter wordlist.");
    if (pass && pass.length < 10) issues.push("Short passwords are guessed first.");
    if (pass && user && pass.toLowerCase().includes(user)) issues.push("The password contains the username.");
    const summary =
      issues.length === 0
        ? "Nothing obvious in this local check. That is not a guarantee — use a password manager and unique passwords."
        : issues.join(" ");
    return ok({ summary, issues });
  } catch (e) {
    return fail(e, req);
  }
}
