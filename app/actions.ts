"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { catalogNameSchema, goalWeightKilogramsSchema, goalYearSchema, harvestInputSchema, varietyMoveSchema } from "@/lib/validation";

export type FormState = { error?: string; success?: string; fields?: Record<string, string[]> };

async function authenticatedClient() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/logga-in");
  return supabase;
}

function values(formData: FormData) {
  return Object.fromEntries(formData.entries());
}

export async function saveHarvest(_state: FormState, formData: FormData): Promise<FormState> {
  const parsed = harvestInputSchema.safeParse(values(formData));
  if (!parsed.success) return { error: "Kontrollera de markerade fälten", fields: parsed.error.flatten().fieldErrors };
  const supabase = await authenticatedClient();
  const id = formData.get("id")?.toString();
  const result = id
    ? await supabase.from("harvests").update(parsed.data).eq("id", id)
    : await supabase.from("harvests").insert(parsed.data);
  if (result.error) return { error: "Skörden kunde inte sparas. Försök igen." };
  revalidatePath("/"); revalidatePath("/skordar");
  redirect(`/skordar?sparad=${id ? "andrad" : "ny"}`);
}

export async function deleteHarvest(formData: FormData) {
  const supabase = await authenticatedClient();
  const id = formData.get("id")?.toString();
  if (!id) return;
  const { error } = await supabase.from("harvests").delete().eq("id", id);
  if (error) redirect(`/skordar/${id}?fel=delete`);
  revalidatePath("/"); revalidatePath("/skordar");
  redirect("/skordar?raderad=1");
}

type CatalogTable = "crop_types" | "varieties" | "growing_locations";
function catalogTable(value: FormDataEntryValue | null): CatalogTable | null {
  return value === "crop_types" || value === "varieties" || value === "growing_locations" ? value : null;
}

export async function saveCatalog(_state: FormState, formData: FormData): Promise<FormState> {
  const table = catalogTable(formData.get("table"));
  const name = catalogNameSchema.safeParse(formData.get("name"));
  if (!table || !name.success) return { error: "Ange ett giltigt namn" };
  const supabase = await authenticatedClient();
  const id = formData.get("id")?.toString();
  const payload: { name: string; crop_type_id?: string } = { name: name.data };
  if (table === "varieties") {
    const cropTypeId = formData.get("crop_type_id")?.toString();
    if (!cropTypeId) return { error: "Välj gröda för sorten" };
    payload.crop_type_id = cropTypeId;
  }
  const result = id ? await supabase.from(table).update(payload).eq("id", id) : await supabase.from(table).insert(payload);
  if (result.error) return { error: result.error.code === "23505" ? "Namnet finns redan" : "Kunde inte spara" };
  revalidatePath("/admin/katalog");
  return {};
}

export async function renameCatalog(formData: FormData) {
  await saveCatalog({}, formData);
}

export async function setCatalogActive(formData: FormData) {
  const table = catalogTable(formData.get("table"));
  const id = formData.get("id")?.toString();
  if (!table || !id) return;
  const supabase = await authenticatedClient();
  await supabase.from(table).update({ active: formData.get("active") === "true" }).eq("id", id);
  revalidatePath("/admin/katalog");
}

export async function deleteCatalog(formData: FormData) {
  const table = catalogTable(formData.get("table"));
  const id = formData.get("id")?.toString();
  if (!table || !id) return;
  const supabase = await authenticatedClient();
  const { error } = await supabase.from(table).delete().eq("id", id);
  if (error?.code === "23503") await supabase.from(table).update({ active: false }).eq("id", id);
  revalidatePath("/admin/katalog");
}

const MOVE_ERRORS: Record<string, string> = {
  GD003: "Välj en annan gröda att flytta till.",
  GD005: "Den mottagande grödan har redan en sort med det namnet. Byt namn på någon av dem först.",
  "42501": "Du måste vara inloggad för att flytta sorter.",
  // The move needs its migration applied; without it PostgREST cannot find the function.
  PGRST202: "Funktionen för att flytta sorter saknas i databasen. Kör migrationerna.",
  PGRST205: "Funktionen för att flytta sorter saknas i databasen. Kör migrationerna.",
};

export async function moveVarietyToCrop(_state: FormState, formData: FormData): Promise<FormState> {
  const parsed = varietyMoveSchema.safeParse(values(formData));
  if (!parsed.success) return { error: "Välj både sort och mottagande gröda" };
  const supabase = await authenticatedClient();
  const { data, error } = await supabase.rpc("reassign_variety", parsed.data);
  if (error) return { error: MOVE_ERRORS[error.code ?? ""] ?? "Sorten kunde inte flyttas. Försök igen." };
  revalidatePath("/"); revalidatePath("/skordar"); revalidatePath("/admin/katalog");
  const moved = Number((data as { movedHarvests?: number } | null)?.movedHarvests ?? 0);
  return { success: `Sorten flyttades. ${moved} skörd${moved === 1 ? "" : "ar"} följde med.` };
}

export async function saveCropGoals(_state: FormState, formData: FormData): Promise<FormState> {
  const year = goalYearSchema.safeParse(formData.get("year"));
  if (!year.success) return { error: "Välj ett giltigt år" };

  const supabase = await authenticatedClient();
  const { data: crops, error: cropError } = await supabase.from("crop_types").select("id");
  if (cropError) return { error: "Grödorna kunde inte hämtas" };

  const goals: Array<{ crop_type_id: string; year: number; goal_weight_grams: number }> = [];
  const removals: string[] = [];
  const fields: Record<string, string[]> = {};

  for (const crop of crops ?? []) {
    const field = `goal_${crop.id}`;
    // Crops the form never rendered must keep whatever goal they already have.
    if (!formData.has(field)) continue;
    const parsed = goalWeightKilogramsSchema.safeParse(formData.get(field));
    if (!parsed.success) {
      fields[field] = parsed.error.issues.map((issue) => issue.message);
    } else if (parsed.data === null) {
      removals.push(crop.id);
    } else {
      goals.push({ crop_type_id: crop.id, year: year.data, goal_weight_grams: parsed.data * 1000 });
    }
  }

  if (Object.keys(fields).length) return { error: "Kontrollera de markerade fälten", fields };

  if (goals.length) {
    const { error } = await supabase.from("crop_goals").upsert(goals, { onConflict: "crop_type_id,year" });
    if (error) return { error: "Målen kunde inte sparas. Försök igen." };
  }
  if (removals.length) {
    const { error } = await supabase.from("crop_goals").delete().eq("year", year.data).in("crop_type_id", removals);
    if (error) return { error: "Några tomma mål kunde inte tas bort. Försök igen." };
  }

  revalidatePath("/");
  revalidatePath("/admin/mal");
  return { success: `Målen för ${year.data} har sparats` };
}

export async function login(_state: FormState, formData: FormData): Promise<FormState> {
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email: String(formData.get("email")), password: String(formData.get("password")) });
  if (error) return { error: "Fel e-postadress eller lösenord" };
  redirect("/admin");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
