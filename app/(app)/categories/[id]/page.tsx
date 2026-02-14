"use client";

import { Pencil, Trash2 } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { Suspense, useState } from "react";
import { toast } from "sonner";
import useSWR, { useSWRConfig } from "swr";
import { CategoryFormDialog } from "@/components/category-form-dialog";
import { MonthSelector } from "@/components/month-selector";
import { TransactionEditSheet } from "@/components/transaction-edit-sheet";
import { TransactionTable } from "@/components/transaction-table";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useMonthParam } from "@/hooks/use-month-param";
import type { Category, Transaction } from "@/lib/types";

function CategoryTransactions({ categoryId, month }: { categoryId: string; month: string }) {
  const { data: transactions } = useSWR<Transaction[]>(
    `/api/transactions?month=${month}&category=${categoryId}`,
  );
  const { data: categories } = useSWR<Category[]>("/api/categories");
  const [editing, setEditing] = useState<Transaction | null>(null);

  if (!transactions || !categories) return null;

  return (
    <>
      <TransactionTable
        transactions={transactions}
        categories={categories}
        onRowClick={setEditing}
      />
      <TransactionEditSheet
        transaction={editing}
        categories={categories}
        onClose={() => setEditing(null)}
      />
    </>
  );
}

export default function CategoryDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { mutate } = useSWRConfig();
  const [month, setMonth] = useMonthParam();
  const [editOpen, setEditOpen] = useState(false);

  const { data: categories } = useSWR<Category[]>("/api/categories");
  const category = categories?.find((c) => c.id === params.id);

  async function handleDelete() {
    if (!confirm("Delete this category?")) return;
    await fetch(`/api/categories/${params.id}`, { method: "DELETE" });
    await mutate((key: string) => typeof key === "string" && key.startsWith("/api/"));
    toast.success("Category deleted");
    router.push("/categories");
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-bold">{category?.name ?? "Category"}</h1>
        <div className="flex items-center gap-2">
          <MonthSelector month={month} onChange={setMonth} />
          {category && (
            <>
              <Button variant="outline" size="icon" onClick={() => setEditOpen(true)}>
                <Pencil className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={handleDelete}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      </div>
      <Suspense fallback={<Skeleton className="h-96" />}>
        <CategoryTransactions categoryId={params.id} month={month} />
      </Suspense>
      {category && (
        <CategoryFormDialog
          open={editOpen}
          onClose={() => setEditOpen(false)}
          category={category}
        />
      )}
    </div>
  );
}
