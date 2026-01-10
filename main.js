function detectOS() {
  const ua = navigator.userAgent || "";
  if (/Windows/i.test(ua)) return "windows";
  if (/Macintosh|Mac OS X/i.test(ua)) return "macos";
  if (/Linux/i.test(ua)) return "linux";
  return null;
}

async function loadManifest() {
  try {
    const response = await fetch("./downloads/manifest.json", { cache: "no-store" });
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
}

function applyDownloads(manifest) {
  const versionText = manifest?.latestVersion ?? "—";
  const downloads = manifest?.downloads ?? {};

  for (const card of document.querySelectorAll("[data-downloads] .download-card")) {
    const os = card.dataset.os;
    const data = downloads?.[os] ?? null;
    const button = card.querySelector("[data-download-button]");
    const version = card.querySelector("[data-version]");
    const shaEl = card.querySelector("[data-sha]");
    const copyBtn = card.querySelector("[data-copy-sha]");

    if (version) version.textContent = versionText;

    if (data?.file && button) {
      button.href = data.file;
      button.textContent = data?.label || button.textContent;
    }

    const sha = data?.sha256 || "—";
    if (shaEl) shaEl.textContent = sha;

    if (copyBtn) {
      copyBtn.disabled = sha === "—";
      copyBtn.addEventListener("click", async () => {
        try {
          await navigator.clipboard.writeText(sha);
          copyBtn.textContent = "Copied";
          window.setTimeout(() => (copyBtn.textContent = "Copy"), 1200);
        } catch {
          copyBtn.textContent = "Copy failed";
          window.setTimeout(() => (copyBtn.textContent = "Copy"), 1200);
        }
      });
    }
  }
}

function highlightRecommended(os) {
  if (!os) return;
  const card = document.querySelector(`[data-downloads] .download-card[data-os="${os}"]`);
  if (!card) return;
  card.classList.add("is-recommended");
}

async function main() {
  highlightRecommended(detectOS());
  applyDownloads(await loadManifest());
}

main();
