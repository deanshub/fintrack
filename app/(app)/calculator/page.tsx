"use client";

import {
  differenceInCalendarDays,
  format,
  formatDistanceToNow,
  isBefore,
  parse,
  startOfDay,
} from "date-fns";
import { toPng } from "html-to-image";
import {
  ArrowDown,
  ArrowUp,
  Check,
  CircleCheck,
  Clock,
  Download,
  FileJson,
  Image,
  Pencil,
  Plus,
  Trash2,
  TrendingDown,
  TrendingUp,
  Upload,
  Wallet,
} from "lucide-react";
import { Suspense, useRef, useState } from "react";
import useSWR, { useSWRConfig } from "swr";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { formatCurrency, formatDate } from "@/lib/format";
import type { FinanceItem } from "@/lib/types";

const API = "/api/calculator";

const COLORS = {
  green: "#059669",
  amber: "#f59e0b",
  red: "#ef4444",
  greenBg: "rgba(5, 150, 105, 0.08)",
  amberBg: "rgba(245, 158, 11, 0.08)",
  redBg: "rgba(239, 68, 68, 0.08)",
} as const;

interface ItemFormState {
  open: boolean;
  type: "source" | "expense";
  editItem?: FinanceItem;
}

function useItemStatus(item: FinanceItem) {
  const today = startOfDay(new Date());
  const parsedDate = item.date ? parse(item.date, "yyyy-MM-dd", new Date()) : null;
  const arrived = !parsedDate || !isBefore(today, startOfDay(parsedDate));
  const daysUntil = parsedDate && !arrived ? differenceInCalendarDays(parsedDate, today) : 0;
  const color = arrived ? COLORS.green : daysUntil <= 7 ? COLORS.amber : COLORS.red;
  return { parsedDate, arrived, daysUntil, color };
}

