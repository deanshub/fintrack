import { NextResponse } from "next/server";
import { autoCategorize } from "@/lib/categorize";
import { readJsonFile, writeJsonFile } from "@/lib/data";
import type { Category, Transaction } from "@/lib/types";

export async function POST() {
  const transactions = await readJsonFile<Transaction[]>("transactions.json");
  const categories = await readJsonFile<Category[]>("categories.json");

  const updated = autoCategorize(transactions, categories);
  await writeJsonFile("transactions.json", updated);

  const changed = updated.filter((tx, i) => tx.categoryId !== transactions[i].categoryId).length;

  return NextResponse.json({ updated: changed });
}
