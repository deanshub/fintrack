import { type NextRequest, NextResponse } from "next/server";
import { autoCategorize } from "@/lib/categorize";
import { readJsonFile, writeJsonFile } from "@/lib/data";
import { computeTransactionId } from "@/lib/hash";
import type { Category, Transaction } from "@/lib/types";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const month = searchParams.get("month");
  const category = searchParams.get("category");

  let transactions = await readJsonFile<Transaction[]>("transactions.json");

  if (month) {
    transactions = transactions.filter((t) => t.date.startsWith(month));
  }
  if (category) {
    transactions = transactions.filter((t) => t.categoryId === category);
  }

  transactions.sort((a, b) => b.date.localeCompare(a.date));

  return NextResponse.json(transactions);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const incoming: Omit<Transaction, "id" | "categoryId" | "categoryManual">[] = Array.isArray(body)
    ? body
    : [body];

  const existing = await readJsonFile<Transaction[]>("transactions.json");
  const existingIds = new Set(existing.map((t) => t.id));
  const categories = await readJsonFile<Category[]>("categories.json");

  let added = 0;
  let skipped = 0;

  for (const tx of incoming) {
    const id = computeTransactionId(tx.date, tx.amount, tx.description, tx.source);
    if (existingIds.has(id)) {
      skipped++;
      continue;
    }

    const newTx: Transaction = {
      ...tx,
      id,
      categoryId: null,
      categoryManual: false,
    };

    const [categorized] = autoCategorize([newTx], categories);
    existing.push(categorized);
    existingIds.add(id);
    added++;
  }

  existing.sort((a, b) => b.date.localeCompare(a.date));
  await writeJsonFile("transactions.json", existing);

  return NextResponse.json({ added, skipped });
}
