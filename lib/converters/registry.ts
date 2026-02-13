import { hapoalim } from "./hapoalim";
import { isracard } from "./isracard";
import type { PdfConverter } from "./types";

const converters: PdfConverter[] = [isracard, hapoalim];

export function detectConverter(filename: string): PdfConverter | null {
  return converters.find((c) => c.matchesFilename(filename)) ?? null;
}
