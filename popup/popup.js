/**
 * Popup script for Farsi Root Word Learner extension
 */

document.addEventListener('DOMContentLoaded', async () => {
  await loadStats();
  await loadSettings();
  setupEventListeners();
});

/**
 * Load and display dictionary statistics
 */
async function loadStats() {
  try {
    const response = await fetch(chrome.runtime.getURL('data/farsi-roots.json'));
    const data = await response.json();

    const totalRoots = data.roots.length;
    const totalWords = data.roots.reduce((sum, root) => sum + root.derivatives.length, 0);
    const categories = new Set(data.roots.map(root => root.category));

    document.getElementById('totalRoots').textContent = totalRoots;
    document.getElementById('totalWords').textContent = totalWords;
    document.getElementById('totalCategories').textContent = categories.size;
  } catch (error) {
    console.error('Failed to load dictionary stats:', error);
    document.getElementById('totalRoots').textContent = '?';
    document.getElementById('totalWords').textContent = '?';
    document.getElementById('totalCategories').textContent = '?';
  }
}

/**
 * Load settings from storage
 */
async function loadSettings() {
  try {
    const settings = await chrome.storage.sync.get({
      enableExtension: true,
      autoDetect: true,
      highlightColor: 'indigo'
    });

    document.getElementById('enableExtension').checked = settings.enableExtension;
    document.getElementById('autoDetect').checked = settings.autoDetect;
    document.getElementById('highlightColor').value = settings.highlightColor;
  } catch (error) {
    console.error('Failed to load settings:', error);
  }
}

/**
 * Save settings to storage
 */
async function saveSettings() {
  const settings = {
    enableExtension: document.getElementById('enableExtension').checked,
    autoDetect: document.getElementById('autoDetect').checked,
    highlightColor: document.getElementById('highlightColor').value
  };

  try {
    await chrome.storage.sync.set(settings);
    console.log('Settings saved:', settings);

    // Notify content scripts of settings change
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tabs[0]) {
      chrome.tabs.sendMessage(tabs[0].id, { type: 'settingsChanged', settings });
    }
  } catch (error) {
    console.error('Failed to save settings:', error);
  }
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
  // Save settings on change
  document.getElementById('enableExtension').addEventListener('change', saveSettings);
  document.getElementById('autoDetect').addEventListener('change', saveSettings);
  document.getElementById('highlightColor').addEventListener('change', saveSettings);

  // View dictionary button
  document.getElementById('viewDictionary').addEventListener('click', (e) => {
    e.preventDefault();
    chrome.tabs.create({ url: chrome.runtime.getURL('dictionary.html') });
  });

  // Report issue button
  document.getElementById('reportIssue').addEventListener('click', (e) => {
    e.preventDefault();
    chrome.tabs.create({ url: 'https://github.com/williamlkilgore-code/lang-ext/issues' });
  });

  // Display version
  const manifest = chrome.runtime.getManifest();
  document.getElementById('version').textContent = manifest.version;
}
