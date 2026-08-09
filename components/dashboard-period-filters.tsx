"use client";

import { useState } from "react";
import IsoDateField from "@/components/iso-date-field";
import { monthPeriod } from "@/lib/dates";

const MONTHS = [
  "Januari", "Februari", "Mars", "April", "Maj", "Juni",
  "Juli", "Augusti", "September", "Oktober", "November", "December",
];

export default function DashboardPeriodFilters({ availableYears, initialYear, initialMonth = "", initialFrom = "", initialTo = "" }: { availableYears: number[]; initialYear: number; initialMonth?: string; initialFrom?: string; initialTo?: string }) {
  const [year, setYear] = useState(String(initialYear));
  const [month, setMonth] = useState(initialMonth);
  const [from, setFrom] = useState(initialFrom);
  const [to, setTo] = useState(initialTo);

  function applyMonth(nextMonth: string, nextYear = year) {
    setMonth(nextMonth);
    if (!nextMonth) return;

    const numericYear = Number(nextYear);
    const numericMonth = Number(nextMonth);
    if (!Number.isInteger(numericYear) || numericYear < 1 || numericYear > 9999) return;

    const period = monthPeriod(numericYear, numericMonth);
    setFrom(period.from);
    setTo(period.to);
  }

  function changeYear(nextYear: string) {
    setYear(nextYear);
    if (month) applyMonth(month, nextYear);
  }

  function changeCustomDate(update: (value: string) => void, value: string) {
    setMonth("");
    update(value);
  }

  return <div className="filter-row filter-period">
    <div className="field">
      <label htmlFor="ar">År</label>
      <select id="ar" name="ar" required autoComplete="off" data-form-type="other" value={year} onChange={(event) => changeYear(event.target.value)}>
        {availableYears.map((availableYear) => <option key={availableYear} value={availableYear}>{availableYear}</option>)}
      </select>
    </div>
    <div className="field">
      <label htmlFor="manad">Månad</label>
      <select id="manad" name="manad" autoComplete="off" data-form-type="other" value={month} onChange={(event) => applyMonth(event.target.value)}>
        <option value="">Valfri period</option>
        {MONTHS.map((label, index) => <option key={label} value={String(index + 1).padStart(2, "0")}>{label}</option>)}
      </select>
    </div>
    <IsoDateField id="fran" name="fran" label="Från" value={from} onValueChange={(value) => changeCustomDate(setFrom, value)} />
    <IsoDateField id="till" name="till" label="Till" value={to} onValueChange={(value) => changeCustomDate(setTo, value)} />
  </div>;
}
