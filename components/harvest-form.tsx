"use client";

import { useActionState, useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
import { saveHarvest, type FormState } from "@/app/actions";
import type { CatalogItem, Harvest, Variety } from "@/lib/types";
import { todayInStockholm } from "@/lib/dates";

function Submit() {
  const { pending } = useFormStatus();
  return <button disabled={pending} type="submit">{pending ? "Sparar…" : "Spara skörd"}</button>;
}

function FieldError({ state, name }: { state: FormState; name: string }) {
  return state.fields?.[name]?.map((message) => <span className="error" key={message}>{message}</span>);
}

export default function HarvestForm({ harvest, crops, varieties, locations }: { harvest?: Harvest; crops: CatalogItem[]; varieties: Variety[]; locations: CatalogItem[] }) {
  const [state, action] = useActionState(saveHarvest, {});
  const [cropId, setCropId] = useState(harvest?.crop_type_id ?? "");
  const availableVarieties = useMemo(() => varieties.filter((item) => item.crop_type_id === cropId && (item.active || item.id === harvest?.variety_id)), [cropId, varieties, harvest?.variety_id]);
  return <form className="card grid form-grid" action={action}>
    {harvest && <input type="hidden" name="id" value={harvest.id} />}
    {state.error && <div className="notice error span-2" role="alert">{state.error}</div>}
    <div className="field"><label htmlFor="harvest_date">Skördedatum *</label><input id="harvest_date" name="harvest_date" type="date" required defaultValue={harvest?.harvest_date ?? todayInStockholm()} /><FieldError state={state} name="harvest_date" /></div>
    <div className="field"><label htmlFor="crop_type_id">Gröda *</label><select id="crop_type_id" name="crop_type_id" required value={cropId} onChange={(event) => setCropId(event.target.value)}><option value="">Välj gröda</option>{crops.filter((item) => item.active || item.id === harvest?.crop_type_id).map((item) => <option key={item.id} value={item.id}>{item.name}{!item.active ? " (inaktiv)" : ""}</option>)}</select><FieldError state={state} name="crop_type_id" /></div>
    <div className="field"><label htmlFor="variety_id">Sort</label><select id="variety_id" name="variety_id" defaultValue={harvest?.variety_id ?? ""} key={`${cropId}-${harvest?.variety_id}`} disabled={!cropId}><option value="">Ingen sort</option>{availableVarieties.map((item) => <option key={item.id} value={item.id}>{item.name}{!item.active ? " (inaktiv)" : ""}</option>)}</select><FieldError state={state} name="variety_id" /></div>
    <div className="field"><label htmlFor="growing_location_id">Odlingsplats *</label><select id="growing_location_id" name="growing_location_id" required defaultValue={harvest?.growing_location_id ?? ""}><option value="">Välj plats</option>{locations.filter((item) => item.active || item.id === harvest?.growing_location_id).map((item) => <option key={item.id} value={item.id}>{item.name}{!item.active ? " (inaktiv)" : ""}</option>)}</select><FieldError state={state} name="growing_location_id" /></div>
    <div className="field"><label htmlFor="quantity">Antal *</label><input id="quantity" name="quantity" type="number" min="1" step="1" inputMode="numeric" required defaultValue={harvest?.quantity ?? 1} /><FieldError state={state} name="quantity" /></div>
    <div className="field"><label htmlFor="weight_grams">Vikt i gram *</label><input id="weight_grams" name="weight_grams" type="number" min="0.01" step="0.01" inputMode="decimal" required defaultValue={harvest?.weight_grams} /><FieldError state={state} name="weight_grams" /></div>
    <div className="field"><label htmlFor="sowing_date">Sådatum</label><input id="sowing_date" name="sowing_date" type="date" max={harvest?.harvest_date ?? todayInStockholm()} defaultValue={harvest?.sowing_date ?? ""} /><FieldError state={state} name="sowing_date" /></div>
    <div className="field"><label htmlFor="length_cm">Längd i cm</label><input id="length_cm" name="length_cm" type="number" min="0.01" step="0.01" inputMode="decimal" defaultValue={harvest?.length_cm ?? ""} /><FieldError state={state} name="length_cm" /></div>
    <div className="field"><label htmlFor="circumference_cm">Omkrets i cm</label><input id="circumference_cm" name="circumference_cm" type="number" min="0.01" step="0.01" inputMode="decimal" defaultValue={harvest?.circumference_cm ?? ""} /><FieldError state={state} name="circumference_cm" /></div>
    <div className="field span-2"><label htmlFor="comment">Kommentar</label><textarea id="comment" name="comment" defaultValue={harvest?.comment ?? ""} /></div>
    <div className="actions span-2"><Submit /></div>
  </form>;
}
