chrome.storage.local.get("savedPages", (result) => {
  const container = document.getElementById("output");
  const pages = result.savedPages || [];

  if (pages.length === 0) {
    container.innerText = "No pages saved yet.";
    return;
  }

  container.innerHTML = ""; // Clear loading text

  pages.forEach((page, index) => {
    const div = document.createElement("div");
    div.className = "entry";
    div.innerText = `
#${index + 1}
Saved on: ${page.timestamp}
URL: ${page.url}
    `;
    container.appendChild(div);
  });
});

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('detectBtn').addEventListener('click', async () => {
    console.log("clicked button");
    chrome.storage.local.get('bodyText', (result) => {
      const textToAnalyze = result.bodyText;
      console.log("retrieved text to analyze: ", textToAnalyze);
      // Call the background script to make the API request
      chrome.runtime.sendMessage({ text: textToAnalyze }, function (response) {
        console.log("sent to API");
        if (response && response.result) {
          const score = response.result.score; // Your score
          console.log("AI Score (0-1): ", response.result.score);
          // Calculate percentage
          const percentage = score * 100;
          document.getElementById('aiResult').textContent =
            `Likelihood of AI Text: ${percentage.toFixed(2)}%`;
        } else {
          document.getElementById('aiResult').textContent =
            'Error detecting AI content';
        }
      });
    });
  });
});

