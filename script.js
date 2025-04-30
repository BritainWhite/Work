async function generateTrailerLinks() {
  try {
    const res = await fetch("https://valid-grossly-gibbon.ngrok-free.app/trailer-ids");
    const { business_date, trailer_transLoadId_list } = await res.json();

    const container = document.getElementById("trailerLinks");
    container.innerHTML = ""; // Clear any existing links

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
  } catch (err) {
    console.error("Failed to load trailer links", err);
  }
}

window.addEventListener("DOMContentLoaded", async function () {
  // Init link
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
      const currentHour = now.getHours();
      if (currentHour === 0 || currentHour < 6) {
        now.setDate(now.getDate() - 1);
      }

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

  // Now call the trailer link generator
  await generateTrailerLinks();
});

document.getElementById("fetchAndSave").addEventListener("click", async () => {
  const url = document.getElementById("init").href;

  try {
    const response = await fetch(url);
    const text = await response.text();

    const submitRes = await fetch("https://valid-grossly-gibbon.ngrok-free.app/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        field: 99,
        json: text
      })
    });

    if (submitRes.ok) {
      alert("Fetched and saved as test1.json!");
    } else {
      const errorText = await submitRes.text();
      alert("Server error: " + errorText);
    }
  } catch (err) {
    alert("Fetch failed: " + err.message);
  }
  await generateTrailerLinks(); // Refresh links based on new init data
});
