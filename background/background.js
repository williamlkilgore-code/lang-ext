/**
 * Background Service Worker for Farsi Root Word Learner
 * Handles extension lifecycle and messaging
 */

// Installation handler
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('Farsi Root Word Learner installed');

    // Set default settings
    chrome.storage.sync.set({
      enableExtension: true,
      autoDetect: true,
      highlightColor: 'indigo'
    });

    // Open welcome page
    chrome.tabs.create({
      url: chrome.runtime.getURL('welcome.html')
    });
  } else if (details.reason === 'update') {
    console.log('Farsi Root Word Learner updated to version', chrome.runtime.getManifest().version);
  }
});

// Handle messages from content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'getSettings') {
    chrome.storage.sync.get({
      enableExtension: true,
      autoDetect: true,
      highlightColor: 'indigo'
    }, (settings) => {
      sendResponse(settings);
    });
    return true; // Will respond asynchronously
  }

  if (request.type === 'logStats') {
    console.log('Page stats:', request.stats);
  }
});

// Handle extension icon click
chrome.action.onClicked.addListener((tab) => {
  // This will open the popup by default due to manifest.json configuration
  console.log('Extension icon clicked on tab:', tab.id);
});

// Listen for tab updates to potentially reprocess pages
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete') {
    console.log('Tab completed loading:', tab.url);
  }
});

console.log('Farsi Root Word Learner background service worker loaded');
