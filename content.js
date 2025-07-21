console.log("Content script running on", window.location.href);

//Main function of content script
async function extractPageInfo() {

  //saves text for sapling api and sends it to background.js
  const text = document.body.innerText;
  const aiScore = await new Promise((resolve) => {
    chrome.runtime.sendMessage({ action: 'detectAI', text: text }, (response) => {
      resolve(response.aiScore);
    })
  });

  //saves title
  const title = document.title;

  //saves url
  const url = window.location.href;

  //calls function to find best match for an author from page, then sends the name to background.js
  const author = findAuthor();
  let authorBSKY = await new Promise((resolve) => {
    chrome.runtime.sendMessage({ action: 'lookupBSKY', handle: author }, (response) => {
      resolve(response.profile);
    })
  })

  //Sets default values if the author cannot be found
  if (author == "Unknown") {
    authorBSKY.followers = 0;
    authorBSKY.verified = false;
  }

  //finds the date of publication
  const date = findPublicationDate();

  //finds the top level domain of the page
  const domain = findTLD();

  //calculates a score based on all of these attributes
  const score = calcScore(url, authorBSKY, date, domain, aiScore);

  //Saves the current date
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0'); // zero-pad
  const day = String(now.getDate()).padStart(2, '0');
  const dateOnly = `${year}-${month}-${day}`;

  //Creates a data object with all gathered information
  const pageData = {
    title: title,
    url: url,
    authorName: author,
    authorFollowers: authorBSKY.followers,
    authorVerified: authorBSKY.verified,
    date: date,
    domain: domain,
    aiScore: aiScore,
    timestamp: dateOnly,
    score: score
  };

  // Fetch existing data, append this one, and save back
  chrome.storage.local.get({ savedPages: [] }, (result) => {
    const updatedPages = result.savedPages;
    updatedPages.push(pageData);

    chrome.storage.local.set({ savedPages: updatedPages }, () => {
      console.log("Page added to savedPages array:", pageData);
    });

    chrome.runtime.sendMessage({ action: 'refresh' });
  });
}

function calcScore(url, authorBSKY, date, domain, aiScore) {

  //Baseline score set
  let score = 0;

  //Adds score based on authors bluesky credentials
  if (authorBSKY) {
    if (authorBSKY.followers >= 10000) {
      score = score + 1.1;
    }
    else {
      score = score + (authorBSKY.followers / 10000);
    }
    if (authorBSKY.verified == true) {
      //Multiplied by 2 if the author is verified
      score = score * 2;
    }
  }
  console.log("Author score = " + score);

  //Adds score based on TLD
  switch (domain) {

    //If TLD is au, checks if it is a government source
    case "au":
      if (url.includes("gov")) {
        score = score + 5;
      } else {
        score = score + 1;
      }
      break;

    case "int":
      score = score + 4;
      break;

    case "gov":
      score = score + 4;
      break;

    case "edu":
      score = score + 3;
      break;

    case "org":
      score = score + 2;
      break;

    case "net":
      score = score + 1;
      break;

    case "com":
      score = score + 1;
      break;

    default:
      break;

  }
  console.log("Plus domain = " + score);

  //Adds score based on date of publication
  const year = parseInt(date.slice(0, 4));
  const month = parseInt(date.slice(5, 7));
  const now = new Date();

  //If current year, checks for month, bonus if same year same month
  if (year == now.getFullYear()) {
    if (month == (now.getMonth() + 1)) {
      score = score + 4;
    } else {
      score = score + 3;
    }

    //Otherwise deducts points from 3 for each year old
  } else if ((year - now.getFullYear() + 3) > 0) {
    score = score + (year - now.getFullYear() + 3);
  }
  console.log("Plus date = " + score);

  //Multiply total score by ai score for final score
  score = score * (1 - aiScore);
  console.log("Final score = " + score);
  return score;
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
    if (window.location.hostname.includes('abc.net.au')) {
      const match = text.match(/\/news\/([^/]+)\//);

      if (match) {
        text = match[1];
        text = text.replace(/-/g, ' ')
          .replace(/\b\w/g, c => c.toUpperCase());
      }
    }
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

extractPageInfo()
