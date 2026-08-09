export function formatWeight(grams: number): string {
  if (Math.abs(grams) >= 1000) {
    return `${new Intl.NumberFormat("sv-SE", { maximumFractionDigits: 2 }).format(grams / 1000)} kg`;
  }
  return `${new Intl.NumberFormat("sv-SE", { maximumFractionDigits: 2 }).format(grams)} g`;
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat("sv-SE", { maximumFractionDigits: 2 }).format(value);
}
