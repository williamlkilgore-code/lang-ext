/**
 * Popup script for Language Learner extension
 */

document.addEventListener('DOMContentLoaded', async () => {
  await loadSettings();
  await loadVocabularyStats();
  setupEventListeners();
  displayVersion();
});

/**
 * Load settings from storage and populate UI
 */
async function loadSettings() {
  try {
    const settings = await chrome.storage.sync.get({
      activePersian: true,
      activeChinese: true,
      activeRussian: true,
      hideMasteredWords: true,
      showRussianAffixes: true
    });

    document.getElementById('activePersian').checked = settings.activePersian;
    document.getElementById('activeChinese').checked = settings.activeChinese;
    document.getElementById('activeRussian').checked = settings.activeRussian;
    document.getElementById('hideMasteredWords').checked = settings.hideMasteredWords;
    document.getElementById('showRussianAffixes').checked = settings.showRussianAffixes;
  } catch (error) {
    console.error('Failed to load settings:', error);
  }
}

/**
 * Load vocabulary statistics
 */
async function loadVocabularyStats() {
  try {
    const data = await chrome.storage.local.get({
      masteredWords: { persian: [], chinese: [], russian: [] },
      userDictionary: { persian: [], chinese: [], russian: [] }
    });

    const totalMastered = 
      (data.masteredWords.persian?.length || 0) +
      (data.masteredWords.chinese?.length || 0) +
      (data.masteredWords.russian?.length || 0);

    const totalCustom = 
      (data.userDictionary.persian?.length || 0) +
      (data.userDictionary.chinese?.length || 0) +
      (data.userDictionary.russian?.length || 0);

    document.getElementById('masteredCount').textContent = totalMastered;
    document.getElementById('customCount').textContent = totalCustom;
  } catch (error) {
    console.error('Failed to load vocabulary stats:', error);
    document.getElementById('masteredCount').textContent = '?';
    document.getElementById('customCount').textContent = '?';
  }
}

/**
 * Save a setting to storage
 */
async function saveSetting(key, value) {
  try {
    await chrome.storage.sync.set({ [key]: value });
    console.log(`Setting saved: ${key} = ${value}`);

    // Notify content scripts of settings change
    chrome.tabs.query({}, (tabs) => {
      tabs.forEach(tab => {
        chrome.tabs.sendMessage(tab.id, { action: 'settingsUpdated' }).catch(() => {
          // Ignore errors for tabs without content scripts
        });
      });
    });
  } catch (error) {
    console.error('Failed to save setting:', error);
  }
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
  // Language toggles
  document.getElementById('activePersian').addEventListener('change', (e) => {
    saveSetting('activePersian', e.target.checked);
  });

  document.getElementById('activeChinese').addEventListener('change', (e) => {
    saveSetting('activeChinese', e.target.checked);
  });

  document.getElementById('activeRussian').addEventListener('change', (e) => {
    saveSetting('activeRussian', e.target.checked);
  });

  // Quick settings
  document.getElementById('hideMasteredWords').addEventListener('change', (e) => {
    saveSetting('hideMasteredWords', e.target.checked);
  });

  document.getElementById('showRussianAffixes').addEventListener('change', (e) => {
    saveSetting('showRussianAffixes', e.target.checked);
  });

  // Action buttons
  document.getElementById('openSettings').addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
  });

  document.getElementById('openHelp').addEventListener('click', () => {
    chrome.tabs.create({ url: 'https://github.com/williamlkilgore-code/lang-ext/issues' });
  });
}

/**
 * Display extension version
 */
function displayVersion() {
  const manifest = chrome.runtime.getManifest();
  document.getElementById('version').textContent = manifest.version;
}
