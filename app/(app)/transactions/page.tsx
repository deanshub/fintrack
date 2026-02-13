"use client";

import { Check, ChevronsUpDown } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useState } from "react";
import useSWR from "swr";
import { MonthSelector } from "@/components/month-selector";
import { TransactionEditSheet } from "@/components/transaction-edit-sheet";
import { TransactionTable } from "@/components/transaction-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import { useMonthParam } from "@/hooks/use-month-param";
import type { Category, Transaction } from "@/lib/types";
import { cn } from "@/lib/utils";

function useCategoryParams(): [string[], (categories: string[]) => void] {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const raw = searchParams.get("category");
  const categories = raw ? raw.split(",") : [];

  const setCategories = useCallback(
    (next: string[]) => {
      const params = new URLSearchParams(searchParams);
      if (next.length === 0) {
        params.delete("category");
      } else {
        params.set("category", next.join(","));
      }
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [searchParams, router, pathname],
  );

  return [categories, setCategories];
}

function TransactionsContent({
  month,
  categoryFilter,
  search,
}: {
  month: string;
  categoryFilter: string[];
  search: string;
}) {
  const catParam = categoryFilter.length > 0 ? `&category=${categoryFilter.join(",")}` : "";
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
  const [categoryFilter, setCategoryFilter] = useCategoryParams();
  const [search, setSearch] = useState("");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Transactions</h1>
        <MonthSelector month={month} onChange={setMonth} />
      </div>
      <div className="flex flex-wrap gap-4">
        <Suspense fallback={<Skeleton className="h-10 w-40" />}>
          <CategoryMultiFilter selected={categoryFilter} onChange={setCategoryFilter} />
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

function CategoryMultiFilter({
  selected,
  onChange,
}: {
  selected: string[];
  onChange: (ids: string[]) => void;
}) {
  const { data: categories } = useSWR<Category[]>("/api/categories");
  const [open, setOpen] = useState(false);

  if (!categories) return null;

  function toggle(id: string) {
    if (selected.includes(id)) {
      onChange(selected.filter((s) => s !== id));
    } else {
      onChange([...selected, id]);
    }
  }

  const selectedNames = selected
    .map((id) => categories.find((c) => c.id === id)?.name)
    .filter(Boolean);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-[220px] justify-between">
          {selected.length === 0 ? (
            <span className="text-muted-foreground">All Categories</span>
          ) : selected.length <= 2 ? (
            <span className="flex gap-1 truncate">
              {selectedNames.map((name) => (
                <Badge key={name} variant="secondary" className="text-xs">
                  {name}
                </Badge>
              ))}
            </span>
          ) : (
            <span>{selected.length} categories</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[220px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Search categories..." />
          <CommandList>
            <CommandEmpty>No categories found.</CommandEmpty>
            <CommandGroup>
              {categories.map((cat) => (
                <CommandItem key={cat.id} value={cat.name} onSelect={() => toggle(cat.id)}>
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      selected.includes(cat.id) ? "opacity-100" : "opacity-0",
                    )}
                  />
                  {cat.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
