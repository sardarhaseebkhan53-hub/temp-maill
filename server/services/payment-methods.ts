import { prisma } from "@/lib/db";
import { Errors } from "@/lib/errors";

export interface PaymentMethodRecord {
  id: string;
  key: string;
  kind: "MANUAL" | "STRIPE";
  name: string;
  displayName: string;
  description: string;
  instructions: string;
  accountNumber: string | null;
  accountTitle: string | null;
  merchantId: string | null;
  iban: string | null;
  bankName: string | null;
  qrImageUrl: string | null;
  currency: string;
  minAmountCents: number | null;
  maxAmountCents: number | null;
  planKeys: string[];
  sortOrder: number;
  status: string;
  enabled: boolean;
}

interface PaymentMethodRow {
  id: string;
  key: string;
  kind: string;
  name: string;
  displayName: string;
  description: string;
  instructions: string;
  accountNumber: string | null;
  accountTitle: string | null;
  merchantId: string | null;
  iban: string | null;
  bankName: string | null;
  qrImageUrl: string | null;
  currency: string;
  minAmountCents: number | null;
  maxAmountCents: number | null;
  planKeysJson: string;
  sortOrder: number;
  status: string;
  enabled: boolean;
}

function toRecord(row: PaymentMethodRow): PaymentMethodRecord {
  let planKeys: string[] = [];
  try {
    const parsed: unknown = JSON.parse(row.planKeysJson || "[]");
    if (Array.isArray(parsed)) planKeys = parsed.filter((v): v is string => typeof v === "string");
  } catch {
    planKeys = [];
  }
  return {
    id: row.id,
    key: row.key,
    kind: row.kind === "STRIPE" ? "STRIPE" : "MANUAL",
    name: row.name,
    displayName: row.displayName,
    description: row.description,
    instructions: row.instructions,
    accountNumber: row.accountNumber,
    accountTitle: row.accountTitle,
    merchantId: row.merchantId,
    iban: row.iban,
    bankName: row.bankName,
    qrImageUrl: row.qrImageUrl,
    currency: row.currency,
    minAmountCents: row.minAmountCents,
    maxAmountCents: row.maxAmountCents,
    planKeys,
    sortOrder: row.sortOrder,
    status: row.status,
    enabled: Boolean(row.enabled),
  };
}

/** Every method, including disabled ones — admin view. */
export async function listAllPaymentMethods(): Promise<PaymentMethodRecord[]> {
  const rows = (await prisma.paymentMethod.findMany({
    orderBy: { sortOrder: "asc" },
  })) as unknown as PaymentMethodRow[];
  return rows.map(toRecord);
}

/** Only methods a customer may actually pick, optionally filtered by plan. */
export async function listActivePaymentMethods(planKey?: string): Promise<PaymentMethodRecord[]> {
  const rows = (await prisma.paymentMethod.findMany({
    where: { enabled: true, status: "ACTIVE" },
    orderBy: { sortOrder: "asc" },
  })) as unknown as PaymentMethodRow[];

  return rows
    .map(toRecord)
    .filter((method) => !planKey || method.planKeys.length === 0 || method.planKeys.includes(planKey));
}

export async function getPaymentMethodByKey(key: string): Promise<PaymentMethodRecord | null> {
  const row = (await prisma.paymentMethod.findUnique({
    where: { key },
  })) as unknown as PaymentMethodRow | null;
  return row ? toRecord(row) : null;
}

/**
 * Validate a customer's manual submission against the operator's configuration.
 * The amount and plan eligibility are checked here, on the server, so a
 * tampered form cannot buy a plan a method is not allowed to sell.
 */
export async function assertMethodAccepts(opts: {
  methodKey: string;
  planKey: string;
  amountCents: number;
}): Promise<PaymentMethodRecord> {
  const method = await getPaymentMethodByKey(opts.methodKey);
  if (!method || !method.enabled || method.status !== "ACTIVE") {
    throw Errors.validation("That payment method is not available.");
  }
  if (method.planKeys.length > 0 && !method.planKeys.includes(opts.planKey)) {
    throw Errors.validation("That payment method cannot be used for the selected plan.");
  }
  if (method.minAmountCents != null && opts.amountCents < method.minAmountCents) {
    throw Errors.validation("The amount is below the minimum accepted for that method.");
  }
  if (method.maxAmountCents != null && opts.amountCents > method.maxAmountCents) {
    throw Errors.validation("The amount is above the maximum accepted for that method.");
  }
  return method;
}

export interface PaymentMethodInput {
  key: string;
  kind: "MANUAL" | "STRIPE";
  name: string;
  displayName: string;
  description?: string;
  instructions?: string;
  accountNumber?: string | null;
  accountTitle?: string | null;
  merchantId?: string | null;
  iban?: string | null;
  bankName?: string | null;
  qrImageUrl?: string | null;
  currency?: string;
  minAmountCents?: number | null;
  maxAmountCents?: number | null;
  planKeys?: string[];
  sortOrder?: number;
  status?: string;
  enabled?: boolean;
}

export async function upsertPaymentMethod(input: PaymentMethodInput) {
  const data = {
    kind: input.kind,
    name: input.name,
    displayName: input.displayName,
    description: input.description ?? "",
    instructions: input.instructions ?? "",
    accountNumber: input.accountNumber ?? null,
    accountTitle: input.accountTitle ?? null,
    merchantId: input.merchantId ?? null,
    iban: input.iban ?? null,
    bankName: input.bankName ?? null,
    qrImageUrl: input.qrImageUrl ?? null,
    currency: (input.currency ?? "USD").toUpperCase(),
    minAmountCents: input.minAmountCents ?? null,
    maxAmountCents: input.maxAmountCents ?? null,
    planKeysJson: JSON.stringify(input.planKeys ?? []),
    sortOrder: input.sortOrder ?? 0,
    status: input.status ?? "ACTIVE",
    enabled: input.enabled ?? false,
  };

  return prisma.paymentMethod.upsert({
    where: { key: input.key },
    update: data,
    create: { key: input.key, ...data },
  });
}

export async function setPaymentMethodEnabled(key: string, enabled: boolean) {
  return prisma.paymentMethod.update({ where: { key }, data: { enabled } });
}
