"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useSWRConfig } from "swr";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { formatCurrency, formatDate } from "@/lib/format";
import type { Category, Transaction } from "@/lib/types";

interface TransactionEditSheetProps {
  transaction: Transaction | null;
  categories: Category[];
  onClose: () => void;
}

export function TransactionEditSheet({
  transaction,
  categories,
  onClose,
}: TransactionEditSheetProps) {
  const { mutate } = useSWRConfig();
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const currentCategoryId = categoryId ?? transaction?.categoryId ?? "";

  async function handleSave() {
    if (!transaction) return;
    setSaving(true);
    try {
      await fetch(`/api/transactions/${transaction.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ categoryId: currentCategoryId || null }),
      });
      await mutate((key: string) => typeof key === "string" && key.startsWith("/api/"));
      toast.success("Category updated");
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Sheet open={!!transaction} onOpenChange={(open) => !open && onClose()}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Edit Transaction</SheetTitle>
          <SheetDescription>Change the category for this transaction</SheetDescription>
        </SheetHeader>
        {transaction && (
          <div className="space-y-4 px-4">
            <div>
              <Label className="text-muted-foreground">Description</Label>
              <p className="font-medium">{transaction.description}</p>
            </div>
            <div className="flex gap-4">
              <div>
                <Label className="text-muted-foreground">Date</Label>
                <p className="font-medium">{formatDate(transaction.date)}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Amount</Label>
                <p className="font-medium">{formatCurrency(transaction.amount)}</p>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={currentCategoryId} onValueChange={setCategoryId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleSave} disabled={saving} className="w-full">
              {saving ? "Saving..." : "Save"}
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
