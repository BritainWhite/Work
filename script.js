async function generateTrailerLinks() {
  const trailerTab = document.getElementById("trailerTab");
  if (!trailerTab) return;

  let container = document.getElementById("trailerLinks");
  if (!container) {
    container = document.createElement("div");
    container.id = "trailerLinks";
    trailerTab.appendChild(container);
  }

  const res = await fetch("https://valid-grossly-gibbon.ngrok-free.app/trailer-ids", {
    headers: { "ngrok-skip-browser-warning": "true" }
  });

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
  if (submitBtn) {
    submitBtn.textContent = `Submit ${day.charAt(0).toUpperCase() + day.slice(1)}`;
  }
}

async function updateLastModifiedLabel() {
  try {
    const res = await fetch("https://valid-grossly-gibbon.ngrok-free.app/last-modified/code", {
      headers: { "ngrok-skip-browser-warning": "true" }
    });

    const data = await res.json();
    const label = document.getElementById("lastUpdatedLabel");
    if (!label || !data["script.js"] || !data["index.html"] || !data["server.js"]) return;

    const times = [data["index.html"], data["script.js"], data["server.js"]]
      .map(t => new Date(t))
      .filter(d => !isNaN(d));

    if (!times.length) return;

    const latest = new Date(Math.max(...times));
    const now = new Date();
    const diffMs = now - latest;

    const minutes = Math.floor(diffMs / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    let text;
    if (days > 0) text = `Code last updated ${days} day${days > 1 ? "s" : ""} ago`;
    else if (hours > 0) text = `Code last updated ${hours} hour${hours > 1 ? "s" : ""} ago`;
    else if (minutes > 0) text = `Code last updated ${minutes} minute${minutes > 1 ? "s" : ""} ago`;
    else text = "Code last updated just now";

    label.textContent = text;
    label.title = `Last change: ${latest.toLocaleString()}`;
  } catch {
    const label = document.getElementById("lastUpdatedLabel");
    if (label) label.textContent = "";
  }
}

function updateDateByDay(dayType) {
  const customInput = document.getElementById("customDate");
  const today = new Date();
  if (today.getHours() < 6) today.setDate(today.getDate() - 1);

  const offset = dayType === 'yesterday' ? -1 : dayType === 'tomorrow' ? 1 : 0;
  today.setDate(today.getDate() + offset);

  const formatted = `${today.getFullYear()}/${String(today.getMonth() + 1).padStart(2, '0')}/${String(today.getDate()).padStart(2, '0')}`;
  customInput.value = formatted;

  updateLink();
  loadIframe();
  updateLastModifiedLabel();
}

function selectDayTab(day) {
  document.querySelectorAll('.subtab').forEach(btn => btn.classList.remove('active'));
  const targetBtn = document.querySelector(`.subtab[data-day="${day}"]`);
  if (targetBtn) targetBtn.classList.add('active');
  updateDateByDay(day);
  updateSubmitButton(day);
}

window.addEventListener("DOMContentLoaded", async () => {
  console.log("🚀 DOMContentLoaded");

  const customInput = document.getElementById("customDate");
  let debounceTimer;

  customInput.addEventListener("input", () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      console.log("📆 Custom date input changed:", customInput.value.trim());
      updateLink();
      loadIframe();
      updateLastModifiedLabel();
    }, 600);
  });

  selectDayTab("today");
  await generateTrailerLinks();
  await updateLastModifiedLabel();

  try {
    console.log("📡 Fetching trailers.json...");
    const res = await fetch("https://valid-grossly-gibbon.ngrok-free.app/data/trailers.json");
    if (!res.ok) {
      console.error("❌ Failed to fetch trailers.json:", res.status);
      return;
    }

    const json = await res.json();
    const dateStr = json.business_date?.replace(/-/g, "/") ?? "";
    console.log("📦 trailers.json loaded:", json);
    loadTrailerTabs(json, dateStr);
  } catch (err) {
    console.error("❌ Exception during preload of trailers.json:", err);
  }
});


