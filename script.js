// script.js
// Hosted on GitHub Pages. All API calls go to your ngrok HTTPS domain.

const API = "https://valid-grossly-gibbon.ngrok-free.app";
const JSON_HEADERS = { "Content-Type": "application/json", "ngrok-skip-browser-warning": "true" };
const PLAIN_HEADERS = { "Content-Type": "text/plain", "ngrok-skip-browser-warning": "true" };

function api(path) {
  return `${API}${path.startsWith("/") ? path : "/" + path}`;
}

function logToServer(message, data = null) {
  fetch(api("/client-log"), {
    method: "POST",
    headers: JSON_HEADERS,
    body: JSON.stringify({ time: new Date().toISOString(), message, data })
  }).catch(() => {});
}

// -----------------------------
// NEW: Fetch trailer URLs
// -----------------------------
async function refreshTrailerUrls() {
  const statusEl = document.getElementById("trailerUrlsStatus");
  const mainEl = document.getElementById("radMainUrl");
  const listEl = document.getElementById("trailerUrlList");

  if (!statusEl || !mainEl || !listEl) return;

  statusEl.textContent = "loading…";
  listEl.innerHTML = "";
  mainEl.textContent = "—";
  mainEl.classList.add("muted");

  try {
    const res = await fetch(api("/rad/urls"), {
      headers: { "ngrok-skip-browser-warning": "true" }
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    const urls = Array.isArray(data.trailerUrls) ? data.trailerUrls : [];
    const mainUrl = data.mainUrl || null;

    if (mainUrl) {
      const a = document.createElement("a");
      a.href = mainUrl;
      a.textContent = mainUrl;
      a.target = "_blank";
      mainEl.innerHTML = "";
      mainEl.classList.remove("muted");
      mainEl.appendChild(a);
    }

    if (!urls.length) {
      statusEl.textContent = "waiting for server… (no trailer URLs yet)";
      listEl.innerHTML = "";
      return;
    }

    for (const item of urls) {
      const li = document.createElement("li");
      const badge = document.createElement("span");
      badge.className = "badge";
      badge.textContent = item.ttype;
      const a = document.createElement("a");
      a.href = item.url;
      a.target = "_blank";
      a.textContent = item.url;
      li.appendChild(badge);
      li.appendChild(document.createTextNode(" "));
      li.appendChild(a);
      listEl.appendChild(li);
    }

    statusEl.textContent = `${urls.length} trailer URL(s)`;
  } catch (err) {
    statusEl.textContent = "failed to load trailer URLs";
    console.error("refreshTrailerUrls error:", err);
  }
}

// -----------------------------
// Existing Freight + Attendance Logic
// -----------------------------
function getActiveDay() {
  return document.querySelector(".subtab.active")?.textContent.toLowerCase().trim() || "today";
}

function updateLink() {
  const customInput = document.getElementById("customDate");
  const inputValue = customInput.value.trim();
  const validFormat = /^\d{4}\/\d{2}\/\d{2}$/;

  let formattedDate;
  if (inputValue && validFormat.test(inputValue)) {
    formattedDate = inputValue;
  } else {
    const now = new Date();
    if (now.getHours() < 6) now.setDate(now.getDate() - 1);
    formattedDate = now.toISOString().slice(0, 10).replace(/-/g, "/");
  }

  const url = `https://radapps3.wal-mart.com/Protected/CaseVisibility/ashx/Main.ashx?func=init&storeNbr=5307&businessDate=${formattedDate}`;
  const link = document.getElementById("init");
  link.href = url;
  link.innerText = url;
}

function updateSubmitButton(day) {
  const submitBtn = document.querySelector('#initTab button[onclick^="submitField"]');
  if (submitBtn) submitBtn.textContent = `Submit ${day.charAt(0).toUpperCase() + day.slice(1)}`;
}

function loadIframe() {
  const initUrl = document.getElementById("init").href;
  const iframe = document.getElementById("previewIframe");
  const panel = document.getElementById("iframePanel");
  iframe.src = initUrl;
  if (panel) panel.style.display = "block";
}

function switchTab(tabId) {
  document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
  document.querySelectorAll(".content").forEach(c => c.classList.remove("active"));
  document.querySelector(`.tab[onclick*="${tabId}"]`).classList.add("active");
  document.getElementById(tabId).classList.add("active");

  if (tabId === "initTab") {
    updateLink();
    loadIframe();
  }
}

function hardRefresh() {
  const url = new URL(location.href);
  url.searchParams.set("_", Date.now());
  location.href = url.toString();
}

function selectDayTab(day) {
  document.querySelectorAll(".subtab").forEach(btn => btn.classList.remove("active"));
  const targetBtn = document.querySelector(`.subtab[data-day="${day}"]`);
  if (targetBtn) targetBtn.classList.add("active");
  updateDateByDay(day);
  updateSubmitButton(day);
}

function updateDateByDay(day) {
  const input = document.getElementById("customDate");
  const d = new Date();
  if (d.getHours() < 6) d.setDate(d.getDate() - 1);
  if (day === "yesterday") d.setDate(d.getDate() - 1);
  if (day === "tomorrow") d.setDate(d.getDate() + 1);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  input.value = `${yyyy}/${mm}/${dd}`;
  updateLink();
}

// Submit Today/Yesterday/Tomorrow JSON
async function submitField(fieldNumber) {
  const fieldValue = document.getElementById(`field${fieldNumber}`).value.trim();
  if (!fieldValue) return;

  const activeDay = getActiveDay();
  const file = activeDay === "yesterday" ? "yesterday.json"
            : activeDay === "tomorrow"  ? "tomorrow.json"
            : "today.json";
  const date = document.getElementById("customDate").value.trim();

  const response = await fetch(api("/submit-alt"), {
    method: "POST",
    headers: JSON_HEADERS,
    body: JSON.stringify({ file, json: fieldValue })
  });

  if (response.ok) {
    alert(`Saved ${file}`);
  } else {
    const errorText = await response.text();
    alert(`Server error: ${errorText}`);
  }
}

// Submit trailer JSONs manually
async function submitTrailers() {
  for (let i = 2; i <= 9; i++) {
    const val = document.getElementById(`field${i}`).value.trim();
    if (val) {
      await fetch(api("/submit"), { method: "POST", headers: JSON_HEADERS, body: JSON.stringify({ field: i, json: val }) });
    }
  }
  alert("Trailers submitted.");
}

// Attendance
async function submitAttendance() {
  const text = document.getElementById("attendanceText").value.trim();
  if (!text) return alert("Please paste attendance text first.");

  try {
    const res = await fetch(api("/attendance"), { method: "POST", headers: PLAIN_HEADERS, body: text });
    alert(res.ok ? "Attendance submitted!" : "Server error: " + (await res.text()));
  } catch (err) {
    alert("Fetch failed: " + err.message);
  }
}

// Auto-load
window.addEventListener("DOMContentLoaded", () => {
  selectDayTab("today");
  updateLink();
  loadIframe();
  refreshTrailerUrls();
});
