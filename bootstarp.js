// bootstrap.js

const VERSIONS = [
  { id: "v1", label: "Stable (v1)", src: "game_v1.js" },
  { id: "v2", label: "Dev (v2)",    src: "game_v2.js" },
];

const STORAGE_KEY = "selected_game_version";

window.addEventListener("load", () => {
  const saved = localStorage.getItem(STORAGE_KEY);
  const match = VERSIONS.find(v => v.id === saved);

  if (match) {
    loadGameVersion(match);
  } else {
    showVersionPicker();
  }
});

function showVersionPicker() {
  const overlay = document.createElement("div");
  overlay.id = "versionPicker";

  overlay.innerHTML = `
    <div class="panel">
      <h2>Select Game Version</h2>
      <div id="versionButtons"></div>
    </div>
  `;

  const btnWrap = overlay.querySelector("#versionButtons");

  VERSIONS.forEach(v => {
    const btn = document.createElement("button");
    btn.textContent = v.label;
    btn.addEventListener("click", () => {
      localStorage.setItem(STORAGE_KEY, v.id);
      overlay.remove();
      loadGameVersion(v);
    });
    btnWrap.appendChild(btn);
  });

  // Optional: add a "reset choice" if you want
  const resetHint = document.createElement("button");
  resetHint.textContent = "Always ask on startup";
  resetHint.addEventListener("click", () => {
    localStorage.removeItem(STORAGE_KEY);
    // do nothing else; they can just pick a version now
  });
  btnWrap.appendChild(resetHint);

  document.body.appendChild(overlay);
}

function loadGameVersion(version) {
  // Optional: cache-bust during dev
  const src = version.src + (version.id === "v2" ? `?t=${Date.now()}` : "");

  const s = document.createElement("script");
  s.src = src;
  s.defer = true;

  s.onload = () => {
    // If your game exposes an init function, you can call it here.
    // Example: window.startGame?.();
  };

  s.onerror = () => {
    alert(`Failed to load ${version.label} (${version.src})`);
  };

  document.head.appendChild(s);
}