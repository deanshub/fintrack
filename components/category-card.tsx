"use client";

import * as Icons from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/format";
import type { Category } from "@/lib/types";

interface CategoryCardProps {
  category: Category;
  spent: number;
}

export function CategoryCard({ category, spent }: CategoryCardProps) {
  const searchParams = useSearchParams();
  const month = searchParams.get("month");
  const qs = month ? `?month=${month}` : "";
  const Icon =
    (
      Icons as unknown as Record<
        string,
        React.ComponentType<{ className?: string; style?: React.CSSProperties }>
      >
    )[category.icon] ?? Icons.Tag;

  return (
    <Link href={`/categories/${category.id}${qs}`}>
      <Card className="transition-colors hover:bg-muted/50">
        <CardHeader className="flex flex-row items-center gap-3 space-y-0 pb-2">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-md"
            style={{ backgroundColor: `hsl(from ${category.color} h s l / 0.15)` }}
          >
            <Icon className="h-5 w-5" style={{ color: category.color }} />
          </div>
          <div className="flex-1">
            <CardTitle className="text-base">{category.name}</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <Badge variant="outline">{category.rules.length} rules</Badge>
            <span className="text-sm font-medium text-muted-foreground">
              {formatCurrency(spent)}
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
