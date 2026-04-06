import { NextResponse } from "next/server";
import { readJsonFile, writeJsonFile } from "@/lib/data";
import type { FinanceItem } from "@/lib/types";

const FILE = "calculator.json";

export async function GET() {
  const items = await readJsonFile<FinanceItem[]>(FILE);
  return NextResponse.json(items);
}

export async function POST(req: Request) {
  const body = await req.json();
  const items = await readJsonFile<FinanceItem[]>(FILE);

  const item: FinanceItem = {
    id: crypto.randomUUID(),
    label: body.label,
    amount: body.amount,
    type: body.type,
    ...(body.date ? { date: body.date } : {}),
  };

  items.push(item);
  await writeJsonFile(FILE, items);
  return NextResponse.json(item, { status: 201 });
}

export async function PUT(req: Request) {
  const body: FinanceItem = await req.json();
  const items = await readJsonFile<FinanceItem[]>(FILE);

  const idx = items.findIndex((i) => i.id === body.id);
  if (idx === -1) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  items[idx] = body;
  await writeJsonFile(FILE, items);
  return NextResponse.json(body);
}

export async function DELETE(req: Request) {
  const { id } = await req.json();
  const items = await readJsonFile<FinanceItem[]>(FILE);

  const filtered = items.filter((i) => i.id !== id);
  if (filtered.length === items.length) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await writeJsonFile(FILE, filtered);
  return NextResponse.json({ ok: true });
}
