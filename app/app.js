//Ensures the extension is fully loaded before assigning code to html
document.addEventListener('DOMContentLoaded', () => {

  document.getElementById('checkBtn').addEventListener('click', async () => {

    console.log("clicked button");

    chrome.runtime.sendMessage({ action: 'check' });
    updateSavedPages();
  });
  updateSavedPages(); // Also run on popup open
});

//Recieves message from content script to update the visual feed of saved pages
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    switch (message.action) {
        case "refresh":
            updateSavedPages()
            return true;

        default:
            console.warn(`Unhandled action: ${message.action}`);
    }
});

//Front end display of saved data
function updateSavedPages() { 
  chrome.storage.local.get("savedPages", (result) => {
  const container = document.getElementById("output");
  let pages = result.savedPages || [];
    console.log(pages);
  if (pages.length === 0) {
    container.innerText = "No pages saved yet.";
    return;
  } else if (pages.length > 1) {
    //Sort the pages by score descending
    pages.sort((a, b) => b.score - a.score);
  }

  container.innerHTML = ""; // Clear loading text

  //Exact display of what information. More information is tracked but unnecessary and clogs visual
  pages.forEach((page, index) => {
    const div = document.createElement("div");
    div.className = "entry";
    div.innerText = `
#${index + 1} Score: ${page.score}
Author: ${page.authorName}
Published: ${page.date}
AI Score: ${page.aiScore}
URL: ${page.url}
Saved on: ${page.timestamp}
    `;
    container.appendChild(div);
  });
});
}