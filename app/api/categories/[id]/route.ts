import { type NextRequest, NextResponse } from "next/server";
import { readJsonFile, writeJsonFile } from "@/lib/data";
import type { Category, Transaction } from "@/lib/types";

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

  const transactions = await readJsonFile<Transaction[]>("transactions.json");
  const updated = transactions.map((t) =>
    t.categoryId === id ? { ...t, categoryId: null, categoryManual: false } : t,
  );
  await writeJsonFile("transactions.json", updated);

  return NextResponse.json({ deleted: id });
}
