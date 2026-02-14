import { rm } from "node:fs/promises";
import { join } from "node:path";
import { NextResponse } from "next/server";
import { listTransactionMonths, readJsonFile, readTransactions, writeJsonFile } from "@/lib/data";

export async function DELETE() {
  const months = await listTransactionMonths();

  let transactionCount = 0;
  for (const month of months) {
    const txs = await readTransactions(month);
    transactionCount += txs.length;
  }

  const categories = await readJsonFile<unknown[]>("categories.json");
  const budgets = await readJsonFile<unknown[]>("budgets.json");

  // Remove all transaction month files
  const txDir = join(process.cwd(), "data", "transactions");
  for (const month of months) {
    try {
      await rm(join(txDir, `${month}.json`));
    } catch {
      // ignore if already removed
    }
  }

  await writeJsonFile("categories.json", []);
  await writeJsonFile("budgets.json", []);

  return NextResponse.json({
    cleared: {
      transactions: transactionCount,
      categories: categories.length,
      budgets: budgets.length,
    },
  });
}
