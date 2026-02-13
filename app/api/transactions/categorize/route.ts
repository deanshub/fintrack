import { NextResponse } from "next/server";
import { autoCategorize } from "@/lib/categorize";
import {
  listTransactionMonths,
  readJsonFile,
  readTransactions,
  writeTransactions,
} from "@/lib/data";
import type { Category } from "@/lib/types";

export async function POST() {
  const categories = await readJsonFile<Category[]>("categories.json");
  const months = await listTransactionMonths();

  let changed = 0;

  for (const month of months) {
    const transactions = await readTransactions(month);
    const updated = autoCategorize(transactions, categories);

    const monthChanged = updated.filter(
      (tx, i) => tx.categoryId !== transactions[i].categoryId,
    ).length;

    if (monthChanged > 0) {
      await writeTransactions(month, updated);
      changed += monthChanged;
    }
  }

  return NextResponse.json({ updated: changed });
}
