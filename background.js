/*
chrome.runtime.onInstalled.addListener(() => {
    console.log('Fact Checker Extension Installed');
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    switch (message.action) {
        case 'scrapePage':
            scrapePageContent(sendResponse);
            return true; // Indicates async response

        // Place for other actions
        case 'aiDetection':
            {
                const apiKey = 'api-key'; // Replace with your Sapling API key

                try {
                    return new Promise(async (resolve, reject) => {
                    const response = await fetch('https://api.sapling.ai/api/v1/aidetect', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            key: apiKey,
                            text: message.text
                        })
                    });

                    const result = await response.json();
                    sendResponse({ result: result });
                    return resolve;
                });
                } catch (error) {
                    console.error('Error:', error);
                    sendResponse({ error: 'Failed to detect AI content' });
                }

                
                return false;
            }

        default:
            console.warn(`Unhandled action: ${message.action}`);
    }
});
//function to scrape page content
function scrapePageContent(callback) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.scripting.executeScript({
            target: { tabId: tabs[0].id },
            function: () => document.body.innerText
        }, (results) => {
            const content = (results && results[0] && results[0].result) || 'Failed to scrape content.';
            callback({ content });
        });
    });
}
    */