import { notFound } from "next/navigation";
import HarvestForm from "@/components/harvest-form";
import { getCatalogs, getHarvest } from "@/lib/data";

export const dynamic = "force-dynamic";
export default async function EditHarvestPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [harvest, catalogs] = await Promise.all([getHarvest(id), getCatalogs(true)]);
  if (!harvest) notFound();
  return <><section className="hero"><p className="eyebrow">Redigera</p><h1>Ändra skörd</h1></section><HarvestForm harvest={harvest} {...catalogs} /></>;
}
