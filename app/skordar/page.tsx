import Link from "next/link";
import HarvestFilters from "@/components/harvest-filters";
import { getCatalogs, getHarvests, getHarvestYears } from "@/lib/data";
import { formatSwedishDate } from "@/lib/dates";
import { formatNumber, formatWeight } from "@/lib/format";
import type { HarvestListFilters } from "@/lib/types";

export const dynamic = "force-dynamic";
type Search = Promise<Record<string, string | string[] | undefined>>;
const value = (entry: string | string[] | undefined) => typeof entry === "string" && entry.trim() !== "" ? entry.trim() : undefined;

function buildPageUrl(page: number, filters: Record<string, string | undefined>): string {
  const params = new URLSearchParams();
  for (const [key, val] of Object.entries(filters)) {
    if (val) params.set(key, val);
  }
  if (page > 1) params.set("sida", String(page));
  const query = params.toString();
  return `/skordar${query ? `?${query}` : ""}`;
}

export default async function HarvestsPage({ searchParams }: { searchParams: Search }) {
  const search = await searchParams;
  const page = Math.max(1, Number(value(search.sida)) || 1);
  const requestedYear = Number(value(search.ar));
  const filterYear = Number.isInteger(requestedYear) && requestedYear > 0 ? requestedYear : undefined;
  const filterCropTypeId = value(search.groda);
  const filterVarietyId = value(search.sort);
  const filterLocationId = value(search.plats);

  const filters: HarvestListFilters = {
    year: filterYear,
    cropTypeId: filterCropTypeId,
    varietyId: filterVarietyId,
    growingLocationId: filterLocationId,
  };

  const hasActiveFilters = Boolean(filterYear || filterCropTypeId || filterVarietyId || filterLocationId);

  let catalogs: Awaited<ReturnType<typeof getCatalogs>> = { crops: [], varieties: [], locations: [] };
  let years: number[] = [];
  let result = { rows: [], count: 0, page, pageSize: 20 } as Awaited<ReturnType<typeof getHarvests>>;

  try {
    const [loadedCatalogs, loadedYears, loadedHarvests] = await Promise.all([
      getCatalogs(true),
      getHarvestYears(),
      getHarvests(filters, page),
    ]);
    catalogs = loadedCatalogs;
    years = loadedYears;
    result = loadedHarvests;
  } catch {
    /* database setup notice handled gracefully */
  }

  const pages = Math.max(1, Math.ceil(result.count / result.pageSize));
  const message = search.sparad ? "Skörden har sparats." : search.raderad ? "Skörden har raderats permanent." : null;

  const activeUrlParams = {
    ar: filterYear ? String(filterYear) : undefined,
    groda: filterCropTypeId,
    sort: filterVarietyId,
    plats: filterLocationId,
  };

  return <>
    <section className="hero">
      <p className="eyebrow">Skördehistorik</p>
      <h1>Alla skördar</h1>
      <p className="lead">Varje liten skörd berättar något om odlingsåret.</p>
    </section>
    {message && <div className="notice" role="status">{message}</div>}
    <HarvestFilters
      years={years}
      crops={catalogs.crops}
      varieties={catalogs.varieties}
      locations={catalogs.locations}
      initialYear={filterYear}
      initialCropTypeId={filterCropTypeId}
      initialVarietyId={filterVarietyId}
      initialLocationId={filterLocationId}
    />
    {!result.rows.length ? (
      <div className="card empty">
        <p>{hasActiveFilters ? "Inga skördar matchade filtreringen." : "Inga skördar att visa ännu."}</p>
        {hasActiveFilters && (
          <div style={{ marginTop: "1rem" }}>
            <Link className="button secondary" href="/skordar">Rensa filter</Link>
          </div>
        )}
      </div>
    ) : (
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Datum</th>
              <th>Gröda och sort</th>
              <th>Plats</th>
              <th>Antal</th>
              <th>Vikt</th>
              <th>Sådd</th>
              <th>Mått</th>
              <th>Kommentar</th>
            </tr>
          </thead>
          <tbody>
            {result.rows.map((row) => (
              <tr key={row.id}>
                <td data-label="Datum"><Link href={`/skordar/${row.id}`}>{formatSwedishDate(row.harvest_date)}</Link></td>
                <td data-label="Gröda och sort">{row.crop_type?.name}{row.variety ? ` – ${row.variety.name}` : ""}</td>
                <td data-label="Plats">{row.growing_location?.name}</td>
                <td data-label="Antal">{formatNumber(row.quantity)}</td>
                <td data-label="Vikt">{formatWeight(row.weight_grams)}</td>
                <td data-label="Sådd">{row.sowing_date ? formatSwedishDate(row.sowing_date) : "–"}</td>
                <td data-label="Mått">
                  {row.length_cm ? `${formatNumber(row.length_cm)} cm lång` : ""}
                  {row.length_cm && row.circumference_cm ? ", " : ""}
                  {row.circumference_cm ? `${formatNumber(row.circumference_cm)} cm omkrets` : ""}
                  {!row.length_cm && !row.circumference_cm ? "–" : ""}
                </td>
                <td data-label="Kommentar">{row.comment || "–"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )}
    {pages > 1 && (
      <nav className="pagination" aria-label="Sidnavigering">
        {page > 1 ? <Link className="button secondary" href={buildPageUrl(page - 1, activeUrlParams)}>← Föregående</Link> : <span />}
        <span>Sida {page} av {pages} ({formatNumber(result.count)} {result.count === 1 ? "skörd" : "skördar"})</span>
        {page < pages ? <Link className="button secondary" href={buildPageUrl(page + 1, activeUrlParams)}>Nästa →</Link> : <span />}
      </nav>
    )}
  </>;
}
