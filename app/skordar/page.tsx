import Link from "next/link";
import { getHarvests } from "@/lib/data";
import { formatSwedishDate } from "@/lib/dates";
import { formatNumber, formatWeight } from "@/lib/format";

export const dynamic = "force-dynamic";
type Search = Promise<Record<string, string | string[] | undefined>>;

export default async function HarvestsPage({ searchParams }: { searchParams: Search }) {
  const search = await searchParams;
  const page = Math.max(1, Number(typeof search.sida === "string" ? search.sida : 1) || 1);
  let result = { rows: [], count: 0, page, pageSize: 20 } as Awaited<ReturnType<typeof getHarvests>>;
  try { result = await getHarvests(page); } catch { /* setup notice is shown below */ }
  const pages = Math.max(1, Math.ceil(result.count / result.pageSize));
  const message = search.sparad ? "Skörden har sparats." : search.raderad ? "Skörden har raderats permanent." : null;
  return <>
    <section className="hero"><p className="eyebrow">Skördehistorik</p><h1>Alla skördar</h1><p className="lead">Varje liten skörd berättar något om odlingsåret.</p></section>
    {message && <div className="notice" role="status">{message}</div>}
    {!result.rows.length ? <div className="card empty">Inga skördar att visa ännu.</div> : <div className="table-wrap"><table><thead><tr><th>Datum</th><th>Gröda och sort</th><th>Plats</th><th>Antal</th><th>Vikt</th><th>Sådd</th><th>Mått</th><th>Kommentar</th></tr></thead><tbody>
      {result.rows.map((row) => <tr key={row.id}>
        <td data-label="Datum"><Link href={`/skordar/${row.id}`}>{formatSwedishDate(row.harvest_date)}</Link></td>
        <td data-label="Gröda och sort">{row.crop_type?.name}{row.variety ? ` – ${row.variety.name}` : ""}</td><td data-label="Plats">{row.growing_location?.name}</td>
        <td data-label="Antal">{formatNumber(row.quantity)}</td><td data-label="Vikt">{formatWeight(row.weight_grams)}</td><td data-label="Sådd">{row.sowing_date ? formatSwedishDate(row.sowing_date) : "–"}</td>
        <td data-label="Mått">{row.length_cm ? `${formatNumber(row.length_cm)} cm lång` : ""}{row.length_cm && row.circumference_cm ? ", " : ""}{row.circumference_cm ? `${formatNumber(row.circumference_cm)} cm omkrets` : ""}{!row.length_cm && !row.circumference_cm ? "–" : ""}</td><td data-label="Kommentar">{row.comment || "–"}</td>
      </tr>)}</tbody></table></div>}
    <nav className="pagination" aria-label="Sidnavigering">{page > 1 ? <Link className="button secondary" href={`/skordar?sida=${page - 1}`}>← Föregående</Link> : <span />}<span>Sida {page} av {pages}</span>{page < pages ? <Link className="button secondary" href={`/skordar?sida=${page + 1}`}>Nästa →</Link> : <span />}</nav>
  </>;
}
