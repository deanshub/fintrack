import seedBudgets from "./seed-data/budgets.json";
import seedCategories from "./seed-data/categories.json";
import seedTransactions from "./seed-data/transactions.json";
import type { Budget, Category, Transaction } from "./types";

export function generateSeedData(): {
  transactionsByMonth: Map<string, Transaction[]>;
  categories: Category[];
  budgets: Budget[];
} {
  const categories = seedCategories as Category[];
  const budgets = seedBudgets as Budget[];

  const transactionsByMonth = new Map<string, Transaction[]>();
  for (const [month, txs] of Object.entries(seedTransactions)) {
    transactionsByMonth.set(month, txs as Transaction[]);
  }

  return { transactionsByMonth, categories, budgets };
}
