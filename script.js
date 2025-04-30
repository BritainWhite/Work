async function generateTrailerLinks() {
  const res = await fetch("https://valid-grossly-gibbon.ngrok-free.app/trailer-ids");
  const { business_date, trailer_transLoadId_list } = await res.json();

  if (!business_date || !Array.isArray(trailer_transLoadId_list)) return;

  const container = document.getElementById("trailerLinks");
  container.innerHTML = ""; // Clear existing

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

window.addEventListener("DOMContentLoaded", async () => {
  const customInput = document.getElementById("customDate");
  const link = document.getElementById("init");

  function updateLink() {
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
    link.href = url;
    link.innerText = url;
  }

  updateLink();
  customInput.addEventListener("input", updateLink);

  await generateTrailerLinks(); // Fetch trailer links on page load
});

document.getElementById("fetchAndSave").addEventListener("click", async () => {
  const url = document.getElementById("init").href;

  try {
    const response = await fetch(url);
    const text = await response.text();

    const submitRes = await fetch("https://valid-grossly-gibbon.ngrok-free.app/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ field: 99, json: text })
    });

    if (submitRes.ok) {
      alert("Fetched and saved as test1.json!");
      await generateTrailerLinks(); // ✅ Refresh links only if submit was OK
    } else {
      const errorText = await submitRes.text();
      alert("Server error: " + errorText);
    }
  } catch (err) {
    alert("Fetch failed: " + err.message);
  }
});
