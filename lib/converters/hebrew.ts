const HEBREW_RANGE = /[\u0590-\u05FF]/;

/**
 * Reverse only Hebrew character runs in a string, preserving
 * numbers, Latin characters, and punctuation in their original order.
 * Useful when pdf-parse produces reversed RTL text.
 */
export function reverseHebrewRuns(text: string): string {
  return text.replace(/[\u0590-\u05FF\s]+/g, (match) => {
    // Only reverse if the run contains actual Hebrew characters (not just whitespace)
    if (!HEBREW_RANGE.test(match)) return match;
    return match.split("").reverse().join("");
  });
}

/**
 * Normalize extracted PDF text:
 * - Collapse multiple whitespace into single space
 * - Trim each line
 */
export function normalizeText(text: string): string {
  return text
    .split("\n")
    .map((line) => line.replace(/\s+/g, " ").trim())
    .join("\n");
}
