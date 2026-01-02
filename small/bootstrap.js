// bootstrap.js

const VERSIONS = [
  { id: "future",  label: "Emberwood Patch V1.1.92 — The Blackbark Oath",  entry: "./Future/Future.js" },
];

const STORAGE_KEY = "selected_game_version";
const GAME_SCRIPT_ID = "game-entry-module";
const BTN_ID = "btnChangeVersion";

/* --------------------------- small helpers --------------------------- */


function safeStorageGet(key) {
  try { return localStorage.getItem(key); } catch (_) { return null; }
}
function safeStorageSet(key, value) {
  try { localStorage.setItem(key, value); return true; } catch (_) { return false; }
}

function onDocReady(fn) {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", fn, { once: true });
  } else {
    fn();
  }
}

/* --------------------------- pill tap highlight --------------------------- */

// Restores the old “tap highlight” feel for the top-right HUD pills and modal close.
// This intentionally avoids any translate/scale press effects.
function wirePillTapHighlight() {
  const ids = ["btnSmokeTestsPill", "btnCheatPill", "btnGameMenu", "modalClose"];

  ids.forEach((id) => {
    const el = document.getElementById(id);
    if (!el) return;
    if (el.dataset && el.dataset.pillTapWired) return;
    try { el.dataset.pillTapWired = "1"; } catch (_) {}

    const fire = () => {
      try {
        // restart animation
        el.classList.remove("pill-tap-anim");
        // force reflow
        void el.offsetWidth;
        el.classList.add("pill-tap-anim");
        if (el.__pillTapTimer) clearTimeout(el.__pillTapTimer);
        el.__pillTapTimer = setTimeout(() => el.classList.remove("pill-tap-anim"), 380);
      } catch (_) {}
    };

    // pointerdown = instant feedback on touch
    el.addEventListener("pointerdown", fire, { passive: true });
    // click fallback
    el.addEventListener("click", fire);
    // keyboard accessibility
    el.addEventListener("keydown", (e) => {
      if (e && (e.key === "Enter" || e.key === " ")) fire();
    });
  });
}

// IMPORTANT:
// This file lives under /small, but the game entry modules (Future/, etc.) live
// alongside index.html. If we resolve relative to import.meta.url here, we end
// up with broken paths like /small/Future/Future.js.
const APP_BASE = new URL('./', location.href);

function resolveEntry(entry) {
  return new URL(entry, APP_BASE).href;
}

function normalizeUrlWithoutQueryV() {
  const url = new URL(location.href);
  url.searchParams.delete("v");
  return url.toString();
}

function pickVersionId() {
  const url = new URL(location.href);
  const fromQuery = url.searchParams.get("v");
  if (fromQuery) return fromQuery;
  return safeStorageGet(STORAGE_KEY);
}

function getOnlyVersionIfSingle() {
  return (Array.isArray(VERSIONS) && VERSIONS.length === 1) ? VERSIONS[0] : null;
}



/* --------------------------- boot diagnostics --------------------------- */

function diagPush(kind, payload) {
  try {
    const d = window.PQ_BOOT_DIAG
    if (d && typeof d === 'object' && Array.isArray(d.errors)) {
      d.errors.push({ t: new Date().toISOString(), kind, ...payload })
      if (d.errors.length > 80) d.errors.splice(0, d.errors.length - 80)
    }
  } catch (_) {}
}

