"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { catalogNameSchema, harvestInputSchema } from "@/lib/validation";

export type FormState = { error?: string; fields?: Record<string, string[]> };

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
