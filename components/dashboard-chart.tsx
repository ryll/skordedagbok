import { formatWeight } from "@/lib/format";

export default function DashboardChart({ rows, empty = "Ingen skörd under perioden" }: { rows: Array<{ name: string; weightGrams: number }>; empty?: string }) {
  if (!rows.length) return <p className="empty">{empty}</p>;
  const max = Math.max(...rows.map((row) => row.weightGrams));
  return <div className="chart">{rows.map((row) => <div className="bar-row" key={row.name}>
    <span>{row.name}</span><div className="bar-track"><div className="bar" style={{ width: `${(row.weightGrams / max) * 100}%` }} /></div><strong>{formatWeight(row.weightGrams)}</strong>
  </div>)}</div>;
}
