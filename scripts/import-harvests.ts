import { writeFile } from "node:fs/promises";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import { assertReconciliation, parseWorkbook, reviewCsv } from "@/lib/import/workbook";

async function main() {
  const args = process.argv.slice(2);
  const apply = args.includes("--apply");
  const workbookArg = args.find((arg) => !arg.startsWith("--")) ?? "Skörd 2026.xlsx";
  const workbookPath = path.resolve(workbookArg);
  const reviewPath = path.resolve("import-review.csv");

  const result = parseWorkbook(workbookPath);
  assertReconciliation(result);
  await writeFile(reviewPath, reviewCsv(result.review), "utf8");
  console.log("Avstämning klar:", JSON.stringify(result.totals, null, 2));
  console.log(`Granskningsfil: ${reviewPath}`);

  if (!apply) {
    console.log("Torrkörning klar. Inget skrevs till databasen. Lägg till --apply för att importera.");
    return;
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) throw new Error("NEXT_PUBLIC_SUPABASE_URL och SUPABASE_SERVICE_ROLE_KEY krävs för --apply");
  const supabase = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data, error } = await supabase.rpc("import_legacy_harvests", { rows: result.rows });
  if (error) throw error;
  console.log("Import klar:", data);
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
