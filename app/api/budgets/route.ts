import { type NextRequest, NextResponse } from "next/server";
import { readJsonFile, writeJsonFile } from "@/lib/data";
import type { Budget } from "@/lib/types";

export async function GET(request: NextRequest) {
  const month = request.nextUrl.searchParams.get("month");
  const budgets = await readJsonFile<Budget[]>("budgets.json");

  if (month) {
    const budget = budgets.find((b) => b.month === month);
    return NextResponse.json(budget ?? null);
  }

  return NextResponse.json(budgets);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const budgets = await readJsonFile<Budget[]>("budgets.json");

  const index = budgets.findIndex((b) => b.month === body.month);
  const budget: Budget = {
    month: body.month,
    globalLimit: body.globalLimit ?? null,
    categoryLimits: body.categoryLimits ?? {},
  };

  if (index === -1) {
    budgets.push(budget);
  } else {
    budgets[index] = budget;
  }

  budgets.sort((a, b) => b.month.localeCompare(a.month));
  await writeJsonFile("budgets.json", budgets);

  return NextResponse.json(budget);
}
