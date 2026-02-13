import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { Transaction } from "./types";

const DATA_DIR = join(process.cwd(), "data");
const TRANSACTIONS_DIR = join(DATA_DIR, "transactions");

async function ensureDataDir() {
  await mkdir(DATA_DIR, { recursive: true });
}

async function ensureTransactionsDir() {
  await mkdir(TRANSACTIONS_DIR, { recursive: true });
}

export async function readJsonFile<T>(filename: string): Promise<T> {
  await ensureDataDir();
  const filePath = join(DATA_DIR, filename);
  try {
    const raw = await readFile(filePath, "utf-8");
    return JSON.parse(raw) as T;
  } catch {
    return [] as unknown as T;
  }
}

export async function writeJsonFile<T>(filename: string, data: T): Promise<void> {
  await ensureDataDir();
  const filePath = join(DATA_DIR, filename);
  await writeFile(filePath, JSON.stringify(data, null, 2), "utf-8");
}

export async function readTransactions(month: string): Promise<Transaction[]> {
  await ensureTransactionsDir();
  const filePath = join(TRANSACTIONS_DIR, `${month}.json`);
  try {
    const raw = await readFile(filePath, "utf-8");
    return JSON.parse(raw) as Transaction[];
  } catch {
    return [];
  }
}

export async function writeTransactions(month: string, data: Transaction[]): Promise<void> {
  await ensureTransactionsDir();
  const filePath = join(TRANSACTIONS_DIR, `${month}.json`);
  await writeFile(filePath, JSON.stringify(data, null, 2), "utf-8");
}

export async function listTransactionMonths(): Promise<string[]> {
  await ensureTransactionsDir();
  try {
    const files = await readdir(TRANSACTIONS_DIR);
    return files
      .filter((f) => f.endsWith(".json"))
      .map((f) => f.replace(".json", ""))
      .sort();
  } catch {
    return [];
  }
}

export async function readAllTransactions(): Promise<Transaction[]> {
  const months = await listTransactionMonths();
  const all: Transaction[] = [];
  for (const month of months) {
    const txs = await readTransactions(month);
    all.push(...txs);
  }
  all.sort((a, b) => b.date.localeCompare(a.date));
  return all;
}
