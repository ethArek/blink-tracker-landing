# Blink Tracker Landing

Landing site for the **Blink Tracker: Dry Eye Helper** desktop app.

The site itself is static (`index.html`, `styles.css`, `main.js`) and uses `downloads/manifest.json` to populate installer links and checksums.

## Current UX behavior

- Responsive layout with accessible mobile navigation.
- Smart hero download CTA that auto-selects Windows/macOS/Linux when detected.
- Download cards with version + SHA-256 sourced from `downloads/manifest.json`.
- FAQ/privacy sections and story page (`stories.html`).

## Project files

- `index.html` - main landing page.
- `stories.html` - story page.
- `styles.css` - shared styling.
- `main.js` - UI behavior, manifest loading, smart CTA, mobile menu interactions.
- `downloads/manifest.json` - release version, installer links, SHA-256 values.
- `tests/landing.spec.js` - Playwright end-to-end tests.
- `tests/static-server.js` - local static server used by Playwright runs.
- `playwright.config.js` - Playwright configuration.

## Configure installers

1. Place installer files in `downloads/` or use hosted absolute URLs.
2. Update `downloads/manifest.json` fields:
   - `latestVersion`
   - `downloads.windows.file`
   - `downloads.macos.file`
   - `downloads.linux.file`
   - `downloads.*.sha256`

## Run locally

Use a static server so manifest fetch requests work:

```powershell
python -m http.server 5173
```

Open `http://localhost:5173/`.

## Deploy to GitHub Pages

The site auto-deploys to GitHub Pages using `.github/workflows/pages.yml` when:

- Changes are pushed to `master` (including merged PRs).
- A manual run is triggered from the Actions tab (`workflow_dispatch`).

After deployment, the site is available at the repository's GitHub Pages URL.

## Deployment flow

1. A change lands on `master` (direct push or merged PR).
2. GitHub Actions runs the `Deploy to GitHub Pages` workflow.
3. The workflow stages the static site files into a dedicated Pages artifact.
4. GitHub Pages publishes the new version.

## End-to-end tests

Install test dependencies once:

```powershell
npm install
npx playwright install
```

Run tests:

```powershell
npm run test:e2e
```

Additional modes:

```powershell
npm run test:e2e:headed
npm run test:e2e:ui
```

## Test artifacts

- Screenshots are written to `test-results/` (per-test output folders).
- HTML report is written to `playwright-report/`.
