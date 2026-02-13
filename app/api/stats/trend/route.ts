import { type NextRequest, NextResponse } from "next/server";
import { listTransactionMonths, readTransactions } from "@/lib/data";
import { IGNORE_CATEGORY_ID } from "@/lib/types";

export async function GET(request: NextRequest) {
  const monthsParam = request.nextUrl.searchParams.get("months") ?? "6";
  const count = Math.min(Number.parseInt(monthsParam, 10), 24);

  const allMonths = await listTransactionMonths();
  const months = allMonths.slice(-count);

  const trend = await Promise.all(
    months.map(async (month) => {
      const transactions = await readTransactions(month);
      let income = 0;
      let expenses = 0;
      for (const tx of transactions) {
        if (tx.categoryId === IGNORE_CATEGORY_ID) continue;
        if (tx.type === "income") income += tx.amount;
        else expenses += tx.amount;
      }
      return { month, income, expenses };
    }),
  );

  return NextResponse.json(trend);
}
