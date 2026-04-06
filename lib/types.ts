export type TransactionType = "income" | "expense";

export const IGNORE_CATEGORY_ID = "ignore";

export interface Transaction {
  id: string;
  date: string;
  amount: number;
  description: string;
  source: string;
  type: TransactionType;
  categoryId: string | null;
  categoryManual: boolean;
  note?: string;
}

export interface CategoryRule {
  keyword: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  rules: CategoryRule[];
}

export interface Budget {
  month: string;
  globalLimit: number | null;
  categoryLimits: Record<string, number>;
}

export interface FinanceItem {
  id: string;
  label: string;
  amount: number;
  type: "source" | "expense";
  date?: string; // yyyy-MM-dd — omitted means already available
}
