console.log("Content script running on", window.location.href);

async function extractPageInfo() {
  const aiScore = await checkAI();
  const url = window.location.href;
  const author = findAuthor();
  const date = findPublicationDate();
  const domain = findTLD();

  const pageData = {
    url: url,
    author: author,
    date: date,
    domain: domain,
    aiScore: aiScore,
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

function findTLD() {
  const hostname = window.location.hostname;
  const parts = hostname.split('.');
  let tld = '';
  if (parts.length > 1) {
    tld = parts[parts.length - 1];
  }
  return tld;
}

function findAuthor() {
  // This is to only grab first and last name for sites that might have other stuff in the title like (Name) 5 minutes ago
  // Might bug out if the user has more than 2 words in their name for exmaple middle name but mostly functional
  function limitToTwoWords(text) {
    return text
      .trim()
      .replace(/^by\s+|written by\s+|author:\s+/i, '') // Remove prefixes like "by" and "written by"
      .split(/\s+/) // Split into words
      .slice(0, 2) // Take first two words
      .join(' ') // Final trim
      .trim();
  }

  function removeNumbers(text) {
    return text
      .replace(/\d+/g, '')// Remove all numbers
      .replace(/\s+/g, ' ') // Fix spaces
      .trim(); // Clean up
  }

  function cleanAuthorName(text) {
    return removeNumbers(limitToTwoWords(text));
  }

  // Twitter check
  if (window.location.hostname.includes('twitter.com') || window.location.hostname.includes('x.com')) {
    const tweetAuthor = document.querySelector('[data-testid="User-Name"]')?.textContent ||
      document.querySelector('[data-testid="tweet"] a[role="link"]')?.textContent ||
      document.querySelector('article [dir="ltr"]')?.textContent;

    if (tweetAuthor) {
      return cleanAuthorName(tweetAuthor.split('@')[0]);
    }
  }

  // Reddit check
  if (window.location.hostname.includes('reddit.com')) {
    const redditAuthor = document.querySelector('a.author-name[href^="/user/"]')?.textContent;

    if (redditAuthor) {
      let authorText = redditAuthor
        .trim()
        .replace(/^u\//, '');  // Remove u/ prefix if present

      return cleanAuthorName(authorText);
    }
  }

  // Check meta tags first
  const metaSelectors = [
    'meta[name="author"]',
    'meta[property="article:author"]',
    'meta[name="dc.creator"]',
    'meta[property="og:author"]',
    'meta[name="twitter:creator"]',
    'meta[property="cXenseParse:author"]'
  ];

  for (let selector of metaSelectors) {
    const metaTag = document.querySelector(selector);
    if (metaTag?.content) {
      return cleanAuthorName(metaTag.content);
    }
  }

  // Check schema for author tag
  const schemaNode = document.querySelector('[itemtype*="schema.org/Article"], [itemtype*="schema.org/NewsArticle"]');
  if (schemaNode) {
    const authorNode = schemaNode.querySelector('[itemprop="author"]');
    if (authorNode) {
      return cleanAuthorName(authorNode.textContent);
    }
  }

  // Checks for author classes
  const authorSelectors = [
    '.author',
    '#author',
    '.byline',
    '.writer',
    '.article-author',
    '[rel="author"]',
    '.contributor-name',
    '.post-author',
    '.entry-author'
  ];

  for (let selector of authorSelectors) {
    const element = document.querySelector(selector);
    if (element) {
      const clone = element.cloneNode(true);
      const links = clone.getElementsByTagName('a');
      for (let link of links) {
        link.remove();
      }
      const authorText = clone.textContent.trim();
      if (authorText) {
        return cleanAuthorName(authorText);
      }
    }
  }

  // Check for "by" or "written by" in page
  const paragraphs = document.querySelectorAll('p');
  for (let i = 0; i < Math.min(5, paragraphs.length); i++) {
    const text = paragraphs[i].textContent;
    const byMatch = text.match(/(?:by|written by)\s+([^.|\n]+)/i);
    if (byMatch) {
      return cleanAuthorName(byMatch[1]);
    }
  }

  return "Unknown";
}

function findPublicationDate() {
  const dateSelectors = [
    'meta[name="publication_date"]',
    'meta[property="article:published_time"]',
    'meta[name="date"]',
    'time[datetime]',
    'meta[property="og:published_time"]'
  ];

  for (let selector of dateSelectors) {
    const element = document.querySelector(selector);
    const dateStr = element?.content || element?.getAttribute('datetime');
    if (dateStr) {
      try {
        const date = new Date(dateStr);
        if (!isNaN(date)) {
          return date.toISOString().split('T')[0];
        }
      } catch (e) {
        console.error("Could not find date:", e);
      }
    }
  }

  return new Date().toISOString().split('T')[0];
}

async function checkAI() {
  const apiKey = 'api-key'; // Replace with your Sapling API key
  const text = document.body.innerText;
  console.log('recieved by api');
  try {
    const response = await fetch('https://api.sapling.ai/api/v1/aidetect', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        key: apiKey,
        text: text.toString()
      })
    });

    const result = await response.json();
    console.log('processed by api');
    return result.score;
  } catch (error) {
    console.error('Error:', error);
  }
}

extractPageInfo()
