import { createHash } from "node:crypto";

export function computeTransactionId(
  date: string,
  amount: number,
  description: string,
  source: string,
): string {
  const input = `${date}|${amount}|${description.trim().toLowerCase()}|${source}`;
  return createHash("sha256").update(input).digest("hex").slice(0, 16);
}
