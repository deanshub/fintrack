import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { type NextRequest, NextResponse } from "next/server";
import { autoCategorize } from "@/lib/categorize";
import { detectConverter } from "@/lib/converters/registry";
import { conversionResultSchema } from "@/lib/converters/schemas";
import { readJsonFile, readTransactions, writeTransactions } from "@/lib/data";
import { computeTransactionId } from "@/lib/hash";
import type { Category, Transaction } from "@/lib/types";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const ORIGINALS_DIR = join(process.cwd(), "data", "original");

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const file = formData.get("file");

  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  if (!file.name.endsWith(".pdf")) {
    return NextResponse.json({ error: "Only PDF files are supported" }, { status: 400 });
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: "File too large (max 10 MB)" }, { status: 400 });
  }

  // Detect converter from filename
  const converter = detectConverter(file.name);
  if (!converter) {
    return NextResponse.json({ error: `Unrecognized file format: ${file.name}` }, { status: 400 });
  }

  // Read file buffer
  const buffer = Buffer.from(await file.arrayBuffer());

  // Save original
  await mkdir(ORIGINALS_DIR, { recursive: true });
  await writeFile(join(ORIGINALS_DIR, file.name), buffer);

  // Parse PDF
  let result: Awaited<ReturnType<typeof converter.parse>>;
  try {
    result = await converter.parse(buffer, file.name);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown parse error";
    return NextResponse.json({ error: `Failed to parse PDF: ${message}` }, { status: 500 });
  }

  // Validate conversion result
  const validation = conversionResultSchema.safeParse(result);
  if (!validation.success) {
    return NextResponse.json(
      { error: "Invalid conversion result", details: validation.error.issues },
      { status: 500 },
    );
  }

  // Ingest transactions (same logic as POST /api/transactions)
  const categories = await readJsonFile<Category[]>("categories.json");
  const byMonth = new Map<string, Transaction[]>();

  for (const tx of result.transactions) {
    const month = tx.date.slice(0, 7);
    if (!byMonth.has(month)) {
      byMonth.set(month, await readTransactions(month));
    }
  }

  let added = 0;
  let skipped = 0;

  for (const tx of result.transactions) {
    const month = tx.date.slice(0, 7);
    const existing = byMonth.get(month);
    if (!existing) continue;

    const existingIds = new Set(existing.map((t) => t.id));
    const id = computeTransactionId(tx.date, tx.amount, tx.description, result.source);

    if (existingIds.has(id)) {
      skipped++;
      continue;
    }

    const newTx: Transaction = {
      id,
      date: tx.date,
      amount: tx.amount,
      description: tx.description,
      source: result.source,
      type: tx.type,
      categoryId: null,
      categoryManual: false,
    };

    const [categorized] = autoCategorize([newTx], categories);
    existing.push(categorized);
    existingIds.add(id);
    added++;
  }

  for (const [month, txs] of byMonth) {
    txs.sort((a, b) => b.date.localeCompare(a.date));
    await writeTransactions(month, txs);
  }

  return NextResponse.json({
    source: result.source,
    total: result.transactions.length,
    added,
    skipped,
    warnings: result.warnings,
  });
}
