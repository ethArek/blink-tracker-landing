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
python -m http.server 5173
```

Then visit `http://localhost:5173/`.

## End-to-end tests (Playwright)

Install dependencies:

```powershell
npm install
npx playwright install
```

Run tests:

```powershell
npm run test:e2e
```

Screenshots are generated for each test run under `test-results/` (per-test output folders).

Optional modes:

```powershell
npm run test:e2e:headed
npm run test:e2e:ui
```
