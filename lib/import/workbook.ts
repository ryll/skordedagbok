import * as XLSX from "xlsx";
import type { ImportReviewRow } from "@/lib/types";
import { normalizeLabel } from "@/lib/import/normalize";

export interface NormalizedImportRow {
  sourceSheet: string;
  sourceRow: number;
  harvestDate: string;
  cropType: string;
  variety: string | null;
  location: string;
  quantity: number;
  weightGrams: number;
  sowingDate: string | null;
  circumferenceCm: number | null;
  lengthCm: number | null;
  comment: string | null;
}

export interface ImportResult { rows: NormalizedImportRow[]; review: ImportReviewRow[]; totals: { byYear: Record<string, { rows: number; quantity: number; weightGrams: number }>; rows: number; reviewRows: number } }

const SPECS = {
  Odling: { headers: ["Datum", "Sort", "Odlingsplats", "Antal", "Vikt", "Omkrets", "Längd"], candidates: 532, ref: "A1:G533" },
  "Skörd 2026": { headers: ["<", "Sort", "Odlingsplats", "Antal", "Vikt", "Sådd datum", "Omkrets", "Längd", "Kommentar", "Totalskörd"], candidates: 624, ref: "A1:J636" },
} as const;

const APPROVED_CORRECTIONS = {
  "Skörd 2026:27": {
    expectedLabel: "Ört - Salvia",
    expectedWeightGrams: 2,
    expectedSowingDate: "2026-12-21",
    sowingDate: "2025-12-21",
  },
  "Skörd 2026:106": { expectedLabel: "Chili - Aurora", expectedWeightGrams: 0, weightGrams: 0.5 },
  "Skörd 2026:136": { expectedLabel: "Chili - Aurora", expectedWeightGrams: 0, weightGrams: 0.5 },
  "Skörd 2026:216": { expectedLabel: "Chili - Aurora", expectedWeightGrams: 0, weightGrams: 0.5 },
  "Skörd 2026:277": { expectedLabel: "Chili - Aurora", expectedWeightGrams: 0, weightGrams: 0.5 },
} as const;

function excelDate(value: unknown): string {
  if (value instanceof Date) return [value.getFullYear(), value.getMonth() + 1, value.getDate()].map((part, index) => index ? String(part).padStart(2, "0") : String(part)).join("-");
  if (typeof value !== "number") return "";
  const date = XLSX.SSF.parse_date_code(value);
  return date ? `${date.y}-${String(date.m).padStart(2, "0")}-${String(date.d).padStart(2, "0")}` : "";
}

function candidate(row: unknown[]) {
  return Boolean(excelDate(row[0]) && typeof row[1] === "string" && typeof row[2] === "string" && typeof row[3] === "number" && typeof row[4] === "number");
}

