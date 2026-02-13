import { NextResponse } from "next/server";
import { writeJsonFile } from "@/lib/data";
import { generateMockData } from "@/lib/seed";

export async function POST() {
  const { transactions, categories, budgets } = generateMockData();

  await writeJsonFile("transactions.json", transactions);
  await writeJsonFile("categories.json", categories);
  await writeJsonFile("budgets.json", budgets);

  return NextResponse.json({
    seeded: {
      transactions: transactions.length,
      categories: categories.length,
      budgets: budgets.length,
    },
  });
}
