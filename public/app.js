// app.js - minimal client code to call our server proxy
const form = document.getElementById("promptForm");
const promptTextarea = document.getElementById("prompt");
const resultWrap = document.getElementById("resultWrap");
const resultPre = document.getElementById("result");
const submitBtn = document.getElementById("submitBtn");
const clearBtn = document.getElementById("clearBtn");
const copyBtn = document.getElementById("copyBtn");
const downloadBtn = document.getElementById("downloadBtn");

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const prompt = promptTextarea.value.trim();
  if (!prompt) return;

  submitBtn.disabled = true;
  submitBtn.textContent = "Generating...";

  try {
    const resp = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt })
    });

    const data = await resp.json();
    if (!resp.ok || !data) {
      resultPre.textContent = `Error: ${(data && data.error) || resp.statusText || "Unknown"}`;
    } else {
      // The external API returns {"status": true, "result":[{"response":"AI_ANSWER"}]}
      let answer = "";
      if (data?.result && Array.isArray(data.result)) {
        answer = data.result.map(r => r.response ?? JSON.stringify(r)).join("\n\n");
      } else if (typeof data === "string") {
        answer = data;
      } else {
        answer = JSON.stringify(data, null, 2);
      }
      resultPre.textContent = answer;
      resultWrap.classList.remove("hidden");
    }
  } catch (err) {
    resultPre.textContent = `Network/Server error: ${err.message || err}`;
    resultWrap.classList.remove("hidden");
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "Generate";
  }
});

clearBtn.addEventListener("click", () => {
  promptTextarea.value = "";
  resultPre.textContent = "—";
  resultWrap.classList.add("hidden");
});

copyBtn.addEventListener("click", async () => {
  const text = resultPre.textContent;
  if (!text) return;
  try {
    await navigator.clipboard.writeText(text);
    copyBtn.textContent = "Copied!";
    setTimeout(()=> copyBtn.textContent = "Copy", 1200);
  } catch {
    copyBtn.textContent = "Failed";
    setTimeout(()=> copyBtn.textContent = "Copy", 1200);
  }
});

downloadBtn.addEventListener("click", () => {
  const text = resultPre.textContent || "";
  const blob = new Blob([text], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "ai-result.txt";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
});
