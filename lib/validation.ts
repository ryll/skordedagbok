import { z } from "zod";

const optionalNumber = z.preprocess(
  (value) => value === "" || value === undefined ? null : value,
  z.coerce.number().positive("Måste vara större än noll").nullable(),
);

const optionalText = z.preprocess(
  (value) => typeof value === "string" && value.trim() === "" ? null : value,
  z.string().trim().max(2000, "Kommentaren är för lång").nullable().optional(),
);

export const harvestInputSchema = z.object({
  harvest_date: z.iso.date("Ange ett giltigt skördedatum"),
  crop_type_id: z.uuid("Välj en gröda"),
  variety_id: z.preprocess((v) => v === "" ? null : v, z.uuid("Välj en giltig sort").nullable().optional()),
  growing_location_id: z.uuid("Välj en odlingsplats"),
  quantity: z.coerce.number().int("Antal måste vara ett heltal").positive("Antal måste vara större än noll"),
  weight_grams: z.coerce.number().positive("Vikt måste vara större än noll"),
  sowing_date: z.preprocess((v) => v === "" ? null : v, z.iso.date("Ange ett giltigt sådatum").nullable().optional()),
  circumference_cm: optionalNumber,
  length_cm: optionalNumber,
  comment: optionalText,
}).refine(
  ({ sowing_date, harvest_date }) => !sowing_date || sowing_date <= harvest_date,
  { path: ["sowing_date"], message: "Sådatum kan inte vara efter skördedatum" },
);

export const catalogNameSchema = z.string().trim().min(1, "Ange ett namn").max(100, "Namnet är för långt");

export const varietyMoveSchema = z.object({
  source_variety_id: z.uuid("Välj sorten som ska flyttas"),
  target_crop_id: z.uuid("Välj grödan att flytta sorten till"),
});

export const goalYearSchema = z.coerce.number().int().min(2000).max(2100);

export const goalWeightKilogramsSchema = z.preprocess(
  (value) => value === "" || value === undefined ? null : value,
  z.coerce.number().positive("Målet måste vara större än noll").max(1_000_000, "Målet är för stort").nullable(),
);

export type HarvestValidationResult = ReturnType<typeof harvestInputSchema.safeParse>;
