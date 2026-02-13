import { rm } from "node:fs/promises";
import { join } from "node:path";
import { NextResponse } from "next/server";
import { writeJsonFile, writeTransactions } from "@/lib/data";
import { generateMockData } from "@/lib/seed";

export async function POST() {
  const { transactionsByMonth, categories, budgets } = generateMockData();

  // Remove old single-file transactions if it exists
  try {
    await rm(join(process.cwd(), "data", "transactions.json"));
  } catch {
    // ignore if doesn't exist
  }

  let totalTransactions = 0;
  for (const [month, txs] of transactionsByMonth) {
    await writeTransactions(month, txs);
    totalTransactions += txs.length;
  }

  await writeJsonFile("categories.json", categories);
  await writeJsonFile("budgets.json", budgets);

  return NextResponse.json({
    seeded: {
      transactions: totalTransactions,
      months: transactionsByMonth.size,
      categories: categories.length,
      budgets: budgets.length,
    },
  });
}