export function parseWorkbook(path: string): ImportResult {
  const workbook = XLSX.readFile(path, { cellDates: false });
  const normalized: NormalizedImportRow[] = [];
  const review: ImportReviewRow[] = [];

  for (const [sheetName, spec] of Object.entries(SPECS)) {
    const worksheet = workbook.Sheets[sheetName];
    if (!worksheet) throw new Error(`Arbetsbladet ${sheetName} saknas`);
    if (worksheet["!ref"] !== spec.ref) throw new Error(`Radantal eller område har ändrats i ${sheetName}: ${worksheet["!ref"]} (förväntat ${spec.ref})`);
    const allRows = XLSX.utils.sheet_to_json<unknown[]>(worksheet, { header: 1, defval: null, raw: true });
    const headers = allRows[0]?.slice(0, spec.headers.length);
    if (JSON.stringify(headers) !== JSON.stringify(spec.headers)) throw new Error(`Kolumnrubrikerna har ändrats i ${sheetName}`);
    const rows = allRows.slice(1).map((row, index) => ({ row, sourceRow: index + 2 })).filter(({ row }) => candidate(row));
    if (rows.length !== spec.candidates) throw new Error(`Källraderna har ändrats i ${sheetName}: ${rows.length} (förväntat ${spec.candidates})`);
    for (const { row, sourceRow } of rows) {
      const harvestDate = excelDate(row[0]);
      const originalSowingDate = excelDate(row[5]);
      const originalWeightGrams = Number(row[4]);
      const correction = APPROVED_CORRECTIONS[`${sheetName}:${sourceRow}` as keyof typeof APPROVED_CORRECTIONS];
      if (correction && (
        row[1] !== correction.expectedLabel ||
        originalWeightGrams !== correction.expectedWeightGrams ||
        ("expectedSowingDate" in correction && originalSowingDate !== correction.expectedSowingDate)
      )) throw new Error(`Källvärdena för godkänd korrigering har ändrats i ${sheetName}, rad ${sourceRow}`);
      const sowingDate = correction && "sowingDate" in correction ? correction.sowingDate : originalSowingDate;
      const weightGrams = correction && "weightGrams" in correction ? correction.weightGrams : originalWeightGrams;
      let reason = "";
      let suggestedCorrection = "";
      if (weightGrams === 0) {
        reason = "Vikten är noll";
        suggestedCorrection = "Ange en positiv vikt och registrera skörden manuellt.";
      } else if (sowingDate && sowingDate > harvestDate) {
        reason = "Sådatum ligger efter skördedatum";
        suggestedCorrection = "Rätta sådatumet och registrera skörden manuellt.";
      }
      if (reason) {
        review.push({
          sourceSheet: sheetName, sourceRow, harvestDate, originalLabel: String(row[1]), originalLocation: String(row[2]),
          quantity: Number(row[3]), weightGrams: originalWeightGrams, sowingDate: originalSowingDate,
          circumferenceCm: Number(row[sheetName === "Odling" ? 5 : 6]) || "",
          lengthCm: Number(row[sheetName === "Odling" ? 6 : 7]) || "",
          comment: sheetName === "Skörd 2026" && row[8] ? String(row[8]) : "",
          reason, suggestedCorrection,
        });
        continue;
      }
      const label = normalizeLabel(String(row[1]));
      normalized.push({ sourceSheet: sheetName, sourceRow, harvestDate, ...label, location: String(row[2]).trim(), quantity: Number(row[3]), weightGrams, sowingDate: sowingDate || null, circumferenceCm: Number(row[sheetName === "Odling" ? 5 : 6]) || null, lengthCm: Number(row[sheetName === "Odling" ? 6 : 7]) || null, comment: sheetName === "Skörd 2026" && row[8] ? String(row[8]).trim() : null });
    }
  }
  const byYear: ImportResult["totals"]["byYear"] = {};
  for (const row of normalized) {
    const year = row.harvestDate.slice(0, 4);
    byYear[year] ??= { rows: 0, quantity: 0, weightGrams: 0 };
    byYear[year].rows += 1; byYear[year].quantity += row.quantity; byYear[year].weightGrams = Math.round((byYear[year].weightGrams + row.weightGrams) * 100) / 100;
  }
  return { rows: normalized, review, totals: { byYear, rows: normalized.length, reviewRows: review.length } };
}

export function assertReconciliation(result: ImportResult) {
  const expected = { "2025": { rows: 532, quantity: 2231, weightGrams: 38952 }, "2026": { rows: 624, quantity: 1361, weightGrams: 33649.37 } };
  if (JSON.stringify(result.totals.byYear) !== JSON.stringify(expected) || result.totals.rows !== 1156 || result.totals.reviewRows !== 0) {
    throw new Error(`Avstämningen misslyckades: ${JSON.stringify(result.totals)}`);
  }
}

function csvCell(value: unknown) { const text = String(value ?? ""); return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text; }
export function reviewCsv(rows: ImportReviewRow[]) {
  const headers: Array<keyof ImportReviewRow> = ["sourceSheet", "sourceRow", "harvestDate", "originalLabel", "originalLocation", "quantity", "weightGrams", "sowingDate", "circumferenceCm", "lengthCm", "comment", "reason", "suggestedCorrection"];
  return [headers.join(","), ...rows.map((row) => headers.map((header) => csvCell(row[header])).join(","))].join("\n") + "\n";
}
