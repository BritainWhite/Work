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

async function generateTrailerLinks() {
  const trailerTab = document.getElementById("trailerTab");
  if (!trailerTab) return;

  let container = document.getElementById("trailerLinks");
  if (!container) {
    container = document.createElement("div");
    container.id = "trailerLinks";
    trailerTab.appendChild(container);
  }

  const res = await fetch(api("/trailer-ids"), { headers: { "ngrok-skip-browser-warning": "true" } });
  const { business_date, trailer_transLoadId_list } = await res.json();
  if (!business_date || !Array.isArray(trailer_transLoadId_list)) return;

  container.innerHTML = "";
  const formattedDate = business_date.replace(/-/g, "/");

  trailer_transLoadId_list.forEach((id, index) => {
    const link = document.createElement("a");
    link.href = `https://radapps3.wal-mart.com/Protected/CaseVisibility/ashx/Shipments.ashx?func=getLoadSummaryAndDetailsFromAPI&storeNbr=5307&businessDate=${formattedDate}&loadID=${id}`;
    link.innerText = `Trailer ${index + 1}: ${id}`;
    link.target = "_blank";
    const wrapper = document.createElement("p");
    wrapper.appendChild(link);
    container.appendChild(wrapper);
  });
}

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

async function updateLastModifiedLabel() {
  try {
    const res = await fetch(api("/last-modified/code"), { headers: { "ngrok-skip-browser-warning": "true" } });
    const data = await res.json();
    const label = document.getElementById("lastUpdatedLabel");
    if (!label || !data["script.js"] || !data["index.html"] || !data["server.js"]) return;

    const times = [data["index.html"], data["script.js"], data["server.js"]]
      .map(t => new Date(t))
      .filter(d => !isNaN(d));

    if (times.length) {
      const latest = new Date(Math.max(...times.map(d => d.getTime())));
      label.textContent = `Last updated: ${latest.toLocaleString()}`;
    }
  } catch (_) {
    // ignore
  }
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
    updateLastModifiedLabel();
  }
}

function loadTrailerTabs(json, dateStr) {
  const container = document.getElementById("trailerSubtabsContainer");
  if (!container) {
    logToServer("[loadTrailerTabs] container not found");
    return;
  }

  const trailers = json?.trailers ?? json?.shipments?.data?.trailers?.payload ?? [];

  container.innerHTML = "";

  if (!Array.isArray(trailers) || trailers.length === 0) {
    const msg = !Array.isArray(trailers) ? "trailers is not an array" : "no trailers found";
    const visible = document.createElement("div");
    visible.style.background = "#ffecb3";
    visible.style.padding = "0.5em";
    visible.style.margin = "1em 0";
    visible.innerText = `[DEBUG] ${msg}`;
    container.appendChild(visible);
    return;
  }

  const visibleDebug = document.createElement("div");
  visibleDebug.style.background = "#ffecb3";
  visibleDebug.style.padding = "0.5em";
  visibleDebug.style.margin = "1em 0";
  visibleDebug.innerText = `[DEBUG] Found ${trailers.length} trailers in JSON`;
  container.appendChild(visibleDebug);

  const tabBar = document.createElement("div");
  tabBar.className = "subtabs";

  const contentWrapper = document.createElement("div");
  container.appendChild(tabBar);
  container.appendChild(contentWrapper);

  trailers.forEach((trailer, idx) => {
    const transLoadId = trailer.transLoadId;
    if (!transLoadId) return;

    const tab = document.createElement("button");
    tab.className = "subtab";
    tab.textContent = `Trailer ${idx + 1}: ${transLoadId}`;
    tab.dataset.tid = transLoadId;

    const content = document.createElement("div");
    content.className = "subtab-content";
    content.style.marginTop = "1em";

    const iframe = document.createElement("iframe");
    iframe.src = `https://radapps3.wal-mart.com/Protected/CaseVisibility/ashx/Shipments.ashx?func=getLoadSummaryAndDetailsFromAPI&storeNbr=5307&businessDate=${dateStr}&loadID=${transLoadId}`;
    iframe.style.width = "100%";
    iframe.style.height = "33vh";
    iframe.style.border = "1px solid #ccc";

    const textarea = document.createElement("textarea");
    textarea.placeholder = `Paste trailer JSON for ${transLoadId}`;
    textarea.style.marginTop = "1em";

    const submitBtn = document.createElement("button");
    submitBtn.textContent = "Submit Trailer";
    submitBtn.style.marginTop = "0.5em";
    submitBtn.onclick = async () => {
      const body = { file: `${transLoadId}.json`, json: textarea.value.trim() };
      const res = await fetch(api("/submit-alt"), { method: "POST", headers: JSON_HEADERS, body: JSON.stringify(body) });
      alert(res.ok ? `Saved ${body.file}` : `Error saving ${body.file}`);
    };

    content.appendChild(iframe);
    content.appendChild(textarea);
    content.appendChild(submitBtn);
    contentWrapper.appendChild(content);

    tab.onclick = () => {
      container.querySelectorAll(".subtab").forEach(t => t.classList.remove("active"));
      container.querySelectorAll(".subtab-content").forEach(c => c.style.display = "none");
      tab.classList.add("active");
      content.style.display = "block";
    };

    tabBar.appendChild(tab);
    if (idx === 0) tab.click();
  });
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

window.addEventListener("DOMContentLoaded", async () => {
  const customInput = document.getElementById("customDate");
  let debounceTimer;

  customInput.addEventListener("input", () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      updateLink();
      loadIframe();
      updateLastModifiedLabel();
    }, 600);
  });

  selectDayTab("today");
  await generateTrailerLinks();
  await updateLastModifiedLabel();

  try {
    const res = await fetch(api("/data/trailers.json"));
    const text = await res.text();
    const json = JSON.parse(text);
    const dateStr = json.business_date?.replace(/-/g, "/") ?? "";
    loadTrailerTabs(json, dateStr);
  } catch (_) {
    // ignore
  }
});

function updateDateByDay(day) {
  const input = document.getElementById("customDate");
  const d = new Date();
  if (d.getHours() < 6) d.setDate(d.getDate() - 1); // overnight adjustment

  if (day === "yesterday") d.setDate(d.getDate() - 1);
  if (day === "tomorrow") d.setDate(d.getDate() + 1);

  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  input.value = `${yyyy}/${mm}/${dd}`;

  updateLink();
}

// Submit Today/Yesterday/Tomorrow JSON (field1)
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
    const json = await (await fetch(api(`/json/${file}`))).json();
    const dateStr = json.schedule?.business_date?.replace(/-/g, "/") ?? date;
    loadTrailerTabs(json, dateStr);
    await updateLastModifiedLabel();
  } else {
    const errorText = await response.text();
    alert(`Server error: ${errorText}`);
  }
}

// Submit trailer2..trailer9 textareas
async function submitTrailers() {
  for (let i = 2; i <= 9; i++) {
    const val = document.getElementById(`field${i}`).value.trim();
    if (val) {
      await fetch(api("/submit"), { method: "POST", headers: JSON_HEADERS, body: JSON.stringify({ field: i, json: val }) });
    }
  }

  const res = await fetch(api("/data/trailers.json"));
  if (res.ok) {
    const json = await res.json();
    const dateStr = json.business_date?.replace(/-/g, "/") ?? "";
    loadTrailerTabs(json, dateStr);
  }

  alert("Trailers submitted.");
}

// Attendance textarea
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
