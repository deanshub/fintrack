import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

const DATA_DIR = join(process.cwd(), "data");

async function ensureDataDir() {
  await mkdir(DATA_DIR, { recursive: true });
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