async function submitField(fieldNumber) {
  const fieldValue = document.getElementById(`field${fieldNumber}`).value.trim();
  if (!fieldValue) return;

  const activeDay = getActiveDay();
  const file = activeDay === "yesterday" ? "yesterday.json" : activeDay === "tomorrow" ? "tomorrow.json" : "today.json";
  const date = document.getElementById("customDate").value.trim();

  const response = await fetch("https://valid-grossly-gibbon.ngrok-free.app/submit-alt", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ file, json: fieldValue })
  });

  if (response.ok) {
    const json = await (await fetch(`https://valid-grossly-gibbon.ngrok-free.app/json/${file}`)).json();
    const dateStr = json.schedule?.business_date?.replace(/-/g, "/") ?? date;
    loadTrailerTabs(json, dateStr);
    await updateLastModifiedLabel();
  } else {
    const errorText = await response.text();
    alert(`Server error: ${errorText}`);
  }
}

async function submitTrailers() {
  for (let i = 2; i <= 9; i++) {
    const val = document.getElementById(`field${i}`).value.trim();
    if (val) {
      await fetch("https://valid-grossly-gibbon.ngrok-free.app/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ field: i, json: val })
      });
    }
  }

  const res = await fetch("https://valid-grossly-gibbon.ngrok-free.app/data/trailers.json");
  if (res.ok) {
    const json = await res.json();
    const dateStr = json.business_date?.replace(/-/g, "/") ?? "";
    loadTrailerTabs(json, dateStr);
  }

  alert("Trailers submitted.");
}

async function submitAttendance() {
  const text = document.getElementById("attendanceText").value.trim();
  if (!text) return alert("Please paste attendance text first.");

  try {
    const res = await fetch("https://valid-grossly-gibbon.ngrok-free.app/attendance", {
      method: "POST",
      headers: { "Content-Type": "text/plain" },
      body: text
    });

    alert(res.ok ? "Attendance submitted!" : "Server error: " + await res.text());
  } catch (err) {
    alert("Fetch failed: " + err.message);
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
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.content').forEach(c => c.classList.remove('active'));
  document.querySelector(`.tab[onclick*="${tabId}"]`).classList.add('active');
  document.getElementById(tabId).classList.add('active');

  if (tabId === "initTab") {
    updateLink();
    loadIframe();
    updateLastModifiedLabel();
  }
}

function loadTrailerTabs(json, dateStr) {
  const container = document.getElementById("trailerSubtabsContainer");
  if (!container) {
    console.warn("🚫 [loadTrailerTabs] No container with ID 'trailerSubtabsContainer' found.");
    return;
  }

  console.log("🔍 [loadTrailerTabs] Called with date:", dateStr);
  console.log("📦 [loadTrailerTabs] Raw input JSON:", json);

  container.innerHTML = "";

  const trailers = json?.trailers ?? json?.shipments?.data?.trailers?.payload ?? [];
  if (!Array.isArray(trailers)) {
    console.warn("🚫 [loadTrailerTabs] No trailers array found in input JSON.");
    container.innerText = "No trailers found.";
    return;
  }

  if (trailers.length === 0) {
    console.warn("⚠️ [loadTrailerTabs] Trailer array is empty.");
    container.innerText = "No trailers found.";
    return;
  }

  console.log(`✅ [loadTrailerTabs] Found ${trailers.length} trailers.`);

  const tabBar = document.createElement("div");
  tabBar.className = "subtabs";

  const contentWrapper = document.createElement("div");
  container.appendChild(tabBar);
  container.appendChild(contentWrapper);

  trailers.forEach((trailer, idx) => {
    const transLoadId = trailer.transLoadId;
    if (!transLoadId) {
      console.warn(`❌ [loadTrailerTabs] Missing transLoadId for trailer at index ${idx}:`, trailer);
      return;
    }

    console.log(`➕ [loadTrailerTabs] Creating tab for Trailer ${idx + 1}: ${transLoadId}`);

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
      const res = await fetch("https://valid-grossly-gibbon.ngrok-free.app/submit-alt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
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
