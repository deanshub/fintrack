import { type NextRequest, NextResponse } from "next/server";
import { readJsonFile, writeJsonFile } from "@/lib/data";
import type { Transaction } from "@/lib/types";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json();
  const transactions = await readJsonFile<Transaction[]>("transactions.json");

  const index = transactions.findIndex((t) => t.id === id);
  if (index === -1) {
    return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
  }

  if (body.categoryId !== undefined) {
    transactions[index].categoryId = body.categoryId;
    transactions[index].categoryManual = true;
  }

  await writeJsonFile("transactions.json", transactions);
  return NextResponse.json(transactions[index]);
}
