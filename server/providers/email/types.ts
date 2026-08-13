export interface InboundAttachment {
  filename: string;
  mimeType: string;
  content: Buffer;
}

export interface InboundEmail {
  provider: string;
  providerMessageId?: string;
  idempotencyKey: string;
  fromAddress: string;
  fromName?: string;
  toAddresses: string[];
  subject: string;
  textBody: string;
  htmlBody: string;
  headers: Record<string, string>;
  attachments: InboundAttachment[];
  receivedAt: Date;
  rawSize: number;
}

export interface InboundEmailProvider {
  readonly key: string;
  verify(req: Request, rawBody: string): Promise<boolean>;
  parse(req: Request, rawBody: string): Promise<InboundEmail[]>;
  health(): Promise<{ ok: boolean; detail?: string }>;
}
