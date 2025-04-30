document.getElementById("jsonForm").addEventListener("submit", async function (e) {
  e.preventDefault();

  const f1 = document.getElementById("field1").value.trim();
  const f2 = document.getElementById("field2").value.trim();
  const f3 = document.getElementById("field3").value.trim();

  const files = [
    { content: f1, path: "doc1.json" },
    { content: f2, path: "doc2.json" },
    { content: f3, path: "doc3.json" },
  ];

  const filled = files.filter(f => f.content);
  if (filled.length !== 1) {
    document.getElementById("status").innerText = "Please fill exactly one field.";
    return;
  }

  const { content, path } = filled[0];

  const token = "YOUR_GITHUB_TOKEN_HERE"; // We will fix this soon
  const repo = "your-username/json-submit-site";

  const res = await fetch(`https://api.github.com/repos/${repo}/contents/${path}`, {
    method: "PUT",
    headers: {
      "Authorization": `token ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      message: `Update ${path}`,
      content: btoa(unescape(encodeURIComponent(content))),
      sha: await getFileSHA(repo, path, token),
    }),
  });

  if (res.ok) {
    document.getElementById("status").innerText = "Success!";
  } else {
    const err = await res.json();
    document.getElementById("status").innerText = "Error: " + err.message;
  }
});

async function getFileSHA(repo, path, token) {
  const res = await fetch(`https://api.github.com/repos/${repo}/contents/${path}`, {
    headers: { "Authorization": `token ${token}` }
  });
  const json = await res.json();
  return json.sha;
}
