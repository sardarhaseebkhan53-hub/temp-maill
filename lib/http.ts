import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { AppError, toErrorEnvelope } from "@/lib/errors";
import { log } from "@/lib/logger";
import { ZodError } from "zod";

export function correlationId(req?: Request): string {
  const existing = req?.headers.get("x-correlation-id");
  if (existing && existing.length <= 64) return existing;
  return randomBytes(8).toString("hex");
}

export function ok<T>(data: T, init?: { status?: number; headers?: HeadersInit; correlationId?: string }) {
  return NextResponse.json(
    { success: true, data, correlationId: init?.correlationId },
    { status: init?.status ?? 200, headers: init?.headers },
  );
}

export function fail(err: unknown, req?: Request) {
  const cid = correlationId(req);
  if (err instanceof ZodError) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: err.issues[0]?.message || "Invalid request.",
          details: err.issues.map((i) => ({ path: i.path.join("."), message: i.message })),
        },
        correlationId: cid,
      },
      { status: 422 },
    );
  }
  if (err instanceof Error && (err as Error & { code?: string }).code === "VALIDATION_ERROR") {
    return NextResponse.json(
      {
        success: false,
        error: { code: "VALIDATION_ERROR", message: err.message },
        correlationId: cid,
      },
      { status: 422 },
    );
  }
  if (!(err instanceof AppError) || err.status >= 500) {
    log.error("request_failed", {
      correlationId: cid,
      err: err instanceof Error ? err.message : String(err),
    });
  }
  const env = toErrorEnvelope(err, cid);
  return NextResponse.json(env.body, { status: env.status });
}

export async function readJson<T = unknown>(req: Request): Promise<T> {
  try {
    return (await req.json()) as T;
  } catch {
    throw new AppError("INVALID_JSON", "Request body must be valid JSON.", 400);
  }
}

export function noStore(res: NextResponse) {
  res.headers.set("Cache-Control", "no-store");
  return res;
}
