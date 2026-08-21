import { describe, expect, it } from "vitest";
import { goalWeightKilogramsSchema, harvestInputSchema, varietyMoveSchema } from "@/lib/validation";
import { comparisonPeriod, formatSwedishDate, monthPeriod, shiftYear, todayInStockholm } from "@/lib/dates";
import { formatWeight } from "@/lib/format";
import { aggregateDashboard, isAnnualGoalView } from "@/lib/dashboard";
import type { Harvest } from "@/lib/types";

const ids = { crop: "11111111-1111-4111-8111-111111111111", variety: "22222222-2222-4222-8222-222222222222", location: "33333333-3333-4333-8333-333333333333" };
function harvest(date: string, weight: number, quantity = 1): Harvest {
  return { id: crypto.randomUUID(), harvest_date: date, crop_type_id: ids.crop, variety_id: ids.variety, growing_location_id: ids.location, quantity, weight_grams: weight, sowing_date: null, circumference_cm: null, length_cm: null, comment: null, created_at: "", updated_at: "", crop_type: { id: ids.crop, name: "Tomat", active: true }, variety: { id: ids.variety, crop_type_id: ids.crop, name: "Sonnenherz", active: true }, growing_location: { id: ids.location, name: "Balkong", active: true } };
}

describe("skördevalidering", () => {
  const valid = { harvest_date: "2026-08-08", crop_type_id: ids.crop, variety_id: ids.variety, growing_location_id: ids.location, quantity: "2", weight_grams: "12.5", sowing_date: "2026-04-01", circumference_cm: "", length_cm: "", comment: "" };
  it("accepterar en giltig skörd och omvandlar formulärvärden", () => expect(harvestInputSchema.parse(valid)).toMatchObject({ quantity: 2, weight_grams: 12.5, comment: null }));
  it.each([["quantity", "1.5"], ["quantity", "0"], ["weight_grams", "0"], ["length_cm", "-2"]])("avvisar ogiltigt %s", (field, value) => expect(harvestInputSchema.safeParse({ ...valid, [field]: value }).success).toBe(false));
  it("avvisar sådd efter skörd", () => expect(harvestInputSchema.safeParse({ ...valid, sowing_date: "2026-08-09" }).success).toBe(false));
});

describe("målvalidering", () => {
  it("accepterar kilogram med decimaler och tomma mål", () => {
    expect(goalWeightKilogramsSchema.parse("12.5")).toBe(12.5);
    expect(goalWeightKilogramsSchema.parse("")).toBeNull();
  });
  it("avvisar mål som inte är positiva", () => expect(goalWeightKilogramsSchema.safeParse("0").success).toBe(false));
});

describe("flytt av sort", () => {
  const variety = "20000000-0000-4000-8000-000000000001";
  const crop = "10000000-0000-4000-8000-000000000002";

  it("godkänner sort och mottagande gröda", () => {
    expect(varietyMoveSchema.safeParse({ source_variety_id: variety, target_crop_id: crop }).success).toBe(true);
  });

  it("avvisar saknad mottagande gröda", () => {
    expect(varietyMoveSchema.safeParse({ source_variety_id: variety, target_crop_id: "" }).success).toBe(false);
  });
});

describe("datum och svensk formatering", () => {
  it("använder Stockholm vid dygnsgränsen", () => expect(todayInStockholm(new Date("2026-03-28T23:30:00Z"))).toBe("2026-03-29"));
  it("formaterar svenska datum och vikter", () => { expect(formatSwedishDate("2026-08-08")).toContain("8 augusti 2026"); expect(formatWeight(1234.5)).toBe("1,23 kg"); });
  it("hanterar skottår när år flyttas", () => expect(shiftYear("2024-02-29", -1)).toBe("2023-02-28"));
  it("skapar ett helt månadsintervall", () => expect(monthPeriod(2024, 2)).toEqual({ from: "2024-02-01", to: "2024-02-29" }));
  it("jämför innevarande års förflutna period", () => expect(comparisonPeriod({ year: 2026 }, "2026-08-08")).toMatchObject({ currentFrom: "2026-01-01", currentTo: "2026-08-08", previousFrom: "2025-01-01", previousTo: "2025-08-08" }));
  it("jämför avslutat helår", () => expect(comparisonPeriod({ year: 2025 }, "2026-08-08")).toMatchObject({ currentTo: "2025-12-31", previousTo: "2024-12-31" }));
  it("flyttar ett eget intervall ett kalenderår", () => expect(comparisonPeriod({ from: "2026-02-01", to: "2026-03-15" }, "2026-08-08")).toMatchObject({ previousFrom: "2025-02-01", previousTo: "2025-03-15" }));
});

describe("dashboard", () => {
  it("visar årsmål bara för helårsvyer utan sort- eller platsfilter", () => {
    expect(isAnnualGoalView({ year: 2026 })).toBe(true);
    expect(isAnnualGoalView({ year: 2026, cropTypeId: ids.crop })).toBe(true);
    expect(isAnnualGoalView({ year: 2026, from: "2026-06-01" })).toBe(false);
    expect(isAnnualGoalView({ year: 2026, to: "2026-06-30" })).toBe(false);
    expect(isAnnualGoalView({ year: 2026, varietyId: ids.variety })).toBe(false);
    expect(isAnnualGoalView({ year: 2026, growingLocationId: ids.location })).toBe(false);
  });

  it("summerar, grupperar och jämför", () => {
    const result = aggregateDashboard([harvest("2026-06-01", 100, 2), harvest("2026-06-10", 50)], [harvest("2025-06-01", 100)], { year: 2026 }, "2026-08-08");
    expect(result).toMatchObject({ totalWeightGrams: 150, totalQuantity: 3, entryCount: 2, previousWeightGrams: 100, weightChangePercent: 50 });
    expect(result.monthly).toEqual([{ month: "2026-06", weightGrams: 150 }]);
    expect(result.crops[0]).toMatchObject({ name: "Tomat", quantity: 3, goalWeightGrams: null });
    expect(result.crops[0].varieties).toEqual([{ name: "Sonnenherz", quantity: 3, weightGrams: 150 }]);
  });

  it("visar grödor med mål även utan skörd", () => {
    const result = aggregateDashboard([], [], { year: 2026 }, "2026-08-08", [{ crop_type_id: ids.crop, year: 2026, goal_weight_grams: 5000 }], [{ id: ids.crop, name: "Tomat", active: true }]);
    expect(result.crops).toEqual([expect.objectContaining({ name: "Tomat", weightGrams: 0, goalWeightGrams: 5000, varieties: [] })]);
  });
});
