document.documentElement.classList.add("js-ready");

function detectOS() {
  const ua = navigator.userAgent || "";
  if (/Windows/i.test(ua)) {
    return "windows";
  }
  if (/Macintosh|Mac OS X/i.test(ua)) {
    return "macos";
  }
  if (/Linux/i.test(ua)) {
    return "linux";
  }

  return null;
}

async function loadManifest() {
  try {
    const response = await fetch("./downloads/manifest.json", { cache: "no-store" });
    if (!response.ok) {
      return null;
    }

    return await response.json();
  } catch {
    return null;
  }
}

function getOsLabel(os) {
  if (os === "windows") {
    return "Windows";
  }
  if (os === "macos") {
    return "macOS";
  }
  if (os === "linux") {
    return "Linux";
  }

  return "your platform";
}

function getDownloadForOS(manifest, os) {
  if (!manifest || !os) {
    return null;
  }
  const downloads = manifest.downloads ?? {};

  return downloads[os] ?? null;
}

function getSafeDownloadHref(file) {
  if (typeof file !== "string") {
    return null;
  }
  const trimmedFile = file.trim();
  if (!trimmedFile) {
    return null;
  }

  try {
    const normalizedUrl = new URL(trimmedFile, window.location.href);
    const isSameOrigin = normalizedUrl.origin === window.location.origin;
    if (isSameOrigin) {
      return trimmedFile;
    }
    if (normalizedUrl.protocol === "https:") {
      return normalizedUrl.href;
    }

    return null;
  } catch {
    return null;
  }
}

function applyDownloads(manifest) {
  const versionText = manifest?.latestVersion ?? " - ";
  const downloads = manifest?.downloads ?? {};

  for (const card of document.querySelectorAll("[data-downloads] .download-card")) {
    const os = card.dataset.os;
    const data = downloads?.[os] ?? null;
    const button = card.querySelector("[data-download-button]");
    const version = card.querySelector("[data-version]");
    const shaEl = card.querySelector("[data-sha]");
    const copyBtn = card.querySelector("[data-copy-sha]");

    if (version) {
      version.textContent = versionText;
    }

    const downloadHref = getSafeDownloadHref(data?.file);
    if (downloadHref && button instanceof HTMLAnchorElement) {
      button.setAttribute("href", downloadHref);
      button.textContent = data?.label || button.textContent;
    }

    const sha = data?.sha256 || " - ";
    if (shaEl) {
      shaEl.textContent = sha;
    }

    if (copyBtn) {
      copyBtn.disabled = sha === " - ";
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
  if (!os) {
    return;
  }
  const card = document.querySelector(`[data-downloads] .download-card[data-os="${os}"]`);
  if (!card) {
    return;
  }

  card.classList.add("is-recommended");
}

function applySmartDownload(manifest, os) {
  const button = document.querySelector("[data-smart-download]");
  const status = document.querySelector("[data-smart-status]");
  if (!(button instanceof HTMLAnchorElement)) {
    return;
  }
  const data = getDownloadForOS(manifest, os);
  const downloadHref = getSafeDownloadHref(data?.file);
  if (!downloadHref) {
    if (status instanceof HTMLElement) {
      status.textContent = "Choose your installer below.";
      status.dataset.ready = "false";
    }

    return;
  }
  button.setAttribute("href", downloadHref);
  button.textContent = data?.label || `Download for ${getOsLabel(os)}`;
  button.dataset.smartReady = "true";
  if (status instanceof HTMLElement) {
    status.textContent = `Ready: ${getOsLabel(os)} installer selected automatically.`;
    status.dataset.ready = "true";
  }
}

function setupMobileNavigation() {
  const toggle = document.querySelector("[data-nav-toggle]");
  const links = document.querySelector("[data-nav-links]");
  if (!(toggle instanceof HTMLButtonElement) || !(links instanceof HTMLElement)) {
    return;
  }
  const setOpen = (open) => {
    if (open) {
      links.classList.add("is-open");
      toggle.setAttribute("aria-expanded", "true");
      return;
    }
    links.classList.remove("is-open");
    toggle.setAttribute("aria-expanded", "false");
  };

  setOpen(false);

  toggle.addEventListener("click", () => {
    const open = links.classList.contains("is-open");
    setOpen(!open);
  });

  for (const link of links.querySelectorAll("a")) {
    link.addEventListener("click", () => {
      setOpen(false);
    });
  }

  document.addEventListener("click", (event) => {
    if (!(event.target instanceof Node)) {
      return;
    }
    if (!links.classList.contains("is-open")) {
      return;
    }
    if (links.contains(event.target) || toggle.contains(event.target)) {
      return;
    }
    setOpen(false);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && links.classList.contains("is-open")) {
      setOpen(false);
      toggle.focus();
    }
  });

  const desktopQuery = window.matchMedia("(min-width: 981px)");
  const handleDesktopMode = (event) => {
    if (event.matches) {
      setOpen(false);
    }
  };
  if (typeof desktopQuery.addEventListener === "function") {
    desktopQuery.addEventListener("change", handleDesktopMode);
  } else {
    desktopQuery.addListener(handleDesktopMode);
  }
}

function setupRevealAnimations() {
  const items = document.querySelectorAll(".hero-card, .mini-stat, .card, .download-card, .privacy-card, .faq details");
  if (!items.length) {
    return;
  }

  for (const item of items) {
    item.classList.add("reveal-item");
  }

  if (!("IntersectionObserver" in window)) {
    for (const item of items) {
      item.classList.add("is-visible");
    }

    return;
  }
  const observer = new IntersectionObserver(
    (entries, currentObserver) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          currentObserver.unobserve(entry.target);
        }
      }
    },
    {
      threshold: 0.18,
      rootMargin: "0px 0px -8% 0px",
    }
  );

  for (const item of items) {
    observer.observe(item);
  }
}

async function main() {
  setupMobileNavigation();
  setupRevealAnimations();
  const hasDownloadUi = document.querySelector("[data-downloads], [data-smart-download]") !== null;
  if (!hasDownloadUi) {
    return;
  }
  const os = detectOS();
  const manifest = await loadManifest();
  highlightRecommended(os);
  applyDownloads(manifest);
  applySmartDownload(manifest, os);
}

main();
