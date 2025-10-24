// script.js
const API = "https://valid-grossly-gibbon.ngrok-free.app";
const JSON_HEADERS = { "Content-Type": "application/json", "ngrok-skip-browser-warning": "true" };
const PLAIN_HEADERS = { "Content-Type": "text/plain", "ngrok-skip-browser-warning": "true" };

function api(path) { return `${API}${path.startsWith("/") ? path : "/" + path}`; }
function hardRefresh() { const u = new URL(location.href); u.searchParams.set("_", Date.now()); location.href = u.toString(); }

function switchTab(tabId) {
  document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
  document.querySelectorAll(".content").forEach(c => c.classList.remove("active"));
  document.querySelector(`.tab[onclick*="${tabId}"]`).classList.add("active");
  document.getElementById(tabId).classList.add("active");
  if (tabId === "initTab") { updateLink(); loadIframe(); }
}

/* ---------- Freight (init) ---------- */
function getActiveDay() { return document.querySelector(".subtab.active")?.textContent.toLowerCase().trim() || "today"; }
function updateSubmitButton(day) {
  const btn = document.querySelector('#initTab button[onclick^="submitField"]');
  if (btn) btn.textContent = `Submit ${day.charAt(0).toUpperCase() + day.slice(1)}`;
}
function updateDateByDay(day) {
  const input = document.getElementById("customDate");
  const d = new Date();
  if (d.getHours() < 6) d.setDate(d.getDate() - 1);
  if (day === "yesterday") d.setDate(d.getDate() - 1);
  if (day === "tomorrow") d.setDate(d.getDate() + 1);
  const yyyy = d.getFullYear(); const mm = String(d.getMonth() + 1).padStart(2, "0"); const dd = String(d.getDate()).padStart(2, "0");
  input.value = `${yyyy}/${mm}/${dd}`; updateLink();
}
function selectDayTab(day) {
  document.querySelectorAll(".subtab").forEach(b => b.classList.remove("active"));
  const btn = document.querySelector(`.subtab[data-day="${day}"]`); if (btn) btn.classList.add("active");
  updateDateByDay(day); updateSubmitButton(day);
}
function updateLink() {
  const customInput = document.getElementById("customDate");
  const inputValue = customInput.value.trim();
  const validFormat = /^\d{4}\/\d{2}\/\d{2}$/;
  let formattedDate;
  if (inputValue && validFormat.test(inputValue)) formattedDate = inputValue;
  else {
    const now = new Date(); if (now.getHours() < 6) now.setDate(now.getDate() - 1);
    formattedDate = now.toISOString().slice(0,10).replace(/-/g,"/");
  }
  const url = `https://radapps3.wal-mart.com/Protected/CaseVisibility/ashx/Main.ashx?func=init&storeNbr=5307&businessDate=${formattedDate}`;
  const link = document.getElementById("init"); link.href = url; link.innerText = url;
}
function loadIframe() { const url = document.getElementById("init").href; const ifr = document.getElementById("previewIframe"); const panel = document.getElementById("iframePanel"); ifr.src = url; panel.style.display = "block"; }
async function submitField(fieldNumber) {
  const fieldValue = document.getElementById(`field${fieldNumber}`).value.trim();
  if (!fieldValue) return;
  const activeDay = getActiveDay();
  const file = activeDay === "yesterday" ? "yesterday.json" : activeDay === "tomorrow" ? "tomorrow.json" : "today.json";
  const resp = await fetch(api("/submit-alt"), { method: "POST", headers: JSON_HEADERS, body: JSON.stringify({ file, json: fieldValue }) });
  alert(resp.ok ? `Saved ${file}` : `Server error: ${await resp.text()}`);
}

/* ---------- Attendance ---------- */
async function submitAttendance() {
  const text = document.getElementById("attendanceText").value.trim();
  if (!text) return alert("Please paste attendance text first.");
  try {
    const res = await fetch(api("/attendance"), { method: "POST", headers: PLAIN_HEADERS, body: text });
    alert(res.ok ? "Attendance submitted!" : "Server error: " + (await res.text()));
  } catch (e) { alert("Fetch failed: " + e.message); }
}

/* ---------- Trailers workbench (large JSON safe) ---------- */
let TRAILER_STATE = {
  list: [],
  selectedIndex: -1,
  // captured payload not rendered in the DOM (prevents freezes on huge texts)
  capturedText: null,
  capturedFrom: null // "paste" | "file" | null
};

