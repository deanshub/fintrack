import { format, getDaysInMonth, parse, subMonths } from "date-fns";
import { autoCategorize } from "./categorize";
import { computeTransactionId } from "./hash";
import type { Budget, Category, Transaction } from "./types";

const CATEGORIES: Category[] = [
  {
    id: "income",
    name: "Income",
    icon: "Wallet",
    color: "var(--chart-1)",
    rules: [
      { keyword: "משכורת" },
      { keyword: "salary" },
      { keyword: "העברה נכנסת" },
      { keyword: "freelance" },
    ],
  },
  {
    id: "groceries",
    name: "Groceries",
    icon: "ShoppingCart",
    color: "var(--chart-2)",
    rules: [
      { keyword: "שופרסל" },
      { keyword: "רמי לוי" },
      { keyword: "מגא" },
      { keyword: "יוחננוף" },
      { keyword: "ויקטורי" },
      { keyword: "סופר-פארם" },
    ],
  },
  {
    id: "dining",
    name: "Dining",
    icon: "UtensilsCrossed",
    color: "var(--chart-3)",
    rules: [
      { keyword: "wolt" },
      { keyword: "ג'פניקה" },
      { keyword: "מסעדה" },
      { keyword: "קפה" },
      { keyword: "בית קפה" },
      { keyword: "פיצה" },
    ],
  },
  {
    id: "transport",
    name: "Transport",
    icon: "Car",
    color: "var(--chart-4)",
    rules: [
      { keyword: "דלק" },
      { keyword: "סונול" },
      { keyword: "פז" },
      { keyword: "uber" },
      { keyword: "gett" },
      { keyword: "רב-קו" },
    ],
  },
  {
    id: "housing",
    name: "Housing",
    icon: "Home",
    color: "var(--chart-5)",
    rules: [{ keyword: "שכירות" }, { keyword: "rent" }, { keyword: "ועד בית" }],
  },
  {
    id: "utilities",
    name: "Utilities",
    icon: "Zap",
    color: "var(--chart-1)",
    rules: [
      { keyword: "חשמל" },
      { keyword: "מים" },
      { keyword: "ארנונה" },
      { keyword: "גז" },
      { keyword: "אינטרנט" },
      { keyword: "פרטנר" },
      { keyword: "סלקום" },
    ],
  },
  {
    id: "entertainment",
    name: "Entertainment",
    icon: "Clapperboard",
    color: "var(--chart-2)",
    rules: [
      { keyword: "סינמה" },
      { keyword: "yes planet" },
      { keyword: "הופעה" },
      { keyword: "כרטיס" },
    ],
  },
  {
    id: "shopping",
    name: "Shopping",
    icon: "ShoppingBag",
    color: "var(--chart-3)",
    rules: [
      { keyword: "אמזון" },
      { keyword: "amazon" },
      { keyword: "aliexpress" },
      { keyword: "zara" },
      { keyword: "h&m" },
      { keyword: "קניון" },
    ],
  },
  {
    id: "health",
    name: "Health",
    icon: "Heart",
    color: "var(--chart-4)",
    rules: [
      { keyword: "מכבי" },
      { keyword: "כללית" },
      { keyword: "בית מרקחת" },
      { keyword: "רופא" },
      { keyword: "gym" },
      { keyword: "חדר כושר" },
    ],
  },
  {
    id: "subscriptions",
    name: "Subscriptions",
    icon: "RefreshCw",
    color: "var(--chart-5)",
    rules: [
      { keyword: "netflix" },
      { keyword: "spotify" },
      { keyword: "apple" },
      { keyword: "google storage" },
    ],
  },
  {
    id: "other",
    name: "Other",
    icon: "CircleEllipsis",
    color: "var(--muted-foreground)",
    rules: [],
  },
];

interface MockEntry {
  description: string;
  amountRange: [number, number];
  type: "income" | "expense";
  frequency: number;
}

