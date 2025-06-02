
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "aiDetect" && message.text) {
        const apiKey = 'api-key'; // Replace with your Sapling API key
        console.log('recieved by api');
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
                            console.log('processed by api');
                            sendResponse({ result: result });
                        })();
                } catch (error) {
                    console.error('Error:', error);
                    sendResponse({ error: 'Failed to detect AI content' });
                }
    }

    return true;
}


);
