import type { TransactionType } from "@/lib/types";

export interface ParsedTransaction {
  date: string; // YYYY-MM-DD
  amount: number; // positive integer in agorot
  description: string;
  type: TransactionType;
}

export interface ConversionResult {
  source: string; // e.g. "isracard-5702", "hapoalim"
  transactions: ParsedTransaction[];
  warnings: string[];
}

export interface PdfConverter {
  name: string;
  matchesFilename: (filename: string) => boolean;
  parse: (buffer: Buffer, filename: string) => Promise<ConversionResult>;
}
