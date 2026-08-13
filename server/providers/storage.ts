import { mkdir, writeFile, readFile, unlink } from "node:fs/promises";
import path from "node:path";
import { getEnv } from "@/config/env";
import { sha256Hex } from "@/lib/crypto";

export interface StorageDriver {
  put(key: string, bytes: Buffer, mime: string): Promise<void>;
  get(key: string): Promise<Buffer>;
  delete(key: string): Promise<void>;
}

class LocalStorage implements StorageDriver {
  private root() {
    return path.join(process.cwd(), "database", "data", "attachments");
  }

  private full(key: string) {
    const safe = key.replace(/[^a-zA-Z0-9._/-]/g, "_");
    return path.join(this.root(), safe);
  }

  async put(key: string, bytes: Buffer): Promise<void> {
    const dest = this.full(key);
    await mkdir(path.dirname(dest), { recursive: true });
    await writeFile(dest, bytes);
  }

  async get(key: string): Promise<Buffer> {
    return readFile(this.full(key));
  }

  async delete(key: string): Promise<void> {
    await unlink(this.full(key)).catch(() => undefined);
  }
}

class S3Storage implements StorageDriver {
  async put(): Promise<void> {
    throw new Error("S3 storage is not configured. Set STORAGE_DRIVER=s3 and S3_* env vars.");
  }
  async get(): Promise<Buffer> {
    throw new Error("S3 storage is not configured.");
  }
  async delete(): Promise<void> {
    throw new Error("S3 storage is not configured.");
  }
}

let cached: StorageDriver | null = null;

export function getStorage(): StorageDriver {
  if (cached) return cached;
  const env = getEnv();
  cached = env.STORAGE_DRIVER === "s3" && env.S3_BUCKET ? new S3Storage() : new LocalStorage();
  return cached;
}

export function attachmentKey(mailboxId: string, checksum: string, filename: string): string {
  const safe = filename.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 80);
  return `${mailboxId}/${checksum.slice(0, 16)}-${safe}`;
}

export function checksumBuffer(buf: Buffer): string {
  return sha256Hex(buf.toString("binary"));
}
