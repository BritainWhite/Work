function switchTab(tabId) {
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.content').forEach(c => c.classList.remove('active'));
  document.querySelector(`.tab[onclick*="${tabId}"]`).classList.add('active');
  document.getElementById(tabId).classList.add('active');
}

function selectDayTab(day) {
  document.querySelectorAll('.subtab').forEach(btn => btn.classList.remove('active'));
  document.querySelector(`.subtab[onclick*="${day}"]`).classList.add('active');
  updateDateByDay(day);
  updateSubmitButton(day);
  loadIframe();
}

function updateDateByDay(dayType) {
  const today = new Date();
  if (today.getHours() < 6) today.setDate(today.getDate() - 1);
  const offset = dayType === 'yesterday' ? -1 : dayType === 'tomorrow' ? 1 : 0;
  today.setDate(today.getDate() + offset);
  const formatted = `${today.getFullYear()}/${String(today.getMonth() + 1).padStart(2, '0')}/${String(today.getDate()).padStart(2, '0')}`;
  document.getElementById("customDate").value = formatted;
  updateLink();
}

function updateSubmitButton(day) {
  const submitBtn = document.querySelector('#initTab button[onclick^="submitField"]');
  if (submitBtn) {
    submitBtn.textContent = `Submit ${day.charAt(0).toUpperCase() + day.slice(1)}`;
  }
}

function updateLink() {
  const customInput = document.getElementById("customDate");
  const link = document.getElementById("init");
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

window.addEventListener("DOMContentLoaded", async () => {
  const customInput = document.getElementById("customDate");
  let debounceTimer;

  customInput.addEventListener("input", () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      updateLink();
      loadIframe();
    }, 600);
  });

  updateDateByDay("today");
  await generateTrailerLinks();
});
