import { getEnv } from "@/config/env";

export interface AttachmentScanner {
  readonly key: string;
  scan(bytes: Buffer, filename: string, mime: string): Promise<{ status: "CLEAN" | "INFECTED" | "SKIPPED" | "FAILED"; result?: string }>;
}

class NoneScanner implements AttachmentScanner {
  readonly key = "none";
  async scan() {
    return { status: "SKIPPED" as const, result: "no scanner configured" };
  }
}

class ClamAvScanner implements AttachmentScanner {
  readonly key = "clamav";
  async scan(bytes: Buffer, _filename: string) {
    const env = getEnv();
    if (!env.CLAMAV_HOST) return { status: "SKIPPED" as const, result: "CLAMAV_HOST unset" };
    try {
      const net = await import("node:net");
      const result = await new Promise<string>((resolve, reject) => {
        const socket = net.createConnection({ host: env.CLAMAV_HOST, port: env.CLAMAV_PORT }, () => {
          socket.write("zINSTREAM\0");
          const size = Buffer.alloc(4);
          size.writeUInt32BE(bytes.length, 0);
          socket.write(size);
          socket.write(bytes);
          const zero = Buffer.alloc(4);
          socket.write(zero);
        });
        let data = "";
        socket.on("data", (c) => (data += c.toString()));
        socket.on("end", () => resolve(data));
        socket.on("error", reject);
        socket.setTimeout(8000, () => {
          socket.destroy();
          reject(new Error("clamav timeout"));
        });
      });
      if (/FOUND/.test(result)) return { status: "INFECTED" as const, result };
      return { status: "CLEAN" as const, result };
    } catch (err) {
      return { status: "FAILED" as const, result: err instanceof Error ? err.message : "scan failed" };
    }
  }
}

export function getScanner(): AttachmentScanner {
  const env = getEnv();
  if (env.ATTACHMENT_SCANNER === "clamav") return new ClamAvScanner();
  return new NoneScanner();
}
