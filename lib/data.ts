import { createClient } from "@/lib/supabase/server";
import { comparisonPeriod } from "@/lib/dates";
import type { CatalogItem, CropGoal, DashboardFilters, Harvest, HarvestListFilters, Variety } from "@/lib/types";

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

  const [goalsRes, earliestRes, latestRes] = await Promise.all([
    supabase.from("crop_goals").select("year"),
    supabase.from("harvests").select("harvest_date").order("harvest_date", { ascending: true }).limit(1).maybeSingle(),
    supabase.from("harvests").select("harvest_date").order("harvest_date", { ascending: false }).limit(1).maybeSingle(),
  ]);

  // Harvest statistics should remain available while a new optional migration is pending.
  if (goalsRes.error && goalsRes.error.code !== "PGRST205") throw goalsRes.error;
  for (const goal of goalsRes.data ?? []) years.add(Number(goal.year));

  if (earliestRes.error) throw earliestRes.error;
  if (latestRes.error) throw latestRes.error;

  if (earliestRes.data && latestRes.data) {
    const minYear = Number(earliestRes.data.harvest_date.slice(0, 4));
    const maxYear = Number(latestRes.data.harvest_date.slice(0, 4));
    for (let y = minYear; y <= maxYear; y++) {
      years.add(y);
    }
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

const DASHBOARD_HARVEST_SELECT = "id, harvest_date, crop_type_id, variety_id, growing_location_id, quantity, weight_grams, crop_type:crop_types(id, name), variety:varieties(id, name), growing_location:growing_locations(id, name)";

async function fetchAllHarvestsForPeriod(
  supabase: Awaited<ReturnType<typeof createClient>>,
  from: string,
  to: string,
  filters: DashboardFilters,
  select = DASHBOARD_HARVEST_SELECT,
) {
  const pageSize = 1000;
  const allRows: Harvest[] = [];

  for (let offset = 0; ; offset += pageSize) {
    let query = supabase.from("harvests").select(select)
      .gte("harvest_date", from)
      .lte("harvest_date", to);

    if (filters.cropTypeId) query = query.eq("crop_type_id", filters.cropTypeId);
    if (filters.varietyId) query = query.eq("variety_id", filters.varietyId);
    if (filters.growingLocationId) query = query.eq("growing_location_id", filters.growingLocationId);

    const { data, error } = await query
      .order("harvest_date", { ascending: true })
      .range(offset, offset + pageSize - 1);

    if (error) throw error;
    const rows = (data ?? []) as unknown as Harvest[];
    allRows.push(...rows);
    if (rows.length < pageSize) break;
  }

  return allRows;
}

export async function getDashboardRows(filters: DashboardFilters, today?: string) {
  const supabase = await createClient();
  const period = comparisonPeriod(filters, today);
  const [current, previous] = await Promise.all([
    fetchAllHarvestsForPeriod(supabase, period.currentFrom, period.currentTo, filters),
    fetchAllHarvestsForPeriod(supabase, period.previousFrom, period.previousTo, filters, "weight_grams"),
  ]);
  return { current, previous };
}

export async function getHarvests(filters: HarvestListFilters = {}, page = 1, pageSize = 20) {
  const supabase = await createClient();
  const from = (page - 1) * pageSize;
  let query = supabase.from("harvests").select(HARVEST_SELECT, { count: "exact" });

  if (filters.year) {
    query = query.gte("harvest_date", `${filters.year}-01-01`).lte("harvest_date", `${filters.year}-12-31`);
  }
  if (filters.cropTypeId) {
    query = query.eq("crop_type_id", filters.cropTypeId);
  }
  if (filters.varietyId) {
    query = query.eq("variety_id", filters.varietyId);
  }
  if (filters.growingLocationId) {
    query = query.eq("growing_location_id", filters.growingLocationId);
  }

  const { data, count, error } = await query
    .order("harvest_date", { ascending: false })
    .order("created_at", { ascending: false })
    .range(from, from + pageSize - 1);
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
