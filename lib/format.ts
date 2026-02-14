import { format, parse } from "date-fns";

export function formatCurrency(agorot: number): string {
  const shekel = agorot / 100;
  return `₪${shekel.toLocaleString("he-IL", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatDate(dateStr: string): string {
  const date = parse(dateStr, "yyyy-MM-dd", new Date());
  return date.toLocaleDateString("he-IL", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatDateShort(dateStr: string): string {
  const date = parse(dateStr, "yyyy-MM-dd", new Date());
  return format(date, "d");
}

export function formatMonth(monthStr: string): string {
  const date = parse(monthStr, "yyyy-MM", new Date());
  return format(date, "MMMM yyyy");
}

export function getCurrentMonth(): string {
  return format(new Date(), "yyyy-MM");
}