async function refreshTrailerUrls() {
  const statusEl = document.getElementById("trailerUrlsStatus");
  const wb = document.getElementById("trailersWorkbench");
  const pills = document.getElementById("trailerPills");

  statusEl.textContent = "loading…";
  wb.style.display = "none";
  pills.innerHTML = "";
  clearTrailerView();

  try {
    const res = await fetch(api("/rad/urls"), { headers: { "ngrok-skip-browser-warning": "true" } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const urls = Array.isArray(data.trailerUrls) ? data.trailerUrls : [];

    TRAILER_STATE.list = urls.map((u, i) => ({ ...u, index: i + 1 })); // 1-based
    TRAILER_STATE.selectedIndex = -1;

    if (!TRAILER_STATE.list.length) {
      statusEl.textContent = "waiting for server… (no trailer URLs yet)";
      return;
    }

    // Build pills
    for (const item of TRAILER_STATE.list) {
      const btn = document.createElement("button");
      btn.className = "pill";
      btn.textContent = `Trailer ${item.index}`;
      btn.onclick = () => selectTrailer(item.index);
      pills.appendChild(btn);
    }

    wb.style.display = "block";
    statusEl.textContent = `${TRAILER_STATE.list.length} trailer URL(s)`;
  } catch (err) {
    statusEl.textContent = "failed to load trailer URLs";
    console.error("refreshTrailerUrls error:", err);
  }
}

function clearTrailerView() {
  TRAILER_STATE.capturedText = null;
  TRAILER_STATE.capturedFrom = null;

  document.getElementById("trailerHeader").textContent = "Select a trailer…";
  const a = document.getElementById("trailerLink"); a.style.display = "none"; a.href = "#"; a.textContent = "";
  document.getElementById("btnLoadTrailer").style.display = "none";
  document.getElementById("trailerIframePanel").style.display = "none";
  document.getElementById("trailerIframe").src = "";

  const box = document.getElementById("trailerJsonBox");
  box.style.display = "none"; box.value = ""; // small texts only

  document.getElementById("btnSendTrailer").style.display = "none";
  document.getElementById("captureRow").style.display = "none";
  document.getElementById("payloadStatus").textContent = "";
  document.querySelectorAll(".pill").forEach(p=>p.classList.remove("active"));
}

function selectTrailer(index) {
  TRAILER_STATE.selectedIndex = index;
  const item = TRAILER_STATE.list.find(x => x.index === index);
  if (!item) return;

  document.querySelectorAll(".pill").forEach(p=>p.classList.remove("active"));
  const pills = document.getElementById("trailerPills").children;
  if (pills[index-1]) pills[index-1].classList.add("active");

  const head = document.getElementById("trailerHeader");
  head.innerHTML = `<span class="badge">${item.ttype}</span> Trailer ${index} — loadID ${item.loadId}`;

  const a = document.getElementById("trailerLink");
  a.href = item.url; a.textContent = item.url; a.style.display = "inline";

  document.getElementById("btnLoadTrailer").style.display = "inline-block";

  // show capture controls
  document.getElementById("captureRow").style.display = "flex";

  // show textarea (small JSON friendly)
  const box = document.getElementById("trailerJsonBox");
  box.placeholder = `Paste JSON for trailer${index}.json (large pastes will be captured without rendering)`;
  box.style.display = "block";
  document.getElementById("btnSendTrailer").style.display = "inline-block";
}

// Load in iframe
function loadSelectedTrailer() {
  const item = TRAILER_STATE.list.find(x => x.index === TRAILER_STATE.selectedIndex);
  if (!item) return;
  const ifr = document.getElementById("trailerIframe");
  ifr.src = item.url;
  document.getElementById("trailerIframePanel").style.display = "block";
}

// Capture: paste without rendering
(function enablePasteInterceptor() {
  const box = document.getElementById("trailerJsonBox");
  box.addEventListener("paste", (e) => {
    // If the paste is very large, don't render it—stash it in memory.
    const text = e.clipboardData?.getData("text") || "";
    if (text && text.length > 50000) { // ~50 KB threshold; tweak as needed
      e.preventDefault();
      TRAILER_STATE.capturedText = text;
      TRAILER_STATE.capturedFrom = "paste";
      document.getElementById("payloadStatus").textContent =
        `captured ${formatSize(text.length)} from clipboard (not rendered)`;
      box.value = ""; // keep small/empty
    }
  });
})();

// Capture: explicit Paste from Clipboard button
async function captureClipboard() {
  try {
    const text = await navigator.clipboard.readText();
    if (!text) return;
    TRAILER_STATE.capturedText = text;
    TRAILER_STATE.capturedFrom = "paste";
    document.getElementById("payloadStatus").textContent =
      `captured ${formatSize(text.length)} from clipboard (not rendered)`;
    // leave textarea alone
  } catch (e) {
    alert("Clipboard read failed (browser permissions). You can still paste into the box.");
  }
}

// Capture: file upload
document.addEventListener("change", (e) => {
  const picker = document.getElementById("filePicker");
  if (e.target === picker && picker.files && picker.files[0]) {
    handleFile(picker.files[0]);
    picker.value = ""; // reset
  }
});

function handleFile(file) {
  const reader = new FileReader();
  reader.onload = () => {
    const text = String(reader.result || "");
    TRAILER_STATE.capturedText = text;
    TRAILER_STATE.capturedFrom = "file";
    document.getElementById("payloadStatus").textContent =
      `captured ${formatSize(text.length)} from file (${file.name})`;
  };
  reader.readAsText(file);
}

function formatSize(bytes) {
  const kb = bytes / 1024, mb = kb / 1024;
  return mb >= 1 ? `${mb.toFixed(2)} MB` : `${Math.ceil(kb)} KB`;
}

// Send JSON (uses capturedText if present, else textarea value)
async function sendSelectedTrailer() {
  const idx = TRAILER_STATE.selectedIndex;
  if (idx < 1) return alert("Pick a trailer first.");

  const box = document.getElementById("trailerJsonBox");
  let payload = TRAILER_STATE.capturedText;
  if (!payload) {
    // small paste typed by user
    const v = box.value.trim();
    if (!v) return alert("Paste or upload trailer JSON first.");
    payload = v;
  }

  const file = `trailer${idx}.json`;
  try {
    const res = await fetch(api("/submit-alt"), {
      method: "POST",
      headers: JSON_HEADERS,
      body: JSON.stringify({ file, json: payload })
    });
    alert(res.ok ? `Saved ${file}` : `Server error: ${await res.text()}`);
  } catch (e) {
    alert("Fetch failed: " + e.message);
  }
}

/* ---------- boot ---------- */
window.addEventListener("DOMContentLoaded", () => {
  selectDayTab("today");
  updateLink();
  loadIframe();
  refreshTrailerUrls();
});
