import { PDFParse } from "pdf-parse";
import type { ConversionResult, ParsedTransaction, PdfConverter } from "./types";

/** Match DD/MM/YYYY at the start of a line */
const DATE_RE = /^(\d{2}\/\d{2}\/\d{4})/;
/** Filename pattern */
const FILENAME_RE = /^current_account_operations/;
/** Header lines to skip */
const HEADER_RE = /תאריך\s+פעולה|תנועות בחשבון|תקופה|חשבון\s+סניף|שם חשבון/;

function parseDate(ddmmyyyy: string): string {
  const [dd, mm, yyyy] = ddmmyyyy.split("/");
  return `${yyyy}-${mm}-${dd}`;
}

function parseAmount(raw: string): number {
  const cleaned = raw.replace(/,/g, "");
  return Math.round(Number.parseFloat(cleaned) * 100);
}

async function parse(buffer: Buffer, _filename: string): Promise<ConversionResult> {
  const source = "hapoalim";
  const warnings: string[] = [];
  const transactions: ParsedTransaction[] = [];

  const pdf = new PDFParse({ data: new Uint8Array(buffer), verbosity: 0 });
  const result = await pdf.getText();
  const rawText = result.pages.map((p: { text: string }) => p.text).join("\n");

  // Normalize tabs to spaces per line
  const lines = rawText
    .split("\n")
    .map((l: string) => l.replace(/\t/g, " ").replace(/\s+/g, " ").trim());

  /**
   * Hapoalim format: each transaction spans two lines:
   *   DD/MM/YYYY <description> <amount> ₪<balance> ##
   *   <1|2>
   * Where 1 = credit (income), 2 = debit (expense)
   *
   * The trailing number indicates which column (debit/credit) the amount was in.
   */
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const dateMatch = line.match(DATE_RE);
    if (!dateMatch) continue;
    if (HEADER_RE.test(line)) continue;

    // Find the type indicator on the next non-empty line
    let typeIndicator = "";
    for (let j = i + 1; j < Math.min(i + 3, lines.length); j++) {
      const trimmed = lines[j].trim();
      if (trimmed === "1" || trimmed === "2") {
        typeIndicator = trimmed;
        break;
      }
    }

    if (!typeIndicator) {
      warnings.push(`Skipped (no type indicator): ${line.slice(0, 80)}`);
      continue;
    }

    const date = parseDate(dateMatch[1]);

    // Extract description and amount from the line
    // Format: DD/MM/YYYY <description> <amount> ₪<balance> ##
    const afterDate = line.slice(dateMatch[0].length).trim();

    // Find the ## marker to isolate the transaction part
    const hashIdx = afterDate.indexOf("##");
    const txPart = hashIdx !== -1 ? afterDate.slice(0, hashIdx).trim() : afterDate;

    // Extract amounts: the first is the transaction amount, the second (after ₪) is the balance
    // Pattern: <description> <amount> ₪<balance>
    const balanceMatch = txPart.match(/₪([\d,]+\.\d{2})\s*$/);
    if (!balanceMatch) {
      warnings.push(`Skipped (no balance): ${line.slice(0, 80)}`);
      continue;
    }

    const beforeBalance = txPart.slice(0, txPart.lastIndexOf("₪")).trim();
    const amountMatch = beforeBalance.match(/([\d,]+\.\d{2})\s*$/);
    if (!amountMatch) {
      warnings.push(`Skipped (no amount): ${line.slice(0, 80)}`);
      continue;
    }

    const amount = parseAmount(amountMatch[1]);
    if (amount <= 0) continue;

    const description = beforeBalance.slice(0, beforeBalance.lastIndexOf(amountMatch[1])).trim();
    if (!description) {
      warnings.push(`Skipped (no description): ${line.slice(0, 80)}`);
      continue;
    }

    const type = typeIndicator === "1" ? "income" : "expense";
    transactions.push({ date, amount, description, type });
  }

  if (transactions.length === 0) {
    warnings.push("No transactions found in PDF");
  }

  return { source, transactions, warnings };
}

export const hapoalim: PdfConverter = {
  name: "Bank Hapoalim",
  matchesFilename: (filename: string) => FILENAME_RE.test(filename),
  parse,
};
