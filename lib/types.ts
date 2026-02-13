export type TransactionType = "income" | "expense";

export interface Transaction {
  id: string;
  date: string;
  amount: number;
  description: string;
  source: string;
  type: TransactionType;
  categoryId: string | null;
  categoryManual: boolean;
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
