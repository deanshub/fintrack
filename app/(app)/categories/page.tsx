"use client";

import { Plus } from "lucide-react";
import { Suspense, useState } from "react";
import useSWR from "swr";
import { CategoryCard } from "@/components/category-card";
import { CategoryFormDialog } from "@/components/category-form-dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getCurrentMonth } from "@/lib/format";
import type { Category } from "@/lib/types";

function CategoriesGrid() {
  const month = getCurrentMonth();
  const { data: categories } = useSWR<Category[]>("/api/categories");
  const { data: summary } = useSWR<{ byCategory: Record<string, number> }>(
    `/api/stats/summary?month=${month}`,
  );

  if (!categories || !summary) return null;

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {categories.map((cat) => (
        <CategoryCard key={cat.id} category={cat} spent={summary.byCategory[cat.id] ?? 0} />
      ))}
    </div>
  );
}

export default function CategoriesPage() {
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Categories</h1>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Category
        </Button>
      </div>
      <Suspense
        fallback={
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={`skeleton-${i}`} className="h-40" />
            ))}
          </div>
        }
      >
        <CategoriesGrid />
      </Suspense>
      <CategoryFormDialog open={dialogOpen} onClose={() => setDialogOpen(false)} />
    </div>
  );
}
