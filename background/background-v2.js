/**
 * Background Script for Language Learner (Manifest V2)
 * Handles extension lifecycle, toggle state, and keyboard commands
 *
 * This is the V2 version - uses chrome.browserAction instead of chrome.action
 */

// Track toggle state per tab (true = enabled, false = disabled)
const tabToggleState = new Map();

/**
 * Get toggle state for a tab (defaults to true/enabled)
 */
function getTabToggleState(tabId) {
  return tabToggleState.get(tabId) !== false; // Default to enabled
}

/**
 * Set toggle state for a tab
 */
function setTabToggleState(tabId, enabled) {
  tabToggleState.set(tabId, enabled);
}

/**
 * Toggle extension for a tab
 */
async function toggleExtensionForTab(tabId) {
  const currentState = getTabToggleState(tabId);
  const newState = !currentState;
  setTabToggleState(tabId, newState);

  // Send message to content script
  try {
    await chrome.tabs.sendMessage(tabId, {
      action: 'toggleExtension',
      enabled: newState
    });

    console.log(`Language Learner: Toggled ${newState ? 'ON' : 'OFF'} for tab ${tabId}`);
  } catch (error) {
    console.error('Language Learner: Failed to send toggle message:', error);
  }

  return newState;
}

// Installation handler
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('Language Learner: Extension installed');

    // Settings are now managed by SettingsManager with proper defaults
    // No need to set legacy settings here

  } else if (details.reason === 'update') {
    const version = chrome.runtime.getManifest().version;
    console.log(`Language Learner: Updated to version ${version}`);
  }
});

// Handle keyboard commands
chrome.commands.onCommand.addListener(async (command) => {
  if (command === 'toggle-extension') {
    // Get current active tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (tab) {
      const newState = await toggleExtensionForTab(tab.id);

      // Show notification badge (V2 uses browserAction instead of action)
      chrome.browserAction.setBadgeText({
        text: newState ? '' : 'OFF',
        tabId: tab.id
      });

      chrome.browserAction.setBadgeBackgroundColor({
        color: '#ef4444', // Red
        tabId: tab.id
      });
    }
  }
});

// Handle messages from content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getToggleState') {
    const enabled = getTabToggleState(sender.tab.id);
    sendResponse({ enabled });
    return true;
  }

  if (request.type === 'logStats') {
    console.log('Language Learner: Page stats:', request.stats);
  }
});

// Clean up toggle state when tab is closed
chrome.tabs.onRemoved.addListener((tabId) => {
  tabToggleState.delete(tabId);
});

// Reset toggle state when tab navigates to new page
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete') {
    // Reset toggle state to enabled for new page loads
    tabToggleState.delete(tabId);

    // Clear badge (V2 uses browserAction instead of action)
    chrome.browserAction.setBadgeText({ text: '', tabId: tabId });
  }
});

console.log('Language Learner: Background script loaded (Manifest V2)');
