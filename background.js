
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {

    const apiKey = 'api-key'; // Replace with your Sapling API key

    try {
        (async () => {
            const response = await fetch('https://api.sapling.ai/api/v1/aidetect', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    key: apiKey,
                    text: message.text.toString()
                })
            });

            const result = await response.json();
            sendResponse({ result: result });
        });
    } catch (error) {
        console.error('Error:', error);
        sendResponse({ error: 'Failed to detect AI content' });
    }


}

); 
