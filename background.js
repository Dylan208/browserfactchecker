//Communication between app.js and content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {

  switch (message.action) {

    //Recieves message from app.js that button has been clicked
    case "check":
      runContentScript()
      return true;

    //Recieves request from content script for an api call to sapling api
    case "detectAI":
      checkAI(message.text)
        .then(aiScore => sendResponse({ success: true, aiScore }))
        .catch(error => sendResponse({ success: false, error: error.message }));
      return true;

    //Recieves request from content script for an api call to bluesky public api
    case "lookupBSKY":
      getProfile(message.handle)
        .then(profile => sendResponse({ success: true, profile }))
        .catch(error => sendResponse({ success: false, error: error.message }));
      return true;

    default:
      console.warn(`Unhandled action: ${message.action}`);
  }

});

async function checkAI(text) {

  const apiKey = 'api-key'; // Replace with your Sapling API key
  console.log('recieved by sapling api');

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

//getProfile calls searchUser and getBSKYDetails
//getProfile name searches for a matching account and assumes first match
//getBSKYDetails retrieves the information of the matching account (followers and verified status)
async function getProfile(handle) {

  console.log('looking up ', handle);
  const user = await searchUser(handle);

  if (!user) {

    console.log('lookup failed');
    const profile = {
      followers: 0,
      verified: false
    };

    return profile;
  }

  console.log('found ', user.did, ', looking up details');
  const profile = await getBSKYDetails(user.did);
  return profile;

}

async function searchUser(handle) {

  const response = await fetch(`https://public.api.bsky.app/xrpc/app.bsky.actor.searchActors?q=${handle}`);
  const data = await response.json();
  return data.actors[0]; // Assuming first match

}

async function getBSKYDetails(did) {

  const response = await fetch(`https://public.api.bsky.app/xrpc/app.bsky.actor.getProfile?actor=${did}`);
  const data = await response.json();
  return {
    followers: data.followersCount,
    verified: data.labels?.some(label => label.val === 'verified') // may vary
  };

}

//This function injects the content script and runs it, but first checks if there is matching url already
async function runContentScript() {

  try {
    const checkSavedData = await new Promise((resolve) => {

      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {

        const currentUrl = tabs[0].url;
        let shouldRun = 1;
        chrome.storage.local.get("savedPages", (result) => {

          console.log('checking for existing data')
          const pages = result.savedPages || [];
          for (const page of pages) {
            if (currentUrl == page.url) {
              shouldRun = 0;
            }
          }
          resolve(shouldRun);
        });
      })
    });

    if (checkSavedData == 1) {

      console.log("Running content script...");
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {

        chrome.scripting.executeScript({

          target: { tabId: tabs[0].id },
          files: ['content.js']

        })
      });
    }
    
  } catch (error) {
    console.error(error);
  }

}