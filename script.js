window.addEventListener("DOMContentLoaded", async () => {
  const customInput = document.getElementById("customDate");
  const link = document.getElementById("init");
  let debounceTimer;

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

  function loadIframe() {
    const iframe = document.getElementById("previewIframe");
    iframe.src = document.getElementById("init").href;
  }

  // Attach event listeners to update the iframe after changes
  customInput.addEventListener("input", () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      updateLink();
      loadIframe(); // Ensures iframe reloads after typing
    }, 600);
  });

  customInput.addEventListener("blur", () => {
    clearTimeout(debounceTimer);
    updateLink();
    loadIframe(); // Ensures iframe reloads when input loses focus
  });

  updateLink();
  loadIframe();  // Initial iframe load
  await generateTrailerLinks();
});
