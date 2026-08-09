import { expect, test } from "@playwright/test";

test("visar den publika svenska översikten responsivt", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Översikt" })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Huvudmeny" })).toBeVisible();
  await expect(page.getByText("Total vikt")).toBeVisible();

  await expect(page.getByLabel("År")).toHaveValue(String(new Date().getFullYear()));
  await page.getByLabel("Månad").selectOption("07");
  await expect(page.getByLabel("Från", { exact: true })).toHaveValue(`${new Date().getFullYear()}-07-01`);
  await expect(page.getByLabel("Till", { exact: true })).toHaveValue(`${new Date().getFullYear()}-07-31`);

  await page.getByLabel("Till", { exact: true }).fill(`${new Date().getFullYear()}-07-15`);
  await expect(page.getByLabel("Månad")).toHaveValue("");
});

test("har manifest och installationsikoner", async ({ request }) => {
  const manifest = await request.get("/manifest.webmanifest");
  expect(manifest.ok()).toBeTruthy();
  expect((await manifest.json()).name).toBe("Skördedagbok");
  expect((await request.get("/icons/icon-192.png")).ok()).toBeTruthy();
  expect((await request.get("/sw.js")).ok()).toBeTruthy();
});

test("skyddar administration utan session", async ({ page }) => {
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/logga-in/);
  await expect(page.getByRole("heading", { name: "Välkommen tillbaka" })).toBeVisible();
});
