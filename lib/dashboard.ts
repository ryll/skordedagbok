import type { DashboardStats, Harvest } from "@/lib/types";
import { comparisonPeriod } from "@/lib/dates";

function sum(rows: Harvest[], field: "weight_grams" | "quantity"): number {
  return rows.reduce((total, row) => total + Number(row[field]), 0);
}

export function aggregateDashboard(
  current: Harvest[],
  previous: Harvest[],
  filters: { from?: string; to?: string; year?: number } = {},
  today?: string,
): DashboardStats {
  const totalWeightGrams = sum(current, "weight_grams");
  const previousWeightGrams = sum(previous, "weight_grams");
  const monthlyMap = new Map<string, number>();
  const cropMap = new Map<string, { weightGrams: number; quantity: number }>();
  const locationMap = new Map<string, number>();

  for (const row of current) {
    const month = row.harvest_date.slice(0, 7);
    monthlyMap.set(month, (monthlyMap.get(month) ?? 0) + Number(row.weight_grams));
    const crop = [row.crop_type?.name ?? "Okänd gröda", row.variety?.name].filter(Boolean).join(" – ");
    const cropValue = cropMap.get(crop) ?? { weightGrams: 0, quantity: 0 };
    cropValue.weightGrams += Number(row.weight_grams);
    cropValue.quantity += row.quantity;
    cropMap.set(crop, cropValue);
    const location = row.growing_location?.name ?? "Okänd plats";
    locationMap.set(location, (locationMap.get(location) ?? 0) + Number(row.weight_grams));
  }

  return {
    totalWeightGrams,
    totalQuantity: sum(current, "quantity"),
    entryCount: current.length,
    previousWeightGrams,
    weightChangePercent: previousWeightGrams === 0 ? null : ((totalWeightGrams - previousWeightGrams) / previousWeightGrams) * 100,
    monthly: [...monthlyMap].sort(([a], [b]) => a.localeCompare(b)).map(([month, weightGrams]) => ({ month, weightGrams })),
    crops: [...cropMap].map(([name, values]) => ({ name, ...values })).sort((a, b) => b.weightGrams - a.weightGrams),
    locations: [...locationMap].map(([name, weightGrams]) => ({ name, weightGrams })).sort((a, b) => b.weightGrams - a.weightGrams),
    comparisonLabel: comparisonPeriod(filters, today).label,
  };
}
