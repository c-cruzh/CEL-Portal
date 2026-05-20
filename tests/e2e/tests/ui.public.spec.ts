import { test, expect } from "@playwright/test";

test.describe("portal public surface", () => {
  test("landing page renders the institutional hero and CTAs", async ({
    page,
  }) => {
    const consoleErrors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") consoleErrors.push(msg.text());
    });
    await page.goto("/");
    await expect(page).toHaveTitle(/Portal CEL/i);
    await expect(page.getByText("Portal CEL").first()).toBeVisible();
    await expect(
      page.getByText("Pronóstico hidrológico avanzado"),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: /Acceder al portal/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: /Solicitar acceso/i }),
    ).toBeVisible();
    expect(consoleErrors).toEqual([]);
  });

  test("sign-in route loads the Clerk form", async ({ page }) => {
    await page.goto("/sign-in");
    await expect(page.getByText(/Iniciar sesión/i).first()).toBeVisible({
      timeout: 10_000,
    });
  });
});
