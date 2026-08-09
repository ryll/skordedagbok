import Link from "next/link";
import { notFound } from "next/navigation";
import { deleteHarvest } from "@/app/actions";
import DeleteHarvestButton from "@/components/delete-harvest-button";
import { getHarvest, getUser } from "@/lib/data";
import { formatSwedishDate } from "@/lib/dates";
import { formatNumber, formatWeight } from "@/lib/format";

export const dynamic = "force-dynamic";
export default async function HarvestDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const harvest = await getHarvest(id);
  if (!harvest) notFound();
  const user = await getUser();
  return <><section className="hero"><p className="eyebrow">{formatSwedishDate(harvest.harvest_date)}</p><h1>{harvest.crop_type?.name}{harvest.variety ? ` – ${harvest.variety.name}` : ""}</h1></section>
    <article className="card"><dl className="grid detail-grid">
      <div><dt>Odlingsplats</dt><dd>{harvest.growing_location?.name}</dd></div><div><dt>Antal</dt><dd>{formatNumber(harvest.quantity)}</dd></div><div><dt>Vikt</dt><dd>{formatWeight(harvest.weight_grams)}</dd></div>
      <div><dt>Sådatum</dt><dd>{harvest.sowing_date ? formatSwedishDate(harvest.sowing_date) : "Inte angivet"}</dd></div><div><dt>Längd</dt><dd>{harvest.length_cm ? `${formatNumber(harvest.length_cm)} cm` : "Inte angivet"}</dd></div><div><dt>Omkrets</dt><dd>{harvest.circumference_cm ? `${formatNumber(harvest.circumference_cm)} cm` : "Inte angivet"}</dd></div>
      <div className="span-2"><dt>Kommentar</dt><dd>{harvest.comment || "Ingen kommentar"}</dd></div>
    </dl>{user && <div className="actions"><Link className="button secondary" href={`/admin/skordar/${id}`}>Redigera</Link><form action={deleteHarvest}><input type="hidden" name="id" value={id} /><DeleteHarvestButton /></form></div>}</article>
  </>;
}
