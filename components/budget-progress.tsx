"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { formatCurrency } from "@/lib/format";
import type { Budget, Category } from "@/lib/types";
import { cn } from "@/lib/utils";

interface BudgetProgressProps {
  budget: Budget | null;
  spending: Record<string, number>;
  totalExpenses: number;
  categories: Category[];
}

function ProgressBar({
  spent,
  limit,
  label,
  color,
}: {
  spent: number;
  limit: number;
  label: string;
  color?: string;
}) {
  const pct = limit > 0 ? Math.min((spent / limit) * 100, 100) : 0;

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
          {formatCurrency(spent)} / {formatCurrency(limit)}
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

  if (!budget) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Budget</CardTitle>
        </CardHeader>
        <CardContent className="text-muted-foreground">No budget set for this month</CardContent>
      </Card>
    );
  }

  const categoryBudgets = Object.entries(budget.categoryLimits)
    .map(([catId, limit]) => {
      const cat = categories.find((c) => c.id === catId);
      return {
        id: catId,
        name: cat?.name ?? catId,
        color: cat?.color,
        spent: spending[catId] ?? 0,
        limit,
      };
    })
    .sort((a, b) => b.limit - a.limit);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Budget</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {budget.globalLimit != null && (
          <ProgressBar spent={totalExpenses} limit={budget.globalLimit} label="Overall" />
        )}
        {categoryBudgets.map((cb) => (
          <Link
            key={cb.id}
            href={txHref(cb.id)}
            className="block rounded-md -mx-2 px-2 py-1 transition-colors hover:bg-muted/50"
          >
            <ProgressBar spent={cb.spent} limit={cb.limit} label={cb.name} color={cb.color} />
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}
