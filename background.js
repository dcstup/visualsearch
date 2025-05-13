// background.js - Handles DuckDuckGo image fetching and communication with content script

// Function to extract VQD parameter from DuckDuckGo HTML
async function extractVqdFromHTML(html) {
  const vqdMatch = html.match(/vqd=['"]([^'"]+)['"]/);
  return vqdMatch ? vqdMatch[1] : null;
}

// Function to fetch DuckDuckGo search page and extract VQD
async function fetchVqdToken(query) {
  try {
    const response = await fetch(`https://duckduckgo.com/?q=${encodeURIComponent(query)}&ia=images`);
    const html = await response.text();
    const vqd = await extractVqdFromHTML(html);
    
    if (!vqd) {
      throw new Error('Could not extract VQD token from DuckDuckGo');
    }
    
    return vqd;
  } catch (error) {
    throw error;
  }
}

// Function to fetch image results using the VQD token
async function fetchDuckDuckGoImages(query, vqd) {
  try {
    const response = await fetch(
      `https://duckduckgo.com/i.js?q=${encodeURIComponent(query)}&vqd=${vqd}&p=1&s=100`,
      {
        headers: {
          'Accept': 'application/json',
          'Referer': 'https://duckduckgo.com/',
        }
      }
    );
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return data.results || []; // Return all image results
  } catch (error) {
    throw error;
  }
}

// Listen for messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'fetchImages') {
    const { query } = request;
    
    // Send an immediate response to acknowledge receipt
    sendResponse({ status: 'processing' });
    
    // Process the image fetching asynchronously
    (async () => {
      try {
        // First get VQD token
        const vqd = await fetchVqdToken(query);
        
        // Then fetch the images
        const images = await fetchDuckDuckGoImages(query, vqd);
        
        // Send results back to content script
        chrome.tabs.sendMessage(sender.tab.id, {
          action: 'displayImages',
          images: images
        });
      } catch (error) {
        chrome.tabs.sendMessage(sender.tab.id, {
          action: 'fetchError',
          error: error.message
        });
      }
    })();
    
    // Required for asynchronous sendResponse
    return true;
  }
});

// Listen for tab updates to detect when the user navigates to a Google search page
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  // Only run if the URL matches a Google search page
  if (changeInfo.status === 'complete' && tab.url && tab.url.includes('google.com/search')) {
    // Notify content script that the page has been updated
    chrome.tabs.sendMessage(tabId, {
      action: 'pageUpdated',
      url: tab.url
    });
  }
});
