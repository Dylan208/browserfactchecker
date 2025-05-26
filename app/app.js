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
Domain: ${page.domain}
Author: ${page.author}
Published: ${page.datePublished}
Saved on: ${page.timestamp}
URL: ${page.url}
Body Preview:
${page.bodyText.slice(0, 200)}...
    `;
    container.appendChild(div);
  });
});



/*
document.getElementById('checkBtn').addEventListener('click', async () => {
    const textToAnalyze = chrome.storage.local.get('savedString');
    
    // Call the background script to make the API request
    chrome.runtime.sendMessage({ text: textToAnalyze, action: "aiDetection" }, function (response) {
      if (response && response.result) {
        document.getElementById('aiResult').textContent = 
          `AI Score: ${response.result.score}`;
      } else {
        document.getElementById('aiResult').textContent = 
          'Error detecting AI content';
      }
    });
  }); */