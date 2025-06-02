console.log("Content script running on", window.location.href);

function extractPageInfo() {
  const bodyText = document.body.innerText;
  const url = window.location.href;

  const pageData = {
    url: url,
    timestamp: new Date().toISOString()
  };

  chrome.storage.local.set({bodyText: bodyText}, function() {
    console.log('bodyText saved');
  });
  
  // Fetch existing data, append this one, and save back
  chrome.storage.local.get({ savedPages: [] }, (result) => {
    const updatedPages = result.savedPages;
    updatedPages.push(pageData);

    chrome.storage.local.set({ savedPages: updatedPages }, () => {
      console.log("Page added to savedPages array:", pageData);
    });
  });
}

extractPageInfo();
