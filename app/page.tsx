import Link from "next/link";
import { aggregateDashboard } from "@/lib/dashboard";
import { getCatalogs, getDashboardRows, getHarvestYears } from "@/lib/data";
import { formatNumber, formatWeight } from "@/lib/format";
import type { DashboardFilters } from "@/lib/types";
import DashboardChart from "@/components/dashboard-chart";
import DashboardPeriodFilters from "@/components/dashboard-period-filters";
import { monthPeriod, todayInStockholm } from "@/lib/dates";

export const dynamic = "force-dynamic";

type Search = Promise<Record<string, string | string[] | undefined>>;
const value = (entry: string | string[] | undefined) => typeof entry === "string" ? entry : undefined;

export default async function DashboardPage({ searchParams }: { searchParams: Search }) {
  const search = await searchParams;
  const currentYear = Number(todayInStockholm().slice(0, 4));
  const requestedYear = Number(value(search.ar));
  const requestedMonth = value(search.manad) ?? "";
  const selectedMonth = /^(0[1-9]|1[0-2])$/.test(requestedMonth) ? requestedMonth : "";
  let catalogs: Awaited<ReturnType<typeof getCatalogs>> = { crops: [], varieties: [], locations: [] };
  let availableYears = [currentYear];
  let setupError = false;
  try {
    const [loadedCatalogs, loadedYears] = await Promise.all([getCatalogs(), getHarvestYears()]);
    catalogs = loadedCatalogs;
    if (loadedYears.length) availableYears = loadedYears;
  } catch {
    setupError = true;
  }
  const defaultYear = availableYears.includes(currentYear) ? currentYear : availableYears[0];
  const selectedYear = availableYears.includes(requestedYear) ? requestedYear : defaultYear;
  const selectedMonthPeriod = selectedMonth ? monthPeriod(selectedYear, Number(selectedMonth)) : undefined;
  const filters: DashboardFilters = {
    from: selectedMonthPeriod?.from ?? value(search.fran), to: selectedMonthPeriod?.to ?? value(search.till), year: selectedYear,
    cropTypeId: value(search.groda), varietyId: value(search.sort), growingLocationId: value(search.plats),
  };
  let stats;
  if (!setupError) try {
    const rows = await getDashboardRows(filters);
    stats = aggregateDashboard(rows.current, rows.previous, filters);
  } catch {
    stats = aggregateDashboard([], [], filters);
    setupError = true;
  } else stats = aggregateDashboard([], [], filters);
  const maxMonth = Math.max(1, ...stats.monthly.map((row) => row.weightGrams));
  return <>
    <h1 className="page-title">Översikt</h1>
    {setupError && <div className="notice">Anslut Supabase i <code>.env.local</code> för att visa skördedata. <Link href="/installning">Läs installationsguiden.</Link></div>}
    <form className="card filters" aria-label="Filtrera statistik" autoComplete="off" data-form-type="other">
      <DashboardPeriodFilters key={`${selectedYear}-${selectedMonth}-${filters.from}-${filters.to}`} availableYears={availableYears} initialYear={selectedYear} initialMonth={selectedMonth} initialFrom={filters.from} initialTo={filters.to} />
      <div className="filter-row filter-catalogs">
        <div className="field"><label htmlFor="groda">Gröda</label><select id="groda" name="groda" defaultValue={filters.cropTypeId ?? ""}><option value="">Alla</option>{catalogs.crops.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}</select></div>
        <div className="field"><label htmlFor="sort">Sort</label><select id="sort" name="sort" defaultValue={filters.varietyId ?? ""}><option value="">Alla</option>{catalogs.varieties.filter((item) => !filters.cropTypeId || item.crop_type_id === filters.cropTypeId).map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}</select></div>
        <div className="field"><label htmlFor="plats">Plats</label><select id="plats" name="plats" defaultValue={filters.growingLocationId ?? ""}><option value="">Alla</option>{catalogs.locations.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}</select></div>
        <button type="submit">Visa</button>
      </div>
    </form>
    <section className="grid stats" aria-label="Summering">
      <article className="card stat"><span>Total vikt</span><strong>{formatWeight(stats.totalWeightGrams)}</strong><small>{stats.weightChangePercent === null ? "Ingen jämförelsedata" : `${stats.weightChangePercent >= 0 ? "+" : ""}${formatNumber(stats.weightChangePercent)} % mot ${stats.comparisonLabel}`}</small></article>
      <article className="card stat"><span>Skördat antal</span><strong>{formatNumber(stats.totalQuantity)}</strong><small>frukter, blad och knippen</small></article>
      <article className="card stat"><span>Anteckningar</span><strong>{formatNumber(stats.entryCount)}</strong><small>registrerade skördar</small></article>
    </section>
    <section className="grid dashboard-grid">
      <article className="card"><h2>Månad för månad</h2>{stats.monthly.length ? <div className="chart">{stats.monthly.map((row) => <div className="bar-row" key={row.month}><span>{new Intl.DateTimeFormat("sv-SE", { month: "short", year: "numeric" }).format(new Date(`${row.month}-15`))}</span><div className="bar-track"><div className="bar" style={{ width: `${row.weightGrams / maxMonth * 100}%` }} /></div><strong>{formatWeight(row.weightGrams)}</strong></div>)}</div> : <p className="empty">Ingen skörd under perioden</p>}</article>
      <article className="card"><h2>Odlingsplatser</h2><DashboardChart rows={stats.locations} /></article>
      <article className="card span-2"><h2>Grödor och sorter</h2><DashboardChart rows={stats.crops} /></article>
    </section>
  </>;
}
