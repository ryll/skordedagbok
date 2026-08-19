import { existsSync } from "node:fs";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import * as XLSX from "xlsx";
import { normalizeLabel } from "@/lib/import/normalize";
import { assertReconciliation, parseWorkbook, reviewCsv } from "@/lib/import/workbook";
import type { ImportResult } from "@/lib/import/workbook";

describe("etikettnormalisering", () => {
  it.each([
    ["Tomat - Sonnenhertz", { cropType: "Tomat", variety: "Sonnenherz" }],
    ["Tomat - Sonnenerz", { cropType: "Tomat", variety: "Sonnenherz" }],
    ["Jorgubbe - Delizz", { cropType: "Jordgubbe", variety: "Delizz" }],
    ["Rädia - Easter egg", { cropType: "Rädisa", variety: "Easter egg" }],
    ["Örter - Blandat", { cropType: "Ört", variety: "Blandat" }],
    ["Zucchini Gul - One Ball", { cropType: "Zucchini", variety: "Gul One Ball" }],
    ['Salladssenap "Purple Osaka"', { cropType: "Salladssenap", variety: "Purple Osaka" }],
    ['Kål - Pak Choi "Joy Choy""', { cropType: "Kål", variety: 'Pak Choi "Joy Choy"' }],
  ])("normaliserar %s", (label, expected) => expect(normalizeLabel(label)).toEqual(expected));
});

const workbook = path.resolve("Skörd 2026.xlsx");
describe.skipIf(!existsSync(workbook))("verklig importavstämning", () => {
  let result: ImportResult;
  beforeAll(() => { result = parseWorkbook(workbook); });

  it("matchar godkända totaler", () => { expect(() => assertReconciliation(result)).not.toThrow(); expect(result.totals.rows).toBe(1156); });
  it("tillämpar de godkända korrigeringarna", () => {
    expect(result.review).toHaveLength(0);
    expect(result.rows.find((row) => row.sourceSheet === "Skörd 2026" && row.sourceRow === 27)).toMatchObject({ sowingDate: "2025-12-21", weightGrams: 2 });
    for (const sourceRow of [106, 136, 216, 277]) expect(result.rows.find((row) => row.sourceSheet === "Skörd 2026" && row.sourceRow === sourceRow)).toMatchObject({ cropType: "Chili", variety: "Aurora", weightGrams: 0.5 });
    expect(reviewCsv(result.review).split("\n")).toHaveLength(2);
  });
  it("behåller båda raderna i godkända dubblettpar", () => {
    for (const [sheet, sourceRows] of [["Odling", [10, 11]], ["Skörd 2026", [15, 17]]] as const) {
      expect(result.rows.filter((row) => row.sourceSheet === sheet && sourceRows.includes(row.sourceRow as never))).toHaveLength(2);
    }
  });
  it("avbryter när rubriker har ändrats", async () => {
    const directory = await mkdtemp(path.join(os.tmpdir(), "skordedagbok-test-"));
    const changed = path.join(directory, "changed.xlsx");
    try {
      const copy = XLSX.readFile(workbook);
      copy.Sheets.Odling.A1.v = "Ändrad rubrik";
      XLSX.writeFile(copy, changed);
      expect(() => parseWorkbook(changed)).toThrow("Kolumnrubrikerna har ändrats");
    } finally { await rm(directory, { recursive: true }); }
  });
});
