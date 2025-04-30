document.getElementById("jsonForm").addEventListener("submit", async function (e) {
  e.preventDefault();

  const f1 = document.getElementById("field1").value.trim();
  const f2 = document.getElementById("field2").value.trim();
  const f3 = document.getElementById("field3").value.trim();

  const filledFields = [f1, f2, f3].filter(f => f !== "");
  if (filledFields.length !== 1) {
    document.getElementById("status").innerText = "Please fill exactly ONE field.";
    return;
  }

  let fieldNumber = [f1, f2, f3].findIndex(f => f !== "") + 1;
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
