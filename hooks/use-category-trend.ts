import useSWR from "swr";

export function useCategoryTrend(months = 6) {
  return useSWR<{ month: string; categories: Record<string, number> }[]>(
    `/api/stats/category-trend?months=${months}`,
  );
}
