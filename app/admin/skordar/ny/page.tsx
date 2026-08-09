import HarvestForm from "@/components/harvest-form";
import { getCatalogs } from "@/lib/data";

export const dynamic = "force-dynamic";
export default async function NewHarvestPage() {
  const catalogs = await getCatalogs();
  return <><section className="hero"><p className="eyebrow">Registrera</p><h1>Ny skörd</h1></section><HarvestForm {...catalogs} /></>;
}
