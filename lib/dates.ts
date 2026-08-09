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
  if (filters.from && filters.to) {
    return {
      currentFrom: filters.from,
      currentTo: filters.to,
      previousFrom: shiftYear(filters.from, -1),
      previousTo: shiftYear(filters.to, -1),
      label: "samma period föregående år",
    };
  }
  const currentYear = Number(today.slice(0, 4));
  const year = filters.year ?? currentYear;
  const isCurrent = year === currentYear;
  const to = isCurrent ? today : `${year}-12-31`;
  return {
    currentFrom: `${year}-01-01`,
    currentTo: to,
    previousFrom: `${year - 1}-01-01`,
    previousTo: isCurrent ? shiftYear(to, -1) : `${year - 1}-12-31`,
    label: isCurrent ? "samma tid föregående år" : `${year - 1}`,
  };
}
