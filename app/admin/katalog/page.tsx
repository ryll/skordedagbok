import CatalogManager from "@/components/catalog-manager";
import { getCatalogs } from "@/lib/data";
export const dynamic = "force-dynamic";
export default async function CatalogPage() {
  const catalogs = await getCatalogs(true);
  return <><section className="hero"><p className="eyebrow">Administration</p><h1>Grödor, sorter och platser</h1><p className="lead">Poster som redan används kan inte raderas. Inaktivera dem för att bevara historiken.</p></section><CatalogManager {...catalogs} /></>;
}
