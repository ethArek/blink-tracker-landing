# Blink Tracker: Dry Eye Helper Landing

This folder contains a lightweight, dependency-free landing page for the **Blink Tracker: Dry Eye Helper** desktop app.

## What’s included

- `index.html`, `styles.css`, `main.js` - the landing page (hero, features, downloads, FAQ, privacy).
- `downloads/manifest.json` - download link + checksum config (edit this per release).
- `downloads/README.md` - where to put your installer files.

## Add installers

1. Put your installer artifacts in `downloads/` (or upload them elsewhere and use absolute URLs).
2. Edit `downloads/manifest.json` to set:
   - `latestVersion`
   - `downloads.windows|macos|linux.file` (URL or relative path)
   - `downloads.*.sha256`

## Preview locally

Open `index.html` in a browser (download buttons work), or run a tiny static server (recommended so `downloads/manifest.json` loads too):

```powershell
cd dry-eye-blink-landing
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
3. The workflow uploads the repository root as a Pages artifact.
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
