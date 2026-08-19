import { createClient } from "@/lib/supabase/server";
import { comparisonPeriod } from "@/lib/dates";
import type { CatalogItem, CropGoal, DashboardFilters, Harvest, Variety } from "@/lib/types";

const HARVEST_SELECT = `*, crop_type:crop_types(*), variety:varieties(*), growing_location:growing_locations(*)`;

export async function getCatalogs(includeInactive = false) {
  const supabase = await createClient();
  const cropQuery = supabase.from("crop_types").select("*");
  const varietyQuery = supabase.from("varieties").select("*");
  const locationQuery = supabase.from("growing_locations").select("*");
  const [crops, varieties, locations] = await Promise.all([
    (includeInactive ? cropQuery : cropQuery.eq("active", true)).order("name"),
    (includeInactive ? varietyQuery : varietyQuery.eq("active", true)).order("name"),
    (includeInactive ? locationQuery : locationQuery.eq("active", true)).order("name"),
  ]);
  for (const result of [crops, varieties, locations]) if (result.error) throw result.error;
  return {
    crops: (crops.data ?? []) as CatalogItem[],
    varieties: (varieties.data ?? []) as Variety[],
    locations: (locations.data ?? []) as CatalogItem[],
  };
}

export async function getHarvestYears() {
  const supabase = await createClient();
  const years = new Set<number>();
  const pageSize = 1000;

  const { data: goals, error: goalsError } = await supabase.from("crop_goals").select("year");
  // Harvest statistics should remain available while a new optional migration is pending.
  if (goalsError && goalsError.code !== "PGRST205") throw goalsError;
  for (const goal of goals ?? []) years.add(Number(goal.year));

  for (let from = 0; ; from += pageSize) {
    const { data, error } = await supabase.from("harvests").select("harvest_date")
      .order("harvest_date", { ascending: false }).range(from, from + pageSize - 1);
    if (error) throw error;

    const rows = data ?? [];
    for (const row of rows) years.add(Number(row.harvest_date.slice(0, 4)));
    if (rows.length < pageSize) break;
  }

  return [...years].sort((a, b) => b - a);
}

export async function getCropGoals(year: number) {
  const supabase = await createClient();
  const { data, error } = await supabase.from("crop_goals").select("crop_type_id, year, goal_weight_grams, crop_type:crop_types(name)").eq("year", year);
  if (error) throw error;
  return (data ?? []).map((goal) => ({
    crop_type_id: String(goal.crop_type_id),
    year: Number(goal.year),
    goal_weight_grams: Number(goal.goal_weight_grams),
    crop_type: Array.isArray(goal.crop_type) ? goal.crop_type[0] : goal.crop_type,
  })) as CropGoal[];
}

export async function getDashboardRows(filters: DashboardFilters, today?: string) {
  const supabase = await createClient();
  const period = comparisonPeriod(filters, today);
  let currentQuery = supabase.from("harvests").select(HARVEST_SELECT).gte("harvest_date", period.currentFrom).lte("harvest_date", period.currentTo);
  let previousQuery = supabase.from("harvests").select(HARVEST_SELECT).gte("harvest_date", period.previousFrom).lte("harvest_date", period.previousTo);
  if (filters.cropTypeId) { currentQuery = currentQuery.eq("crop_type_id", filters.cropTypeId); previousQuery = previousQuery.eq("crop_type_id", filters.cropTypeId); }
  if (filters.varietyId) { currentQuery = currentQuery.eq("variety_id", filters.varietyId); previousQuery = previousQuery.eq("variety_id", filters.varietyId); }
  if (filters.growingLocationId) { currentQuery = currentQuery.eq("growing_location_id", filters.growingLocationId); previousQuery = previousQuery.eq("growing_location_id", filters.growingLocationId); }
  const [current, previous] = await Promise.all([
    currentQuery,
    previousQuery,
  ]);
  if (current.error) throw current.error;
  if (previous.error) throw previous.error;
  return { current: (current.data ?? []) as unknown as Harvest[], previous: (previous.data ?? []) as unknown as Harvest[] };
}

export async function getHarvests(page = 1, pageSize = 20) {
  const supabase = await createClient();
  const from = (page - 1) * pageSize;
  const { data, count, error } = await supabase.from("harvests").select(HARVEST_SELECT, { count: "exact" })
    .order("harvest_date", { ascending: false }).order("created_at", { ascending: false }).range(from, from + pageSize - 1);
  if (error) throw error;
  return { rows: (data ?? []) as unknown as Harvest[], count: count ?? 0, page, pageSize };
}

export async function getHarvest(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.from("harvests").select(HARVEST_SELECT).eq("id", id).single();
  if (error) return null;
  return data as unknown as Harvest;
}

export async function getUser() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  } catch { return null; }
}
