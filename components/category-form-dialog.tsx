"use client";

import { X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useSWRConfig } from "swr";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Category } from "@/lib/types";

const ICON_OPTIONS = [
  "ShoppingCart",
  "UtensilsCrossed",
  "Car",
  "Home",
  "Zap",
  "Clapperboard",
  "ShoppingBag",
  "Heart",
  "RefreshCw",
  "Wallet",
  "Tag",
  "CreditCard",
  "BookOpen",
  "Briefcase",
  "Plane",
];

const COLOR_OPTIONS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

interface CategoryFormDialogProps {
  open: boolean;
  onClose: () => void;
  category?: Category;
}

export function CategoryFormDialog({ open, onClose, category }: CategoryFormDialogProps) {
  const { mutate } = useSWRConfig();
  const isEdit = !!category;

  const [name, setName] = useState(category?.name ?? "");
  const [icon, setIcon] = useState(category?.icon ?? "Tag");
  const [color, setColor] = useState(category?.color ?? COLOR_OPTIONS[0]);
  const [keywords, setKeywords] = useState<string[]>(category?.rules.map((r) => r.keyword) ?? []);
  const [newKeyword, setNewKeyword] = useState("");
  const [saving, setSaving] = useState(false);

  function addKeyword() {
    const kw = newKeyword.trim();
    if (kw && !keywords.includes(kw)) {
      setKeywords([...keywords, kw]);
    }
    setNewKeyword("");
  }

  function removeKeyword(kw: string) {
    setKeywords(keywords.filter((k) => k !== kw));
  }

  async function handleSave() {
    if (!name.trim()) {
      toast.error("Name is required");
      return;
    }

    setSaving(true);
    try {
      const slug = category?.id ?? name.trim().toLowerCase().replace(/\s+/g, "-");
      const body = {
        id: slug,
        name: name.trim(),
        icon,
        color,
        rules: keywords.map((keyword) => ({ keyword })),
      };

      if (isEdit) {
        await fetch(`/api/categories/${category.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
      } else {
        await fetch("/api/categories", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
      }

      await mutate((key: string) => typeof key === "string" && key.startsWith("/api/"));
      toast.success(isEdit ? "Category updated" : "Category created");
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Category" : "New Category"}</DialogTitle>
          <DialogDescription>
            {isEdit ? "Update category details and rules" : "Create a new spending category"}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Groceries"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Icon</Label>
              <Select value={icon} onValueChange={setIcon}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ICON_OPTIONS.map((i) => (
                    <SelectItem key={i} value={i}>
                      {i}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Color</Label>
              <Select value={color} onValueChange={setColor}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {COLOR_OPTIONS.map((c, i) => (
                    <SelectItem key={c} value={c}>
                      Chart {i + 1}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Keyword Rules</Label>
            <div className="flex gap-2">
              <Input
                value={newKeyword}
                onChange={(e) => setNewKeyword(e.target.value)}
                placeholder="Add keyword..."
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addKeyword();
                  }
                }}
              />
              <Button type="button" variant="secondary" onClick={addKeyword}>
                Add
              </Button>
            </div>
            <div className="flex flex-wrap gap-1">
              {keywords.map((kw) => (
                <Badge key={kw} variant="secondary" className="gap-1">
                  {kw}
                  <button type="button" onClick={() => removeKeyword(kw)}>
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>
          <Button onClick={handleSave} disabled={saving} className="w-full">
            {saving ? "Saving..." : isEdit ? "Update" : "Create"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
