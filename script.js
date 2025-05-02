async function generateTrailerLinks() {
  const res = await fetch("https://valid-grossly-gibbon.ngrok-free.app/trailer-ids", {
    headers: {
      "ngrok-skip-browser-warning": "true"
    }
  });
  const { business_date, trailer_transLoadId_list } = await res.json();

  if (!business_date || !Array.isArray(trailer_transLoadId_list)) return;

  const container = document.getElementById("trailerLinks");
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

function updateLink() {
  const customInput = document.getElementById("customDate");
  let formattedDate;

  const inputValue = customInput.value.trim();
  const validFormat = /^\d{4}\/\d{2}\/\d{2}$/;

  if (inputValue && validFormat.test(inputValue)) {
    formattedDate = inputValue;
  } else {
    const now = new Date();
    if (now.getHours() < 6) now.setDate(now.getDate() - 1);
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const dd = String(now.getDate()).padStart(2, "0");
    formattedDate = `${yyyy}/${mm}/${dd}`;
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
}

function selectDayTab(day) {
  document.querySelectorAll('.subtab').forEach(btn => btn.classList.remove('active'));
  document.querySelector(`.subtab[onclick*="${day}"]`).classList.add('active');
  updateDateByDay(day);
  updateSubmitButton(day);
}

window.addEventListener("DOMContentLoaded", async () => {
  const customInput = document.getElementById("customDate");
  let debounceTimer;

  // Debounced input listener
  customInput.addEventListener("input", () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      updateLink();
      loadIframe();
    }, 600);
  });

  selectDayTab("today");
  await generateTrailerLinks();
});

async function submitField(fieldNumber) {
  const fieldValue = document.getElementById(`field${fieldNumber}`).value.trim();
  if (!fieldValue) return;

  const activeDay = document.querySelector(".subtab.active")?.textContent.toLowerCase() || "today";
  const endpoint = "submit-alt"; // Always use submit-alt for consistency
  const file = activeDay === "yesterday" ? "yesterday.json" : activeDay === "tomorrow" ? "tomorrow.json" : "init.json";

  const response = await fetch(`https://valid-grossly-gibbon.ngrok-free.app/${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ file, json: fieldValue })
  });

  if (response.ok) {
    const trailerJson = await fetch("https://valid-grossly-gibbon.ngrok-free.app/data/trailers.json", {
      headers: { "ngrok-skip-browser-warning": "true" }
    });
    const data = await trailerJson.json();
    const pretty = JSON.stringify(data, null, 2);
    document.getElementById("jsonViewer").textContent = pretty;
    document.getElementById("jsonSummary").textContent = pretty;
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

    if (res.ok) {
      alert("Attendance submitted!");
    } else {
      const error = await res.text();
      alert("Server error: " + error);
    }
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
}
