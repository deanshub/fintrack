import { type NextRequest, NextResponse } from "next/server";
import { readJsonFile } from "@/lib/data";
import type { Transaction } from "@/lib/types";

export async function GET(request: NextRequest) {
  const monthsParam = request.nextUrl.searchParams.get("months") ?? "6";
  const count = Math.min(Number.parseInt(monthsParam, 10), 24);

  const transactions = await readJsonFile<Transaction[]>("transactions.json");

  const monthSet = new Set<string>();
  for (const tx of transactions) {
    monthSet.add(tx.date.slice(0, 7));
  }

  const months = Array.from(monthSet).sort().slice(-count);

  const trend = months.map((month) => {
    const filtered = transactions.filter((t) => t.date.startsWith(month));
    let income = 0;
    let expenses = 0;
    for (const tx of filtered) {
      if (tx.type === "income") income += tx.amount;
      else expenses += tx.amount;
    }
    return { month, income, expenses };
  });

  return NextResponse.json(trend);
}
