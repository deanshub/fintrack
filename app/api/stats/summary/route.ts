import { type NextRequest, NextResponse } from "next/server";
import { readTransactions } from "@/lib/data";
import { IGNORE_CATEGORY_ID } from "@/lib/types";

export async function GET(request: NextRequest) {
  const month = request.nextUrl.searchParams.get("month");
  if (!month) {
    return NextResponse.json({ error: "month parameter required" }, { status: 400 });
  }

  const transactions = await readTransactions(month);

  let income = 0;
  let expenses = 0;
  const byCategory: Record<string, number> = {};

  for (const tx of transactions) {
    if (tx.categoryId === IGNORE_CATEGORY_ID) continue;
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
