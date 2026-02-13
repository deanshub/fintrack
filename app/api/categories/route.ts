import { type NextRequest, NextResponse } from "next/server";
import { readJsonFile, writeJsonFile } from "@/lib/data";
import type { Category } from "@/lib/types";

export async function GET() {
  const categories = await readJsonFile<Category[]>("categories.json");
  return NextResponse.json(categories);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const categories = await readJsonFile<Category[]>("categories.json");

  const newCategory: Category = {
    id: body.id,
    name: body.name,
    icon: body.icon,
    color: body.color,
    rules: body.rules || [],
  };

  if (categories.some((c) => c.id === newCategory.id)) {
    return NextResponse.json({ error: "Category already exists" }, { status: 409 });
  }

  categories.push(newCategory);
  await writeJsonFile("categories.json", categories);

  return NextResponse.json(newCategory, { status: 201 });
}
