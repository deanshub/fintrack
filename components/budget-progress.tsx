"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { formatCurrency } from "@/lib/format";
import { type Budget, type Category, IGNORE_CATEGORY_ID } from "@/lib/types";
import { cn } from "@/lib/utils";

const EXCLUDED_IDS = new Set(["income", IGNORE_CATEGORY_ID, "other"]);

interface BudgetProgressProps {
  budget: Budget | null;
  spending: Record<string, number>;
  totalExpenses: number;
  categories: Category[];
}

function CategoryRow({
  spent,
  limit,
  label,
  color,
}: {
  spent: number;
  limit: number | null;
  label: string;
  color?: string;
}) {
  const pct = limit && limit > 0 ? Math.min((spent / limit) * 100, 100) : 0;

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between gap-2 text-sm">
        <span className="flex items-center gap-1.5 truncate font-medium">
          {color && (
            <span
              className="inline-block h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: color }}
            />
          )}
          {label}
        </span>
        <span className="shrink-0 text-xs text-muted-foreground">
          {formatCurrency(spent)} / {formatCurrency(limit ?? 0)}
        </span>
      </div>
      <Progress
        value={pct}
        className={cn(
          "[&>div]:transition-all",
          pct >= 90
            ? "[&>div]:bg-red-500"
            : pct >= 70
              ? "[&>div]:bg-yellow-500"
              : "[&>div]:bg-emerald-500",
        )}
      />
    </div>
  );
}

export function BudgetProgress({
  budget,
  spending,
  totalExpenses,
  categories,
}: BudgetProgressProps) {
  const searchParams = useSearchParams();
  const month = searchParams.get("month");

  function txHref(categoryId: string) {
    const params = new URLSearchParams();
    if (month) params.set("month", month);
    params.set("category", categoryId);
    const qs = params.toString();
    return `/transactions?${qs}`;
  }

  const rows = categories
    .filter((c) => !EXCLUDED_IDS.has(c.id))
    .map((cat) => ({
      id: cat.id,
      name: cat.name,
      color: cat.color,
      spent: spending[cat.id] ?? 0,
      limit: budget?.categoryLimits[cat.id] ?? null,
    }))
    .sort((a, b) => b.spent - a.spent);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Budget</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {budget?.globalLimit != null && (
          <CategoryRow spent={totalExpenses} limit={budget.globalLimit} label="Overall" />
        )}
        {rows.map((row) => (
          <Link
            key={row.id}
            href={txHref(row.id)}
            className="block rounded-md -mx-2 px-2 py-1 transition-colors hover:bg-muted/50"
          >
            <CategoryRow spent={row.spent} limit={row.limit} label={row.name} color={row.color} />
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}
