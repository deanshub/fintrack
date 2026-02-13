import { type NextRequest, NextResponse } from "next/server";
import { readJsonFile } from "@/lib/data";
import type { Transaction } from "@/lib/types";

export async function GET(request: NextRequest) {
  const month = request.nextUrl.searchParams.get("month");
  if (!month) {
    return NextResponse.json({ error: "month parameter required" }, { status: 400 });
  }

  const transactions = await readJsonFile<Transaction[]>("transactions.json");
  const filtered = transactions.filter((t) => t.date.startsWith(month));

  let income = 0;
  let expenses = 0;
  const byCategory: Record<string, number> = {};

  for (const tx of filtered) {
    if (tx.type === "income") {
      income += tx.amount;
    } else {
      expenses += tx.amount;
      const key = tx.categoryId ?? "uncategorized";
      byCategory[key] = (byCategory[key] || 0) + tx.amount;
    }
  }

  return NextResponse.json({
    income,
    expenses,
    net: income - expenses,
    byCategory,
  });
}
