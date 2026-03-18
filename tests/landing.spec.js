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

const mobileScenarios = [
  {
    name: "android",
    userAgent:
      "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36",
    hasTouch: true,
  },
  {
    name: "ipad",
    userAgent:
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1",
    hasTouch: true,
  },
];

async function captureScreenshot(page, testInfo, name) {
  await page.screenshot({
    path: testInfo.outputPath(`${name}.png`),
    fullPage: true,
  });
}

async function expectUnavailableDownloadCard(page, os, versionText) {
  const card = page.locator(`[data-downloads] .download-card[data-os="${os}"]`);
  const button = card.locator("[data-download-button]");
  const copyButton = card.locator("[data-copy-sha]");
  await expect(card).toHaveAttribute("data-available", "false");
  await expect(button).toHaveAttribute("aria-disabled", "true");
  await expect(card.locator("[data-version]")).toHaveText(versionText);
  await expect(card.locator("[data-sha]")).toHaveText(" - ");
  await expect(copyButton).toBeDisabled();
  expect(await button.getAttribute("href")).toBeNull();
}

test("renders key landing content and version from manifest", async ({ page }, testInfo) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1, name: "Blink more. Feel better." })).toBeVisible();
  const versions = page.locator("[data-downloads] [data-version]");
  await expect(versions).toHaveCount(3);
  await expect(versions.first()).toHaveText(manifest.latestVersion);
  await captureScreenshot(page, testInfo, "landing-overview");
});

test.describe("manifest edge cases", () => {
  test("falls back gracefully when the manifest request fails", async ({ page }, testInfo) => {
    await page.route("**/downloads/manifest.json", async (route) => {
      await route.fulfill({
        status: 500,
        contentType: "application/json",
        body: "{}",
      });
    });
    await page.goto("/");
    const smartButton = page.locator("[data-smart-download]");
    const status = page.locator("[data-smart-status]");
    await expect(smartButton).toHaveAttribute("href", "#download");
    await expect(smartButton).toHaveText("Download");
    await expect(status).toHaveAttribute("data-ready", "false");
    await expect(status).toHaveText("Choose your installer below.");
    await expect(page.locator("[data-downloads] .download-card.is-recommended")).toHaveCount(0);
    await expectUnavailableDownloadCard(page, "windows", " - ");
    await expectUnavailableDownloadCard(page, "macos", " - ");
    await expectUnavailableDownloadCard(page, "linux", " - ");
    await captureScreenshot(page, testInfo, "manifest-request-failed");
  });

  test.describe("with windows user agent", () => {
    test.use({
      userAgent: osScenarios[0].userAgent,
    });

    test("does not recommend or auto-select an invalid platform entry", async ({ page }, testInfo) => {
      const brokenManifest = {
        ...manifest,
        downloads: {
          ...manifest.downloads,
          windows: {
            ...manifest.downloads.windows,
            file: "http://downloads.example.com/DryEyeBlink-Setup-Windows.exe",
          },
        },
      };
      await page.route("**/downloads/manifest.json", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(brokenManifest),
        });
      });
      await page.goto("/");
      const smartButton = page.locator("[data-smart-download]");
      const status = page.locator("[data-smart-status]");
      await expect(smartButton).toHaveAttribute("href", "#download");
      await expect(smartButton).toHaveText("Download");
      await expect(status).toHaveAttribute("data-ready", "false");
      await expect(status).toHaveText("Choose your installer below.");
      await expect(page.locator("[data-downloads] .download-card.is-recommended")).toHaveCount(0);
      await expectUnavailableDownloadCard(page, "windows", manifest.latestVersion);
      const linuxCard = page.locator('[data-downloads] .download-card[data-os="linux"]');
      const linuxButton = linuxCard.locator("[data-download-button]");
      await expect(linuxCard).toHaveAttribute("data-available", "true");
      await expect(linuxButton).toHaveAttribute("href", manifest.downloads.linux.file);
      await captureScreenshot(page, testInfo, "windows-invalid-platform-entry");
    });
  });
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

for (const scenario of mobileScenarios) {
  test.describe(`${scenario.name} mobile download fallback`, () => {
    test.use({
      userAgent: scenario.userAgent,
      hasTouch: scenario.hasTouch,
      viewport: { width: 390, height: 844 },
    });

    test("does not auto-select a desktop installer", async ({ page }, testInfo) => {
      await page.goto("/");
      const smartButton = page.locator("[data-smart-download]");
      const status = page.locator("[data-smart-status]");
      const recommendedCards = page.locator("[data-downloads] .download-card.is-recommended");
      await expect(smartButton).toHaveAttribute("href", "#download");
      await expect(smartButton).toHaveText("Download");
      await expect(status).toHaveAttribute("data-ready", "false");
      await expect(status).toHaveText("Choose your installer below.");
      await expect(recommendedCards).toHaveCount(0);
      await captureScreenshot(page, testInfo, `${scenario.name}-download-fallback`);
    });
  });
}
