function extractPageInfo() {
  const bodyText = document.body.innerText.slice(0, 5000);
  const domain = location.hostname;

  const author = document.querySelector('meta[name="author"]')?.content ||
                 document.querySelector('[itemprop="author"]')?.textContent || "Unknown";

  const datePublished = document.querySelector('meta[property="article:published_time"]')?.content ||
                        document.querySelector('meta[name="pubdate"]')?.content ||
                        document.querySelector('[itemprop="datePublished"]')?.content || "Unknown";

  const pageData = {
    domain,
    author,
    datePublished,
    bodyText,
    url: location.href,
    timestamp: new Date().toISOString()
  };

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
