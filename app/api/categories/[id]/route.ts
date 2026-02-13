import { type NextRequest, NextResponse } from "next/server";
import {
  listTransactionMonths,
  readJsonFile,
  readTransactions,
  writeJsonFile,
  writeTransactions,
} from "@/lib/data";
import type { Category } from "@/lib/types";

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json();
  const categories = await readJsonFile<Category[]>("categories.json");

  const index = categories.findIndex((c) => c.id === id);
  if (index === -1) {
    return NextResponse.json({ error: "Category not found" }, { status: 404 });
  }

  categories[index] = {
    ...categories[index],
    name: body.name ?? categories[index].name,
    icon: body.icon ?? categories[index].icon,
    color: body.color ?? categories[index].color,
    rules: body.rules ?? categories[index].rules,
  };

  await writeJsonFile("categories.json", categories);
  return NextResponse.json(categories[index]);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const categories = await readJsonFile<Category[]>("categories.json");

  const index = categories.findIndex((c) => c.id === id);
  if (index === -1) {
    return NextResponse.json({ error: "Category not found" }, { status: 404 });
  }

  categories.splice(index, 1);
  await writeJsonFile("categories.json", categories);

  const months = await listTransactionMonths();
  for (const month of months) {
    const transactions = await readTransactions(month);
    let modified = false;
    const updated = transactions.map((t) => {
      if (t.categoryId === id) {
        modified = true;
        return { ...t, categoryId: null, categoryManual: false };
      }
      return t;
    });
    if (modified) {
      await writeTransactions(month, updated);
    }
  }

  return NextResponse.json({ deleted: id });
}
