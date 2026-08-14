import { describe, expect, it, beforeAll } from "vitest";
import { prisma } from "@/lib/db";
import { authenticate, createSession, getCurrentUser, registerUser, destroySession } from "@/lib/auth";
import { AppError } from "@/lib/errors";

const password = "Sufficiently-Long-Password-1";

async function uniqueEmail(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.test`;
}

describe("authentication", () => {
  beforeAll(async () => {
    if (!(await prisma.role.findUnique({ where: { key: "USER" } }))) {
      await prisma.role.create({ data: { key: "USER", name: "User" } });
    }
  });

  it("creates a session row on login", async () => {
    // Regression: Session.lastSeenAt is NOT NULL without a default, and the
    // ORM used to omit it, so every login failed with a constraint error.
    const email = await uniqueEmail("session");
    const user = await registerUser({ email, password });

    const { session, jwt } = await createSession(user.id, { ip: "127.0.0.1" });

    expect(jwt).toBeTypeOf("string");
    expect(session.id).toBeTruthy();
    expect(session.lastSeenAt).toBeInstanceOf(Date);
    expect(Number.isNaN(new Date(session.lastSeenAt).getTime())).toBe(false);

    await destroySession(session.id);
  });

  it("authenticates a correct password", async () => {
    const email = await uniqueEmail("valid");
    await registerUser({ email, password });

    const user = await authenticate(email, password);
    expect(user.email).toBe(email);
  });

  it("rejects a wrong password without revealing whether the account exists", async () => {
    const email = await uniqueEmail("wrong");
    await registerUser({ email, password });

    const wrongPassword = authenticate(email, "not-the-password").catch((e: unknown) => e);
    const noSuchUser = authenticate(await uniqueEmail("missing"), password).catch(
      (e: unknown) => e,
    );

    const a = (await wrongPassword) as AppError;
    const b = (await noSuchUser) as AppError;

    expect(a).toBeInstanceOf(AppError);
    expect(b).toBeInstanceOf(AppError);
    expect(a.code).toBe("INVALID_CREDENTIALS");
    expect(b.code).toBe(a.code);
    expect(b.message).toBe(a.message);
    expect(a.status).toBe(401);
  });

  it("refuses a banned account with a distinct error", async () => {
    const email = await uniqueEmail("banned");
    const user = await registerUser({ email, password });
    await prisma.user.update({ where: { id: user.id }, data: { status: "BANNED" } });

    const err = (await authenticate(email, password).catch((e: unknown) => e)) as AppError;
    expect(err).toBeInstanceOf(AppError);
    expect(err.code).toBe("ACCOUNT_BANNED");
    expect(err.status).toBe(403);
  });

  it("never stores the password in plaintext", async () => {
    const email = await uniqueEmail("hash");
    const user = await registerUser({ email, password });

    const row = await prisma.user.findUnique({ where: { id: user.id } });
    expect(row?.passwordHash).toBeTruthy();
    expect(row?.passwordHash).not.toContain(password);
    expect(String(row?.passwordHash)).toMatch(/^argon2id\$/);
  });

  it("returns no user for an anonymous request", async () => {
    // No cookie is set in the test context.
    expect(await getCurrentUser().catch(() => null)).toBeNull();
  });

  it("revokes a session on logout", async () => {
    const email = await uniqueEmail("logout");
    const user = await registerUser({ email, password });
    const { session } = await createSession(user.id);

    await destroySession(session.id);

    const row = await prisma.session.findUnique({ where: { id: session.id } });
    expect(row?.revokedAt).toBeTruthy();
  });
});
