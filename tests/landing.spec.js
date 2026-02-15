const { test, expect } = require("@playwright/test");
const manifest = require("../downloads/manifest.json");

const osScenarios = [
  {
    name: "windows",
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  },
  {
    name: "macos",
    userAgent:
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  },
  {
    name: "linux",
    userAgent:
      "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  },
];

async function captureScreenshot(page, testInfo, name) {
  await page.screenshot({
    path: testInfo.outputPath(`${name}.png`),
    fullPage: true,
  });
}

test("renders key landing content and version from manifest", async ({ page }, testInfo) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1, name: "Blink more. Feel better." })).toBeVisible();
  const versions = page.locator("[data-downloads] [data-version]");
  await expect(versions).toHaveCount(3);
  await expect(versions.first()).toHaveText(manifest.latestVersion);
  await captureScreenshot(page, testInfo, "landing-overview");
});

test.describe("mobile navigation", () => {
  test.use({
    viewport: { width: 390, height: 844 },
  });

  test("opens and closes menu from the toggle", async ({ page }, testInfo) => {
    await page.goto("/");
    const toggle = page.getByRole("button", { name: "Toggle navigation menu" });
    const navLinks = page.locator("[data-nav-links]");
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
    await toggle.click();
    await expect(toggle).toHaveAttribute("aria-expanded", "true");
    await expect(navLinks).toHaveClass(/is-open/);
    await captureScreenshot(page, testInfo, "mobile-menu-open");
    await navLinks.getByRole("link", { name: "FAQ" }).click();
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
    await expect(navLinks).not.toHaveClass(/is-open/);
    await captureScreenshot(page, testInfo, "mobile-menu-closed");
  });

  test("does not move focus to menu toggle when Escape is pressed and menu is closed", async ({ page }, testInfo) => {
    await page.goto("/");
    const toggle = page.getByRole("button", { name: "Toggle navigation menu" });
    const cta = page.locator("[data-smart-download]");
    await cta.focus();
    await expect(cta).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
    await expect(cta).toBeFocused();
    await captureScreenshot(page, testInfo, "mobile-menu-escape-closed");
  });
});

for (const scenario of osScenarios) {
  test.describe(`${scenario.name} smart download`, () => {
    test.use({
      userAgent: scenario.userAgent,
    });

    test("points hero CTA to detected platform and marks recommended card", async ({ page }, testInfo) => {
      await page.goto("/");
      const download = manifest.downloads[scenario.name];
      const smartButton = page.locator("[data-smart-download]");
      const status = page.locator("[data-smart-status]");
      await expect(smartButton).toHaveAttribute("href", download.file);
      await expect(smartButton).toHaveText(download.label);
      await expect(status).toHaveAttribute("data-ready", "true");
      const recommendedCard = page.locator(`[data-downloads] .download-card[data-os="${scenario.name}"]`);
      await expect(recommendedCard).toHaveClass(/is-recommended/);
      await captureScreenshot(page, testInfo, `${scenario.name}-smart-download`);
    });
  });
}
