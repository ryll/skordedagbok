"use client";
import { useActionState, type ReactNode } from "react";
import { deleteCatalog, moveVarietyToCrop, renameCatalog, saveCatalog, setCatalogActive } from "@/app/actions";
import type { CatalogItem, Variety } from "@/lib/types";

type Table = "crop_types" | "varieties" | "growing_locations";
function AddForm({ table, crops }: { table: Table; crops?: CatalogItem[] }) {
  const [state, action] = useActionState(saveCatalog, {});
  return <form className="actions" action={action}><input type="hidden" name="table" value={table} />{crops && <select aria-label="Gröda" name="crop_type_id" required style={{ maxWidth: 220 }}><option value="">Välj gröda</option>{crops.map((crop) => <option value={crop.id} key={crop.id}>{crop.name}</option>)}</select>}<input aria-label="Namn" name="name" required placeholder="Namn" style={{ maxWidth: 260 }} /><button>Lägg till</button>{state.error && <span className="error">{state.error}</span>}</form>;
}
function MoveVarietyForm({ variety, crops }: { variety: Variety; crops: CatalogItem[] }) {
  const [state, action] = useActionState(moveVarietyToCrop, {});
  const targets = crops.filter((item) => item.active && item.id !== variety.crop_type_id);
  if (!targets.length) return null;
  return <details><summary className="button secondary">Byt gröda</summary><form action={action} className="actions"><input type="hidden" name="source_variety_id" value={variety.id} /><select aria-label={`Flytta ${variety.name} till gröda`} name="target_crop_id" required style={{ maxWidth: 220 }}><option value="">Välj gröda</option>{targets.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}</select><button>Flytta</button>{state.error && <span className="error">{state.error}</span>}{state.success && <span className="success">{state.success}</span>}</form></details>;
}
function Item({ item, table, cropName, extra }: { item: CatalogItem; table: Table; cropName?: string; extra?: ReactNode }) {
  return <li className={`catalog-row ${item.active ? "" : "inactive"}`}><span><strong>{item.name}</strong>{cropName ? ` · ${cropName}` : ""}{!item.active && " · inaktiv"}</span><div className="actions">
    {extra}
    <form action={setCatalogActive}><input type="hidden" name="table" value={table} /><input type="hidden" name="id" value={item.id} /><input type="hidden" name="active" value={String(!item.active)} /><button className="secondary">{item.active ? "Inaktivera" : "Återaktivera"}</button></form>
    <details><summary className="button secondary">Byt namn</summary><form action={renameCatalog} className="actions"><input type="hidden" name="table" value={table} /><input type="hidden" name="id" value={item.id} /><input name="name" defaultValue={item.name} required />{table === "varieties" && <input type="hidden" name="crop_type_id" value={(item as Variety).crop_type_id} />}<button>Spara</button></form></details>
    <form action={deleteCatalog}><input type="hidden" name="table" value={table} /><input type="hidden" name="id" value={item.id} /><button className="danger" title="Poster som används inaktiveras i stället">Radera om oanvänd</button></form>
  </div></li>;
}
export default function CatalogManager({ crops, varieties, locations }: { crops: CatalogItem[]; varieties: Variety[]; locations: CatalogItem[] }) {
  return <div className="grid">
    <section className="card catalog-section"><h2>Grödor</h2><AddForm table="crop_types" /><ul className="list">{crops.map((item) => <Item item={item} table="crop_types" key={item.id} />)}</ul></section>
    <section className="card catalog-section"><h2>Sorter</h2><AddForm table="varieties" crops={crops.filter((item) => item.active)} /><ul className="list">{varieties.map((item) => <Item item={item} table="varieties" cropName={crops.find((crop) => crop.id === item.crop_type_id)?.name} key={item.id} extra={<MoveVarietyForm variety={item} crops={crops} />} />)}</ul></section>
    <section className="card catalog-section"><h2>Odlingsplatser</h2><AddForm table="growing_locations" /><ul className="list">{locations.map((item) => <Item item={item} table="growing_locations" key={item.id} />)}</ul></section>
  </div>;
}
