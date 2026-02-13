import { type NextRequest, NextResponse } from "next/server";
import { autoCategorize } from "@/lib/categorize";
import { readAllTransactions, readJsonFile, readTransactions, writeTransactions } from "@/lib/data";
import { computeTransactionId } from "@/lib/hash";
import type { Category, Transaction } from "@/lib/types";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const month = searchParams.get("month");
  const category = searchParams.get("category");

  let transactions: Transaction[];

  if (month) {
    transactions = await readTransactions(month);
  } else {
    transactions = await readAllTransactions();
  }

  if (category) {
    const cats = category.split(",");
    transactions = transactions.filter((t) => cats.includes(t.categoryId ?? ""));
  }

  transactions.sort((a, b) => b.date.localeCompare(a.date));

  return NextResponse.json(transactions);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const incoming: Omit<Transaction, "id" | "categoryId" | "categoryManual">[] = Array.isArray(body)
    ? body
    : [body];

  const categories = await readJsonFile<Category[]>("categories.json");

  const byMonth = new Map<string, Transaction[]>();

  for (const tx of incoming) {
    const month = tx.date.slice(0, 7);
    if (!byMonth.has(month)) {
      byMonth.set(month, await readTransactions(month));
    }
  }

  let added = 0;
  let skipped = 0;

  for (const tx of incoming) {
    const month = tx.date.slice(0, 7);
    const existing = byMonth.get(month);
    if (!existing) continue;
    const existingIds = new Set(existing.map((t) => t.id));
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
    added++;
  }

  for (const [month, txs] of byMonth) {
    txs.sort((a, b) => b.date.localeCompare(a.date));
    await writeTransactions(month, txs);
  }

  return NextResponse.json({ added, skipped });
}
