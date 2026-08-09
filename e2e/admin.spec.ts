import { expect, test } from "@playwright/test";

const email = process.env.E2E_ADMIN_EMAIL;
const password = process.env.E2E_ADMIN_PASSWORD;

test.describe("administratörens flöde", () => {
  test.skip(!email || !password, "Kräver E2E_ADMIN_EMAIL och E2E_ADMIN_PASSWORD mot utvecklingsprojektet");

  test("loggar in och kan registrera, ändra och radera en skörd", async ({ page }) => {
    await page.goto("/logga-in");
    await page.getByLabel("E-postadress").fill(email!);
    await page.getByLabel("Lösenord").fill(password!);
    await page.getByRole("button", { name: "Logga in" }).click();
    await expect(page).toHaveURL(/\/admin$/);

    await page.goto("/admin/skordar/ny");
    const cropOptions = page.getByLabel("Gröda *").locator("option");
    const locationOptions = page.getByLabel("Odlingsplats *").locator("option");
    test.skip(await cropOptions.count() < 2 || await locationOptions.count() < 2, "Utvecklingsprojektet behöver minst en aktiv gröda och plats");
    await page.getByLabel("Gröda *").selectOption({ index: 1 });
    await page.getByLabel("Odlingsplats *").selectOption({ index: 1 });
    await page.getByLabel("Antal *").fill("1");
    await page.getByLabel("Vikt i gram *").fill("12.5");
    await page.getByLabel("Kommentar").fill("Automatiskt E2E-test");
    await page.getByRole("button", { name: "Spara skörd" }).click();
    await expect(page).toHaveURL(/\/skordar\?sparad=ny/);
    await page.locator("tbody tr").first().getByRole("link").click();
    await page.getByRole("link", { name: "Redigera" }).click();
    await page.getByLabel("Kommentar").fill("Ändrad av E2E-test");
    await page.getByRole("button", { name: "Spara skörd" }).click();
    await expect(page).toHaveURL(/sparad=andrad/);
    await page.locator("tbody tr").first().getByRole("link").click();
    page.once("dialog", (dialog) => dialog.accept());
    await page.getByRole("button", { name: "Radera permanent" }).click();
    await expect(page).toHaveURL(/raderad=1/);
  });
});
