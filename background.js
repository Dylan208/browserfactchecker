
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "check") {
        runContentScript()
    }
    return true;
});

function runContentScript() {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const currentUrl = tabs[0].url;
        let shouldRun = 1;
        chrome.storage.local.get("savedPages", (result) => {
            console.log('checking for existing data')
            const pages = result.savedPages || [];
            pages.forEach((page) => {
                if (currentUrl == page.url) {
                    console.log('data already saved')
                    shouldRun = 0;
                }
            });
        });
        if (shouldRun === 1) {
            console.log("Running content script...");
            chrome.scripting.executeScript({
                target: { tabId: tabs[0].id },
                files: ['content.js']
            });
        }
    });
}
