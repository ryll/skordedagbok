import type { CatalogItem, CropGoal, DashboardFilters, DashboardStats, Harvest } from "@/lib/types";
import { comparisonPeriod } from "@/lib/dates";

function sum(rows: Harvest[], field: "weight_grams" | "quantity"): number {
  return rows.reduce((total, row) => total + Number(row[field]), 0);
}

export function isAnnualGoalView(filters: DashboardFilters): boolean {
  return !filters.from && !filters.to && !filters.varietyId && !filters.growingLocationId;
}

export function aggregateDashboard(
  current: Harvest[],
  previous: Harvest[],
  filters: { from?: string; to?: string; year?: number } = {},
  today?: string,
  goals: CropGoal[] = [],
  crops: CatalogItem[] = [],
): DashboardStats {
  const totalWeightGrams = sum(current, "weight_grams");
  const previousWeightGrams = sum(previous, "weight_grams");
  const monthlyMap = new Map<string, number>();
  const cropMap = new Map<string, {
    id: string;
    name: string;
    weightGrams: number;
    quantity: number;
    goalWeightGrams: number | null;
    varieties: Map<string, { name: string; weightGrams: number; quantity: number }>;
  }>();
  const locationMap = new Map<string, number>();

  for (const row of current) {
    const month = row.harvest_date.slice(0, 7);
    monthlyMap.set(month, (monthlyMap.get(month) ?? 0) + Number(row.weight_grams));
    const cropValue = cropMap.get(row.crop_type_id) ?? {
      id: row.crop_type_id,
      name: row.crop_type?.name ?? "Okänd gröda",
      weightGrams: 0,
      quantity: 0,
      goalWeightGrams: null,
      varieties: new Map(),
    };
    cropValue.weightGrams += Number(row.weight_grams);
    cropValue.quantity += row.quantity;
    const varietyName = row.variety?.name ?? "Utan sort";
    const variety = cropValue.varieties.get(varietyName) ?? { name: varietyName, weightGrams: 0, quantity: 0 };
    variety.weightGrams += Number(row.weight_grams);
    variety.quantity += row.quantity;
    cropValue.varieties.set(varietyName, variety);
    cropMap.set(row.crop_type_id, cropValue);
    const location = row.growing_location?.name ?? "Okänd plats";
    locationMap.set(location, (locationMap.get(location) ?? 0) + Number(row.weight_grams));
  }

  for (const goal of goals) {
    const crop = crops.find((item) => item.id === goal.crop_type_id);
    const cropValue = cropMap.get(goal.crop_type_id) ?? {
      id: goal.crop_type_id,
      name: crop?.name ?? goal.crop_type?.name ?? "Okänd gröda",
      weightGrams: 0,
      quantity: 0,
      goalWeightGrams: null,
      varieties: new Map(),
    };
    cropValue.goalWeightGrams = goal.goal_weight_grams;
    cropMap.set(goal.crop_type_id, cropValue);
  }

  return {
    totalWeightGrams,
    totalQuantity: sum(current, "quantity"),
    entryCount: current.length,
    previousWeightGrams,
    weightChangePercent: previousWeightGrams === 0 ? null : ((totalWeightGrams - previousWeightGrams) / previousWeightGrams) * 100,
    monthly: [...monthlyMap].sort(([a], [b]) => a.localeCompare(b)).map(([month, weightGrams]) => ({ month, weightGrams })),
    crops: [...cropMap.values()].map((crop) => ({
      ...crop,
      varieties: [...crop.varieties.values()].sort((a, b) => b.weightGrams - a.weightGrams),
    })).sort((a, b) => b.weightGrams - a.weightGrams || a.name.localeCompare(b.name, "sv")),
    locations: [...locationMap].map(([name, weightGrams]) => ({ name, weightGrams })).sort((a, b) => b.weightGrams - a.weightGrams),
    comparisonLabel: comparisonPeriod(filters, today).label,
  };
}
