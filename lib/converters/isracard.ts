import { PDFParse } from "pdf-parse";
import type { ConversionResult, ParsedTransaction, PdfConverter } from "./types";

/** Match DD/MM/YY at the start of a line */
const DATE_RE = /^(\d{2}\/\d{2}\/\d{2})/;
/** Match amounts like 1,234.56 or 69.90 (exactly 2 decimal places) */
const AMOUNT_RE = /\d[\d,]*\.\d{2}/g;
/** Section headers */
const FOREIGN_HEADER = /רכישות\s*בחו"ל/;
const DOMESTIC_HEADER = /עסקות\s*שחויבו/;
/** Totals line */
const TOTAL_RE = /סה"כ/;
/** Card type prefixes to strip from descriptions */
const CARD_TYPES = ["תש . נייד", "לא הוצג", "ה. קבע"];
/** Page footer pattern */
const PAGE_FOOTER = /עמוד\s+\d+\s+מתוך/;
/** Credit/refund indicator */
const CREDIT_INDICATOR = /זיכוי/;
/** Fee detail line (foreign section) */
const FEE_LINE_RE = /^\*\*/;
/** Filename pattern: {4-digit card}_{YYYYMMDD}.pdf */
const FILENAME_RE = /^(\d{4})_\d{8}\.pdf$/;

type SectionType = "foreign" | "domestic";

function parseDate(ddmmyy: string): string {
  const [dd, mm, yy] = ddmmyy.split("/");
  const year = Number.parseInt(yy, 10);
  const fullYear = year >= 50 ? 1900 + year : 2000 + year;
  return `${fullYear}-${mm}-${dd}`;
}

function parseAmount(raw: string): number {
  const cleaned = raw.replace(/,/g, "");
  return Math.round(Number.parseFloat(cleaned) * 100);
}

function cleanDescription(text: string): string {
  let desc = text;
  for (const ct of CARD_TYPES) {
    if (desc.startsWith(ct)) {
      desc = desc.slice(ct.length);
      break;
    }
  }
  return desc.replace(/\s+/g, " ").trim();
}

function extractTransactionsFromSection(
  lines: string[],
  section: SectionType,
  warnings: string[],
): ParsedTransaction[] {
  const transactions: ParsedTransaction[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const dateMatch = line.match(DATE_RE);
    if (!dateMatch) continue;
    if (TOTAL_RE.test(line)) continue;
    if (PAGE_FOOTER.test(line)) continue;

    // Collect continuation lines (multi-line business names / amounts)
    let fullLine = line;
    while (i + 1 < lines.length) {
      const next = lines[i + 1];
      if (DATE_RE.test(next) || TOTAL_RE.test(next) || next === "" || PAGE_FOOTER.test(next)) break;
      if (FEE_LINE_RE.test(next)) break;
      // Skip ad/promo text (long lines without amounts)
      if (next.length > 100 && !AMOUNT_RE.test(next)) break;
      fullLine += ` ${next}`;
      i++;
    }

    const date = parseDate(dateMatch[1]);
    const amounts = fullLine.match(AMOUNT_RE);
    if (!amounts || amounts.length < 1) {
      warnings.push(`Skipped line (no amounts): ${fullLine.slice(0, 80)}`);
      continue;
    }

    // Foreign: NIS charge is the last amount (after original amount and fee)
    // Domestic: charge is the second amount (original amount, then charge)
    let chargeRaw: string;
    if (section === "foreign") {
      chargeRaw = amounts[amounts.length - 1];
    } else {
      chargeRaw = amounts.length >= 2 ? amounts[1] : amounts[0];
    }
    const amount = parseAmount(chargeRaw);
    if (amount <= 0) continue;

    // Extract description: text between date and first amount
    const firstAmountIdx = fullLine.indexOf(amounts[0]);
    const descRaw = fullLine.slice(dateMatch[0].length, firstAmountIdx);
    const description = cleanDescription(descRaw);
    if (!description) {
      warnings.push(`Skipped line (no description): ${fullLine.slice(0, 80)}`);
      continue;
    }

    const isCredit = CREDIT_INDICATOR.test(fullLine);
    transactions.push({
      date,
      amount,
      description,
      type: isCredit ? "income" : "expense",
    });
  }

  return transactions;
}

async function parse(buffer: Buffer, filename: string): Promise<ConversionResult> {
  const cardMatch = filename.match(FILENAME_RE);
  const cardSuffix = cardMatch ? cardMatch[1] : "unknown";
  const source = `isracard-${cardSuffix}`;
  const warnings: string[] = [];

  const pdf = new PDFParse({ data: new Uint8Array(buffer), verbosity: 0 });
  const result = await pdf.getText();
  const rawText = result.pages.map((p: { text: string }) => p.text).join("\n");

  // Normalize: replace tabs with spaces, collapse whitespace per line
  const text = rawText
    .split("\n")
    .map((l: string) => l.replace(/\t/g, " ").replace(/\s+/g, " ").trim())
    .join("\n");

  const lines = text.split("\n");

  // Find section boundaries
  let foreignStart = -1;
  let domesticStart = -1;
  for (let i = 0; i < lines.length; i++) {
    if (FOREIGN_HEADER.test(lines[i]) && foreignStart === -1) foreignStart = i;
    if (DOMESTIC_HEADER.test(lines[i]) && domesticStart === -1) domesticStart = i;
  }

  const allTransactions: ParsedTransaction[] = [];

  // Parse foreign section
  if (foreignStart !== -1) {
    const end = domesticStart !== -1 ? domesticStart : lines.length;
    const sectionLines = lines.slice(foreignStart + 1, end);
    const txs = extractTransactionsFromSection(sectionLines, "foreign", warnings);
    allTransactions.push(...txs);
  }

  // Parse domestic section (may span multiple pages with "המשך מעמוד קודם")
  if (domesticStart !== -1) {
    const sectionLines = lines.slice(domesticStart + 1);
    const txs = extractTransactionsFromSection(sectionLines, "domestic", warnings);
    allTransactions.push(...txs);
  }

  if (allTransactions.length === 0) {
    warnings.push("No transactions found in PDF");
  }

  return { source, transactions: allTransactions, warnings };
}

export const isracard: PdfConverter = {
  name: "Isracard",
  matchesFilename: (filename: string) => FILENAME_RE.test(filename),
  parse,
};
