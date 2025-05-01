async function generateTrailerLinks() {
  const res = await fetch("https://valid-grossly-gibbon.ngrok-free.app/trailer-ids", {
    headers: { "ngrok-skip-browser-warning": "true" }
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

function switchTab(tabId) {
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.content').forEach(c => c.classList.remove('active'));
  document.querySelector(`.tab[onclick*="${tabId}"]`).classList.add('active');
  document.getElementById(tabId).classList.add('active');
}

async function submitField(fieldNumber) {
  const fieldValue = document.getElementById(`field${fieldNumber}`).value.trim();
  if (!fieldValue) return;

  const response = await fetch("https://valid-grossly-gibbon.ngrok-free.app/submit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ field: fieldNumber, json: fieldValue })
  });

  if (response.ok && fieldNumber === 1) {
    const trailerJson = await fetch("https://valid-grossly-gibbon.ngrok-free.app/data/trailers.json", {
      headers: { "ngrok-skip-browser-warning": "true" }
    });
    const data = await trailerJson.json();
    const pretty = JSON.stringify(data, null, 2);
    document.getElementById("jsonViewer").textContent = pretty;
    document.getElementById("jsonSummary").textContent = pretty;
    await generateTrailerLinks(); // Refresh trailer links after init submission
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

function updateInitLink() {
  const input = document.getElementById("customDate").value.trim();
  const valid = /^\d{4}\/\d{2}\/\d{2}$/.test(input);
  const now = new Date();
  if (now.getHours() < 6) now.setDate(now.getDate() - 1);
  const fallback = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}/${String(now.getDate()).padStart(2, '0')}`;
  const date = valid ? input : fallback;

  const link = document.getElementById("init");
  const url = `https://radapps3.wal-mart.com/Protected/CaseVisibility/ashx/Main.ashx?func=init&storeNbr=5307&businessDate=${date}`;
  link.href = url;
  link.innerText = url;
}

document.addEventListener("DOMContentLoaded", () => {
  updateInitLink();
  document.getElementById("customDate").addEventListener("input", updateInitLink);
  generateTrailerLinks();
});
