import { z } from "zod/v4";

export const parsedTransactionSchema = z.object({
  date: z.iso.date(),
  amount: z.number().int().positive(),
  description: z.string().min(1),
  type: z.enum(["income", "expense"]),
});

export const conversionResultSchema = z.object({
  source: z.string().min(1),
  transactions: z.array(parsedTransactionSchema),
  warnings: z.array(z.string()),
});
