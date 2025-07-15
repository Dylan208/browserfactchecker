//Ensures the extension is fully loaded before assigning code to html
document.addEventListener('DOMContentLoaded', () => {

  document.getElementById('checkBtn').addEventListener('click', async () => {

    console.log("clicked button");

    chrome.runtime.sendMessage({ action: 'check' });
    updateSavedPages();
  });
  updateSavedPages(); // Also run on popup open
});

//Front end display of saved data
function updateSavedPages() { 
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
Author: ${page.authorName}
Followers: ${page.authorFollowers}
Verification: ${page.authorVerified}
Published: ${page.date}
AI Score: ${page.aiScore}
Saved on: ${page.timestamp}
URL: ${page.url}
    `;
    container.appendChild(div);
  });
});
}