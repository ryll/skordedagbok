const STOCKHOLM = "Europe/Stockholm";

export function todayInStockholm(now = new Date()): string {
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: STOCKHOLM,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

export function formatSwedishDate(value: string): string {
  return new Intl.DateTimeFormat("sv-SE", { dateStyle: "long", timeZone: STOCKHOLM })
    .format(new Date(`${value}T12:00:00Z`));
}

export function shiftYear(value: string, amount: number): string {
  const [year, month, day] = value.split("-").map(Number);
  const candidate = new Date(Date.UTC(year + amount, month - 1, day));
  if (candidate.getUTCMonth() !== month - 1) candidate.setUTCDate(0);
  return candidate.toISOString().slice(0, 10);
}

export function monthPeriod(year: number, month: number): { from: string; to: string } {
  const paddedMonth = String(month).padStart(2, "0");
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return {
    from: `${year}-${paddedMonth}-01`,
    to: `${year}-${paddedMonth}-${String(lastDay).padStart(2, "0")}`,
  };
}

export function comparisonPeriod(
  filters: { from?: string; to?: string; year?: number },
  today = todayInStockholm(),
): { currentFrom: string; currentTo: string; previousFrom: string; previousTo: string; label: string } {
  const currentYear = Number(today.slice(0, 4));
  const year = filters.year ?? (filters.from ? Number(filters.from.slice(0, 4)) : filters.to ? Number(filters.to.slice(0, 4)) : currentYear);
  const isCurrent = year === currentYear;
  const defaultTo = isCurrent ? (filters.from && filters.from > today ? `${year}-12-31` : today) : `${year}-12-31`;

  if (filters.from || filters.to) {
    const currentFrom = filters.from ?? `${year}-01-01`;
    const currentTo = filters.to ?? defaultTo;
    return {
      currentFrom,
      currentTo,
      previousFrom: shiftYear(currentFrom, -1),
      previousTo: shiftYear(currentTo, -1),
      label: "samma period föregående år",
    };
  }

  return {
    currentFrom: `${year}-01-01`,
    currentTo: defaultTo,
    previousFrom: `${year - 1}-01-01`,
    previousTo: isCurrent ? shiftYear(defaultTo, -1) : `${year - 1}-12-31`,
    label: isCurrent ? "samma tid föregående år" : `${year - 1}`,
  };
}
