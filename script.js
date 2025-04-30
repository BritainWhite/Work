document.getElementById("jsonForm").addEventListener("submit", async function (e) {
  e.preventDefault();

  const fields = Array.from({ length: 9 }, (_, i) => document.getElementById(`field${i + 1}`).value.trim());
  
  const filledFields = fields.filter(f => f !== "");
  if (filledFields.length !== 1) {
    document.getElementById("status").innerText = "Please fill exactly ONE field.";
    return;
  }
  
  let fieldNumber = fields.findIndex(f => f !== "") + 1;
  let response;

  try {
    response = await fetch("https://valid-grossly-gibbon.ngrok-free.app/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        field: fieldNumber,
        json: filledFields[0]
      })
    });
  } catch (err) {
    document.getElementById("status").innerText = "Error: Could not reach server.";
    return;
  }

  if (response.ok) {
    document.getElementById("status").innerText = "Submitted successfully!";
    document.getElementById("jsonForm").reset();
  } else {
    const error = await response.text();
    document.getElementById("status").innerText = `Server error: ${error}`;
  }
});

window.addEventListener("DOMContentLoaded", function () {
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

  // Update link immediately and whenever the input changes
  updateLink();
  customInput.addEventListener("input", updateLink);
});

document.getElementById("fetchAndSave").addEventListener("click", async () => {
  const url = document.getElementById("init").href;

  try {
    const response = await fetch(url);
    const text = await response.text(); // Get raw HTML, XML, etc.

    // Send the content to your local server
    const submitRes = await fetch("https://valid-grossly-gibbon.ngrok-free.app/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        field: 99, // We'll treat 99 as "test1.json" on the server
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
});
