import type { Category, Transaction } from "./types";

export function autoCategorize(transactions: Transaction[], categories: Category[]): Transaction[] {
  return transactions.map((tx) => {
    if (tx.categoryManual) return tx;

    const descLower = tx.description.toLowerCase();
    for (const cat of categories) {
      for (const rule of cat.rules) {
        if (descLower.includes(rule.keyword.toLowerCase())) {
          return { ...tx, categoryId: cat.id };
        }
      }
    }

    return { ...tx, categoryId: "other" };
  });
}