const MOCK_ENTRIES: MockEntry[] = [
  { description: "משכורת חודשית", amountRange: [1200000, 1200000], type: "income", frequency: 1 },
  {
    description: "freelance project",
    amountRange: [200000, 500000],
    type: "income",
    frequency: 0.3,
  },
  {
    description: "שופרסל - קניות שבועיות",
    amountRange: [15000, 40000],
    type: "expense",
    frequency: 4,
  },
  { description: "רמי לוי", amountRange: [8000, 25000], type: "expense", frequency: 2 },
  { description: "סופר-פארם", amountRange: [5000, 15000], type: "expense", frequency: 1 },
  { description: "wolt - משלוח אוכל", amountRange: [4000, 12000], type: "expense", frequency: 3 },
  { description: "קפה גרג", amountRange: [2000, 5000], type: "expense", frequency: 2 },
  { description: "פיצה האט", amountRange: [5000, 10000], type: "expense", frequency: 1 },
  { description: "סונול - דלק", amountRange: [15000, 30000], type: "expense", frequency: 2 },
  { description: "רב-קו טעינה", amountRange: [10000, 20000], type: "expense", frequency: 1 },
  { description: "שכירות דירה", amountRange: [500000, 500000], type: "expense", frequency: 1 },
  { description: "ועד בית", amountRange: [15000, 15000], type: "expense", frequency: 1 },
  { description: "חשמל - חברת חשמל", amountRange: [20000, 40000], type: "expense", frequency: 1 },
  { description: "מים - עירייה", amountRange: [8000, 15000], type: "expense", frequency: 1 },
  { description: "פרטנר אינטרנט", amountRange: [10000, 10000], type: "expense", frequency: 1 },
  { description: "yes planet - סרט", amountRange: [4000, 8000], type: "expense", frequency: 0.5 },
  { description: "amazon - הזמנה", amountRange: [5000, 30000], type: "expense", frequency: 1 },
  { description: "zara - בגדים", amountRange: [10000, 30000], type: "expense", frequency: 0.5 },
  {
    description: "מכבי שירותי בריאות",
    amountRange: [5000, 15000],
    type: "expense",
    frequency: 0.5,
  },
  { description: "gym - מנוי חודשי", amountRange: [20000, 20000], type: "expense", frequency: 1 },
  { description: "netflix", amountRange: [5000, 5000], type: "expense", frequency: 1 },
  { description: "spotify", amountRange: [2500, 2500], type: "expense", frequency: 1 },
  { description: "apple storage", amountRange: [1000, 1000], type: "expense", frequency: 1 },
];

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomAmount(range: [number, number]): number {
  if (range[0] === range[1]) return range[0];
  return randomInt(range[0], range[1]);
}

function randomDay(month: string): string {
  const date = parse(month, "yyyy-MM", new Date());
  const days = getDaysInMonth(date);
  const day = randomInt(1, days);
  return `${month}-${String(day).padStart(2, "0")}`;
}

export function generateMockData(): {
  transactionsByMonth: Map<string, Transaction[]>;
  categories: Category[];
  budgets: Budget[];
} {
  const now = new Date();
  const months: string[] = [];
  for (let i = 3; i >= 0; i--) {
    months.push(format(subMonths(now, i), "yyyy-MM"));
  }
  const rawTransactions: Omit<Transaction, "id" | "categoryId" | "categoryManual">[] = [];

  for (const month of months) {
    for (const entry of MOCK_ENTRIES) {
      const count =
        entry.frequency >= 1 ? entry.frequency : Math.random() < entry.frequency ? 1 : 0;

      for (let i = 0; i < count; i++) {
        rawTransactions.push({
          date: randomDay(month),
          amount: randomAmount(entry.amountRange),
          description: entry.description,
          source: "mock",
          type: entry.type,
        });
      }
    }
  }

  const transactions: Transaction[] = rawTransactions.map((tx) => ({
    ...tx,
    id: computeTransactionId(tx.date, tx.amount, tx.description, tx.source),
    categoryId: null,
    categoryManual: false,
  }));

  const categorized = autoCategorize(transactions, CATEGORIES);

  const transactionsByMonth = new Map<string, Transaction[]>();
  for (const tx of categorized) {
    const month = tx.date.slice(0, 7);
    if (!transactionsByMonth.has(month)) {
      transactionsByMonth.set(month, []);
    }
    transactionsByMonth.get(month)?.push(tx);
  }

  for (const [, txs] of transactionsByMonth) {
    txs.sort((a, b) => b.date.localeCompare(a.date));
  }

  const budgets: Budget[] = months.map((month) => ({
    month,
    globalLimit: 1500000,
    categoryLimits: {
      groceries: 200000,
      dining: 100000,
      transport: 80000,
      housing: 550000,
      utilities: 80000,
      entertainment: 50000,
      shopping: 80000,
      health: 40000,
      subscriptions: 20000,
    },
  }));

  return { transactionsByMonth, categories: CATEGORIES, budgets };
}
