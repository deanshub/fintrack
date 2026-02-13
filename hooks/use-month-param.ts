"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { getCurrentMonth } from "@/lib/format";

export function useMonthParam(): [string, (month: string) => void] {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const defaultMonth = getCurrentMonth();
  const month = searchParams.get("month") ?? defaultMonth;

  const setMonth = useCallback(
    (next: string) => {
      const params = new URLSearchParams(searchParams);
      if (next === defaultMonth) {
        params.delete("month");
      } else {
        params.set("month", next);
      }
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [searchParams, defaultMonth, router, pathname],
  );

  return [month, setMonth];
}