function ItemFormDialog({ state, onClose }: { state: ItemFormState; onClose: () => void }) {
  const { mutate } = useSWRConfig();
  const [label, setLabel] = useState(state.editItem?.label ?? "");
  const [amount, setAmount] = useState(
    state.editItem ? (state.editItem.amount / 100).toString() : "",
  );
  const [available, setAvailable] = useState(state.editItem ? !state.editItem.date : false);
  const [date, setDate] = useState(state.editItem?.date ?? "");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    const amountAgorot = Math.round(Number.parseFloat(amount) * 100);
    const dateValue = available ? undefined : date || undefined;

    if (state.editItem) {
      const updated = { ...state.editItem, label, amount: amountAgorot, date: dateValue };
      await fetch(API, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated),
      });
    } else {
      await fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label, amount: amountAgorot, type: state.type, date: dateValue }),
      });
    }

    await mutate(API);
    onClose();
  }

  return (
    <Dialog open={state.open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {state.editItem ? "Edit" : "Add"} {state.type === "source" ? "Source" : "Cost"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="calc-label">Label</Label>
              <Input
                id="calc-label"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder={
                  state.type === "source" ? "e.g. Checking Account" : "e.g. House Payment"
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="calc-amount">Amount (₪)</Label>
              <Input
                id="calc-amount"
                type="number"
                step="0.01"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                required
              />
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="calc-available"
                checked={available}
                onCheckedChange={(v) => setAvailable(v === true)}
              />
              <Label htmlFor="calc-available">Already available</Label>
            </div>
            {!available && (
              <div className="space-y-2">
                <Label htmlFor="calc-date">Expected date</Label>
                <Input
                  id="calc-date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ItemCard({
  item,
  onEdit,
  onDelete,
  onMarkAvailable,
}: {
  item: FinanceItem;
  onEdit: () => void;
  onDelete: () => void;
  onMarkAvailable: () => void;
}) {
  const { parsedDate, arrived, daysUntil, color } = useItemStatus(item);

  return (
    <div
      className="group flex items-center gap-3 rounded-lg border px-3 py-2.5 transition-colors hover:bg-accent/50"
      style={{ borderLeftWidth: 3, borderLeftColor: color }}
    >
      <div className="min-w-0 flex-1">
        <p className="font-medium truncate">{item.label}</p>
        <p className="text-sm text-muted-foreground mt-0.5">{formatCurrency(item.amount)}</p>
      </div>
      {parsedDate ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge
              variant="secondary"
              className="shrink-0 gap-1 font-normal"
              style={{
                color,
                backgroundColor: arrived
                  ? COLORS.greenBg
                  : daysUntil <= 7
                    ? COLORS.amberBg
                    : COLORS.redBg,
              }}
            >
              {arrived ? <Check className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
              {arrived ? "Available" : `in ${formatDistanceToNow(parsedDate)}`}
            </Badge>
          </TooltipTrigger>
          <TooltipContent>{formatDate(item.date!)}</TooltipContent>
        </Tooltip>
      ) : (
        <Badge
          variant="secondary"
          className="shrink-0 gap-1 font-normal"
          style={{ color: COLORS.green, backgroundColor: COLORS.greenBg }}
        >
          <Check className="h-3 w-3" />
          Available
        </Badge>
      )}
      <div className="flex gap-0.5">
        {!arrived && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onMarkAvailable}>
                <CircleCheck className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Mark as available</TooltipContent>
          </Tooltip>
        )}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onEdit}>
              <Pencil className="h-3.5 w-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Edit</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onDelete}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Delete</TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
}

function TimelineRow({
  dotColor,
  isLast,
  left,
  right,
}: {
  dotColor: string;
  isLast: boolean;
  left: React.ReactNode;
  right: React.ReactNode;
}) {
  return (
    <div className="flex gap-3 text-sm">
      <div className="flex flex-col items-center">
        <div className="h-3 w-3 rounded-full shrink-0 mt-1" style={{ backgroundColor: dotColor }} />
        {!isLast && (
          <div
            className="flex-1 my-1 rounded-full"
            style={{ width: 3, backgroundColor: "#d1d5db" }}
          />
        )}
      </div>
      <div className="flex-1 min-w-0 pb-4">{left}</div>
      <div className="shrink-0 pt-0.5">{right}</div>
    </div>
  );
}

function CalculatorContent() {
  const { data: items } = useSWR<FinanceItem[]>(API);
  const { mutate } = useSWRConfig();
  const [formState, setFormState] = useState<ItemFormState | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<FinanceItem | null>(null);
  const [importData, setImportData] = useState<FinanceItem[] | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);

  if (!items) return null;

  const sortByDate = (a: FinanceItem, b: FinanceItem) => (a.date ?? "").localeCompare(b.date ?? "");
  const sources = items.filter((i) => i.type === "source").sort(sortByDate);
  const expenses = items.filter((i) => i.type === "expense").sort(sortByDate);

  const totalSources = sources.reduce((sum, i) => sum + i.amount, 0);
  const totalExpenses = expenses.reduce((sum, i) => sum + i.amount, 0);
  const net = totalSources - totalExpenses;

  async function handleMarkAvailable(item: FinanceItem) {
    await fetch(API, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...item, date: undefined }),
    });
    await mutate(API);
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    await fetch(API, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: deleteTarget.id }),
    });
    await mutate(API);
    setDeleteTarget(null);
  }

  function handleExport() {
    const blob = new Blob([JSON.stringify(items, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `calculator-${format(new Date(), "yyyy-MM-dd")}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      setImportData(JSON.parse(text) as FinanceItem[]);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function confirmImport() {
    if (!importData) return;
    await fetch(API, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(importData),
    });
    await mutate(API);
    setImportData(null);
  }

  function exportTimelineJson() {
    if (!items) return;
    const allSorted = [...items].sort(sortByDate);
    const available = allSorted.filter((i) => !i.date);
    const future = allSorted.filter((i) => i.date);

    let balance = available.reduce((s, i) => s + (i.type === "source" ? i.amount : -i.amount), 0);
    const timeline: {
      label: string;
      type: string;
      amount: number;
      date: string | null;
      balance: number;
    }[] = [];

    if (available.length > 0) {
      timeline.push({
        label: "Available now",
        type: "group",
        amount: balance,
        date: null,
        balance,
      });
    }
    for (const item of future) {
      balance += item.type === "source" ? item.amount : -item.amount;
      timeline.push({
        label: item.label,
        type: item.type,
        amount: item.amount,
        date: item.date!,
        balance,
      });
    }

    const blob = new Blob([JSON.stringify(timeline, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `timeline-${format(new Date(), "yyyy-MM-dd")}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function exportTimelinePng() {
    if (!timelineRef.current) return;
    const dataUrl = await toPng(timelineRef.current, { backgroundColor: "#ffffff", pixelRatio: 2 });
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = `timeline-${format(new Date(), "yyyy-MM-dd")}.png`;
    a.click();
  }

  function renderSection(title: string, type: "source" | "expense", list: FinanceItem[]) {
    const color = type === "source" ? COLORS.green : COLORS.red;
    const icon =
      type === "source" ? (
        <TrendingUp className="h-4 w-4" style={{ color }} />
      ) : (
        <TrendingDown className="h-4 w-4" style={{ color }} />
      );
    const total = list.reduce((sum, i) => sum + i.amount, 0);
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <div className="flex items-center gap-2">
            {icon}
            <CardTitle className="text-base">{title}</CardTitle>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="h-8"
            onClick={() => setFormState({ open: true, type })}
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            Add
          </Button>
        </CardHeader>
        <CardContent>
          {list.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="rounded-full bg-muted p-3 mb-3">
                {type === "source" ? (
                  <TrendingUp className="h-5 w-5 text-muted-foreground" />
                ) : (
                  <TrendingDown className="h-5 w-5 text-muted-foreground" />
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                No {type === "source" ? "sources" : "costs"} added yet
              </p>
              <Button
                variant="link"
                size="sm"
                className="mt-1 text-xs"
                onClick={() => setFormState({ open: true, type })}
              >
                Add your first {type === "source" ? "source" : "cost"}
              </Button>
            </div>
          ) : (
            <>
              <div className="space-y-1.5">
                {list.map((item) => (
                  <ItemCard
                    key={item.id}
                    item={item}
                    onEdit={() => setFormState({ open: true, type: item.type, editItem: item })}
                    onDelete={() => setDeleteTarget(item)}
                    onMarkAvailable={() => handleMarkAvailable(item)}
                  />
                ))}
              </div>
              <div className="flex justify-between items-center border-t mt-3 pt-3 px-1">
                <span className="text-sm text-muted-foreground">Total</span>
                <span className="font-semibold tabular-nums" style={{ color }}>
                  {formatCurrency(total)}
                </span>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    );
  }

  const allSorted = [...items].sort(sortByDate);
  const availableNow = allSorted.filter((i) => !i.date);
  const dated = allSorted.filter((i) => i.date);
  const hasTimeline = availableNow.length > 0 || dated.length > 0;

  let runningBalance = availableNow.reduce(
    (sum, i) => sum + (i.type === "source" ? i.amount : -i.amount),
    0,
  );

  return (
    <>
      {/* Actions */}
      <div className="flex gap-2 justify-end -mt-2">
        <Button variant="outline" size="sm" onClick={handleExport}>
          <Download className="h-3.5 w-3.5 mr-1" />
          Export
        </Button>
        <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
          <Upload className="h-3.5 w-3.5 mr-1" />
          Import
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          className="hidden"
          onChange={handleFileSelect}
        />
      </div>

      {/* Summary row */}
      <Card>
        <CardContent className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 py-3">
          <div className="flex items-center gap-1.5">
            <TrendingUp className="h-3.5 w-3.5 shrink-0" style={{ color: COLORS.green }} />
            <span className="text-xs text-muted-foreground">Sources</span>
            <span className="font-semibold tabular-nums text-sm" style={{ color: COLORS.green }}>
              {formatCurrency(totalSources)}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <TrendingDown className="h-3.5 w-3.5 shrink-0" style={{ color: COLORS.red }} />
            <span className="text-xs text-muted-foreground">Costs</span>
            <span className="font-semibold tabular-nums text-sm" style={{ color: COLORS.red }}>
              {formatCurrency(totalExpenses)}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <Wallet className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Net</span>
            <span
              className="font-semibold tabular-nums text-sm"
              style={{ color: net >= 0 ? COLORS.green : COLORS.red }}
            >
              {formatCurrency(net)}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Items */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {renderSection("Sources of Finance", "source", sources)}
        {renderSection("Costs & Expenses", "expense", expenses)}
      </div>

      {/* Timeline */}
      {hasTimeline && (
        <Card>
          <CardHeader className="flex flex-row items-start justify-between space-y-0">
            <div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <CardTitle className="text-base">Payment Timeline</CardTitle>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Running balance as items become available
              </p>
            </div>
            <div className="flex gap-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={exportTimelineJson}
                  >
                    <FileJson className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Export as JSON</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={exportTimelinePng}
                  >
                    <Image className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Export as PNG</TooltipContent>
              </Tooltip>
            </div>
          </CardHeader>
          <CardContent ref={timelineRef}>
            {availableNow.length > 0 && (
              <TimelineRow
                dotColor={COLORS.green}
                isLast={dated.length === 0}
                left={
                  <>
                    <p className="font-medium">Available now</p>
                    <p className="text-muted-foreground text-xs mt-0.5">
                      {availableNow.map((i) => i.label).join(", ")}
                    </p>
                  </>
                }
                right={
                  <span
                    className="font-medium tabular-nums text-sm"
                    style={{ color: runningBalance >= 0 ? COLORS.green : COLORS.red }}
                  >
                    {formatCurrency(runningBalance)}
                  </span>
                }
              />
            )}
            {dated.map((item, idx) => {
              runningBalance += item.type === "source" ? item.amount : -item.amount;
              const isSource = item.type === "source";
              const parsedDate = parse(item.date!, "yyyy-MM-dd", new Date());
              const today = startOfDay(new Date());
              const arrived = !isBefore(today, startOfDay(parsedDate));
              const isLast = idx === dated.length - 1;

              return (
                <TimelineRow
                  key={item.id}
                  dotColor={arrived ? COLORS.green : COLORS.amber}
                  isLast={isLast}
                  left={
                    <>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {isSource ? (
                          <ArrowUp
                            className="h-3.5 w-3.5 shrink-0"
                            style={{ color: COLORS.green }}
                          />
                        ) : (
                          <ArrowDown
                            className="h-3.5 w-3.5 shrink-0"
                            style={{ color: COLORS.red }}
                          />
                        )}
                        <span className="font-medium">{item.label}</span>
                        <span className="text-muted-foreground text-xs">
                          {isSource ? "+" : "−"}
                          {formatCurrency(item.amount)}
                        </span>
                      </div>
                      <p className="text-muted-foreground text-xs mt-0.5">
                        {format(parsedDate, "d MMM yyyy")}
                        {!arrived && (
                          <span style={{ color: COLORS.amber }}>
                            {" "}
                            · in {formatDistanceToNow(parsedDate)}
                          </span>
                        )}
                      </p>
                    </>
                  }
                  right={
                    <span
                      className="font-medium tabular-nums text-sm"
                      style={{ color: runningBalance >= 0 ? COLORS.green : COLORS.red }}
                    >
                      {formatCurrency(runningBalance)}
                    </span>
                  }
                />
              );
            })}
          </CardContent>
        </Card>
      )}

      {formState && <ItemFormDialog state={formState} onClose={() => setFormState(null)} />}

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete item</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{deleteTarget?.label}&quot;?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!importData} onOpenChange={(open) => !open && setImportData(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Import data</AlertDialogTitle>
            <AlertDialogDescription>
              This will replace all existing items with {importData?.length ?? 0} imported item
              {importData?.length !== 1 ? "s" : ""}. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmImport}>Replace all</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export default function CalculatorPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Calculator</h1>
      <Suspense
        fallback={
          <div className="space-y-6">
            <Skeleton className="h-12" />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Skeleton className="h-64" />
              <Skeleton className="h-64" />
            </div>
            <Skeleton className="h-48" />
          </div>
        }
      >
        <CalculatorContent />
      </Suspense>
    </div>
  );
}
