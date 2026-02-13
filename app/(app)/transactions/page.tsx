"use client";

import { Suspense, useState } from "react";
import useSWR from "swr";
import { MonthSelector } from "@/components/month-selector";
import { TransactionEditSheet } from "@/components/transaction-edit-sheet";
import { TransactionTable } from "@/components/transaction-table";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useMonthParam } from "@/hooks/use-month-param";
import type { Category, Transaction } from "@/lib/types";

const ALL_CATEGORIES = "__all__";

function TransactionsContent({
  month,
  categoryFilter,
  search,
}: {
  month: string;
  categoryFilter: string;
  search: string;
}) {
  const catParam = categoryFilter !== ALL_CATEGORIES ? `&category=${categoryFilter}` : "";
  const { data: transactions } = useSWR<Transaction[]>(
    `/api/transactions?month=${month}${catParam}`,
  );
  const { data: categories } = useSWR<Category[]>("/api/categories");
  const [editing, setEditing] = useState<Transaction | null>(null);

  if (!transactions || !categories) return null;

  const filtered = search
    ? transactions.filter((t) => t.description.toLowerCase().includes(search.toLowerCase()))
    : transactions;

  return (
    <>
      <TransactionTable transactions={filtered} categories={categories} onRowClick={setEditing} />
      <TransactionEditSheet
        transaction={editing}
        categories={categories}
        onClose={() => setEditing(null)}
      />
    </>
  );
}

export default function TransactionsPage() {
  const [month, setMonth] = useMonthParam();
  const [categoryFilter, setCategoryFilter] = useState(ALL_CATEGORIES);
  const [search, setSearch] = useState("");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Transactions</h1>
        <MonthSelector month={month} onChange={setMonth} />
      </div>
      <div className="flex flex-wrap gap-4">
        <Suspense fallback={<Skeleton className="h-10 w-40" />}>
          <CategoryFilter value={categoryFilter} onChange={setCategoryFilter} />
        </Suspense>
        <Input
          placeholder="Search descriptions..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
      </div>
      <Suspense fallback={<Skeleton className="h-96" />}>
        <TransactionsContent month={month} categoryFilter={categoryFilter} search={search} />
      </Suspense>
    </div>
  );
}

function CategoryFilter({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const { data: categories } = useSWR<Category[]>("/api/categories");
  if (!categories) return null;

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder="All Categories" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={ALL_CATEGORIES}>All Categories</SelectItem>
        {categories.map((cat) => (
          <SelectItem key={cat.id} value={cat.id}>
            {cat.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
