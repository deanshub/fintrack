import { type NextRequest, NextResponse } from "next/server";
import { listTransactionMonths, readTransactions, writeTransactions } from "@/lib/data";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json();

  const months = await listTransactionMonths();

  for (const month of months) {
    const transactions = await readTransactions(month);
    const index = transactions.findIndex((t) => t.id === id);

    if (index !== -1) {
      if (body.categoryId !== undefined) {
        transactions[index].categoryId = body.categoryId;
        transactions[index].categoryManual = true;
      }

      if (body.note !== undefined) {
        transactions[index].note = body.note || undefined;
      }

      await writeTransactions(month, transactions);
      return NextResponse.json(transactions[index]);
    }
  }

  return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
}
