"use client";

import { useState } from "react";
import Link from "next/link";
import type { CatalogItem, Variety } from "@/lib/types";

interface HarvestFiltersProps {
  years: number[];
  crops: CatalogItem[];
  varieties: Variety[];
  locations: CatalogItem[];
  initialYear?: number;
  initialCropTypeId?: string;
  initialVarietyId?: string;
  initialLocationId?: string;
}

export default function HarvestFilters({
  years,
  crops,
  varieties,
  locations,
  initialYear,
  initialCropTypeId = "",
  initialVarietyId = "",
  initialLocationId = "",
}: HarvestFiltersProps) {
  const [cropId, setCropId] = useState(initialCropTypeId);
  const availableVarieties = varieties.filter((item) => !cropId || item.crop_type_id === cropId);
  const hasFilters = Boolean(initialYear || initialCropTypeId || initialVarietyId || initialLocationId);

  return (
    <form className="card filters" method="get" action="/skordar" aria-label="Filtrera skördar" autoComplete="off" data-form-type="other">
      <div className="filter-row filter-harvests">
        <div className="field">
          <label htmlFor="ar">År</label>
          <select id="ar" name="ar" defaultValue={initialYear ? String(initialYear) : ""}>
            <option value="">Alla år</option>
            {years.map((year) => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="groda">Gröda</label>
          <select
            id="groda"
            name="groda"
            value={cropId}
            onChange={(event) => setCropId(event.target.value)}
          >
            <option value="">Alla grödor</option>
            {crops.map((crop) => (
              <option key={crop.id} value={crop.id}>{crop.name}</option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="sort">Sort</label>
          <select
            id="sort"
            name="sort"
            defaultValue={initialVarietyId}
            key={cropId}
          >
            <option value="">Alla sorter</option>
            {availableVarieties.map((variety) => (
              <option key={variety.id} value={variety.id}>{variety.name}</option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="plats">Plats</label>
          <select id="plats" name="plats" defaultValue={initialLocationId}>
            <option value="">Alla platser</option>
            {locations.map((loc) => (
              <option key={loc.id} value={loc.id}>{loc.name}</option>
            ))}
          </select>
        </div>
        <div className="actions">
          <button type="submit">Filtrera</button>
          {hasFilters && <Link className="button secondary" href="/skordar">Rensa</Link>}
        </div>
      </div>
    </form>
  );
}