async function preflightModuleGraph(entryUrl, { maxModules = 140 } = {}) {
  const visited = new Set()
  const missing = []
  const bad = []

  async function check(url) {
    if (visited.has(url)) return
    if (visited.size >= maxModules) return
    visited.add(url)

    let res
    try {
      res = await fetch(url, { cache: 'no-store' })
    } catch (e) {
      bad.push({ url, message: String(e && e.message ? e.message : e) })
      return
    }

    if (!res || !res.ok) {
      missing.push({ url, status: res ? res.status : 0, statusText: res ? res.statusText : '' })
      return
    }

    // Only parse JS-ish content.
    const ct = (res.headers && res.headers.get ? (res.headers.get('content-type') || '') : '')
    const looksJs = url.endsWith('.js') || ct.includes('javascript') || ct.includes('ecmascript') || ct.includes('text/plain')
    if (!looksJs) return

    let src = ''
    try {
      src = await res.text()
    } catch (_) {
      return
    }

    // Parse static imports (best-effort). This is *not* a full JS parser; it's an early warning system.
    const re = /import\s+(?:[^'"\n;]*?from\s*)?['"]([^'"]+)['"]/g
    let m
    while ((m = re.exec(src))) {
      const spec = m[1]
      if (!spec || typeof spec !== 'string') continue
      if (!spec.startsWith('.') && !spec.startsWith('/')) continue
      // Skip remote specifiers
      if (spec.startsWith('http:') || spec.startsWith('https:')) continue
      const next = new URL(spec, url).href
      await check(next)
    }
  }

  await check(entryUrl)
  return { visitedCount: visited.size, missing, bad }
}
/* --------------------------- game loading --------------------------- */

async function loadGameVersion(version, { onFail } = {}) {
  const existing = document.getElementById(GAME_SCRIPT_ID);
  if (existing) existing.remove();

  const entryUrl = resolveEntry(version.entry);

  // Preflight: fetch and scan the entry module graph to catch missing files
  // BEFORE the browser throws a cryptic module load error.
  //
  // NOTE (iOS / file://): many WebViews block fetch(file://...), which would
  // cause false "Load failed" diagnostics and prevent boot. In file protocol
  // environments we skip preflight and rely on error capture instead.
  if (location.protocol === 'file:') {
    diagPush('preflightSkipped', { version: version.id, reason: 'file-protocol' });
  } else {
    try {
      const result = await preflightModuleGraph(entryUrl);
      if ((result.missing && result.missing.length) || (result.bad && result.bad.length)) {
        diagPush('preflight', { version: version.id, ...result });
        if (window.PQ_BOOT_DIAG && window.PQ_BOOT_DIAG.renderOverlay) window.PQ_BOOT_DIAG.renderOverlay();
        if (onFail) onFail(new Error('Preflight detected missing modules'));
        return;
      }
    } catch (e) {
      diagPush('preflightException', { message: String(e && e.message ? e.message : e) });
      // continue: don't block load for environments where fetch is restricted
    }
  }

  const s = document.createElement("script");
  s.id = GAME_SCRIPT_ID;
  s.type = "module";
  s.src = entryUrl;

  s.onload = () => {
    console.log("[bootstrap] Loaded:", s.src);
    try {
      if (window.PQ_BOOT_DIAG && typeof window.PQ_BOOT_DIAG.markBootOk === 'function') {
        window.PQ_BOOT_DIAG.markBootOk();
      }
    } catch (_) {}
  };
  s.onerror = () => {
    console.error("[bootstrap] Failed to load:", s.src);
    alert(`Failed to load:\n${s.src}\n\nCheck DevTools Console for details.`);
    try {
      diagPush('scriptLoadError', { src: String(s.src || entryUrl || ''), version: version.id });
      if (window.PQ_BOOT_DIAG && window.PQ_BOOT_DIAG.renderOverlay) window.PQ_BOOT_DIAG.renderOverlay();
    } catch (_) {}
    if (typeof onFail === "function") onFail();
  };

  document.head.appendChild(s);
}

/* --------------------------- modal (use game's modal shell) --------------------------- */

function getModalEls() {
  const modal = document.getElementById("modal");
  const title = document.getElementById("modalTitle");
  const body = document.getElementById("modalBody");
  const close = document.getElementById("modalClose");
  return { modal, title, body, close };
}

function ensureBootstrapModalCloseHandlers() {
  const { modal, close } = getModalEls();
  if (!modal) return;

  // Avoid stacking duplicate listeners.
  if (!modal.dataset.bootstrapCloseWired) {
    modal.dataset.bootstrapCloseWired = "1";

    // click outside panel closes (matches your existing UX)
    modal.addEventListener("click", (e) => {
      if (e.target === modal) hideBootstrapModal();
    });

    if (close) {
      close.addEventListener("click", () => hideBootstrapModal());
    }
  }
}

function showBootstrapModal(titleText, contentNode) {
  const { modal, title, body } = getModalEls();
  if (!modal || !title || !body) return;

  ensureBootstrapModalCloseHandlers();

  title.textContent = titleText;

  body.innerHTML = "";
  body.appendChild(contentNode);

  try { modal.dataset.owner = "bootstrap"; modal.dataset.lock = "0"; } catch (_) {}

  modal.classList.remove("hidden");
  modal.dataset.bootstrapOpen = "1";
}

function hideBootstrapModal() {
  const { modal, body } = getModalEls();
  if (!modal) return;

  // Don’t close if someone else locked the modal (acceptance gate).
  try {
    if (modal.dataset.lock === "1" && modal.dataset.owner && modal.dataset.owner !== "bootstrap") return;
  } catch (_) {}

  // Only close what we opened (so we don’t fight game code if it opens its own modal)
  if (modal.dataset.bootstrapOpen === "1" && (!modal.dataset.owner || modal.dataset.owner === "bootstrap")) {
    modal.classList.add("hidden");
    modal.dataset.bootstrapOpen = "0";
    try { if (modal.dataset.owner === "bootstrap") modal.dataset.owner = ""; } catch (_) {}
    if (body) body.innerHTML = "";
  }
}

/* --------------------------- version picker UI --------------------------- */

function openVersionModal({ requirePick = false } = {}) {
  // If only one build exists, there is nothing to pick.
  const only = getOnlyVersionIfSingle();
  if (only) return;

  const pickedId = pickVersionId();
  const picked = VERSIONS.find(v => v.id === pickedId);

  const wrap = document.createElement("div");
  wrap.className = "version-modal";

  const subtitle = document.createElement("div");
  subtitle.className = "modal-subtitle";
  subtitle.textContent = "Pick which build to load. This device will remember your choice.";
  wrap.appendChild(subtitle);

  const current = document.createElement("div");
  current.className = "hint";
  current.style.textAlign = "left";
  current.style.marginTop = "0";
  current.textContent = picked ? `Current: ${picked.label}` : "Current: (none selected)";
  wrap.appendChild(current);

  const list = document.createElement("div");
  list.className = "version-modal-list";

  VERSIONS.forEach(v => {
    const btn = document.createElement("button");
    btn.type = "button";

    // Highlight current selection
    btn.className = (picked && v.id === picked.id) ? "btn primary" : "btn outline";
    btn.textContent = v.label;

    btn.addEventListener("click", () => {
      safeStorageSet(STORAGE_KEY, v.id);
      location.href = normalizeUrlWithoutQueryV(); // clean swap, no leftover ?v=
    });

    list.appendChild(btn);
  });

  // Optional cancel button (only if you already have something selected)
  if (!requirePick && picked) {
    const cancel = document.createElement("button");
    cancel.type = "button";
    cancel.className = "btn outline";
    cancel.textContent = "Cancel";
    cancel.addEventListener("click", () => hideBootstrapModal());
    list.appendChild(cancel);
  }

  wrap.appendChild(list);
  showBootstrapModal("Select Game Version", wrap);
}

/* --------------------------- main menu button injection --------------------------- */

function insertAfter(newNode, referenceNode) {
  referenceNode.parentNode.insertBefore(newNode, referenceNode.nextSibling);
}

function removeChangeVersionButtonIfPresent() {
  const existing = document.getElementById(BTN_ID);
  if (existing) existing.remove();
}

function ensureChangeVersionButton() {
  // Only show if there are multiple versions.
  if (!Array.isArray(VERSIONS) || VERSIONS.length <= 1) {
    removeChangeVersionButtonIfPresent();
    return;
  }

  // If it already exists, do nothing
  if (document.getElementById(BTN_ID)) return;

  const mainMenu = document.getElementById("mainMenu");
  const card = mainMenu ? mainMenu.querySelector(".card") : null;
  if (!card) return;

  const btn = document.createElement("button");
  btn.id = BTN_ID;
  btn.type = "button";
  btn.className = "btn outline";
  btn.textContent = "Change Version";
  btn.addEventListener("click", () => openVersionModal({ requirePick: false }));

  // Place it near other main menu buttons (right after Changelog if present)
  const after = document.getElementById("btnChangelog")
            || document.getElementById("btnSettingsMain")
            || document.getElementById("btnLoadGame")
            || document.getElementById("btnNewGame");

  if (after && after.parentElement === card) {
    insertAfter(btn, after);
  } else {
    card.appendChild(btn);
  }
}

/* --------------------------- bootstrap init --------------------------- */

function initBootstrap() {
  onDocReady(() => {
    // Wire HUD/modal pill tap highlight immediately (before game module loads)
    // so feedback is consistent across early boot and in-game overlays.
    wirePillTapHighlight();

    // If only one build exists: auto-load it and don't show the Change Version button.
    const only = getOnlyVersionIfSingle();
    if (only) {
      removeChangeVersionButtonIfPresent();
      // Keep localStorage consistent (optional but helpful for debugging)
      safeStorageSet(STORAGE_KEY, only.id);
      loadGameVersion(only);
      return;
    }

    // Multiple builds: show the Change Version button.
    ensureChangeVersionButton();

    const pickedId = pickVersionId();
    const picked = VERSIONS.find(v => v.id === pickedId);

    // If query param used and valid, persist it so it “sticks”
    const url = new URL(location.href);
    const q = url.searchParams.get("v");
    if (q && picked) safeStorageSet(STORAGE_KEY, picked.id);

    if (picked) {
      loadGameVersion(picked, { onFail: () => openVersionModal({ requirePick: true }) });
    } else {
      // Force first-time selection (cleanest when you’re managing multiple builds)
      openVersionModal({ requirePick: true });
    }
  });
}

initBootstrap();