/**
 * Options Page Script
 * Handles settings UI and user interactions
 */

const settingsManager = new SettingsManager();
const vocabularyManager = new VocabularyManager();

// HSK word counts for accurate display
const hskWordCounts = {
  1: 150,
  2: 147,
  3: 298,
  4: 598,
  5: 1300,
  6: 2500
};

// DOM Elements
const elements = {
  // Language
  activePersian: document.getElementById('activePersian'),
  activeChinese: document.getElementById('activeChinese'),
  chineseSection: document.getElementById('chineseSection'),

  // HSK Levels
  chineseHskMin: document.getElementById('chineseHskMin'),
  chineseHskMax: document.getElementById('chineseHskMax'),
  minLevelValue: document.getElementById('minLevelValue'),
  maxLevelValue: document.getElementById('maxLevelValue'),
  wordCountDisplay: document.getElementById('wordCountDisplay'),

  // Highlight
  highlightOpacity: document.getElementById('highlightOpacity'),
  highlightColor: document.getElementById('highlightColor'),
  highlightStyle: document.getElementById('highlightStyle'),
  highlightThickness: document.getElementById('highlightThickness'),
  opacityValue: document.getElementById('opacityValue'),
  previewHighlight: document.getElementById('previewHighlight'),

  // Domains
  domainInput: document.getElementById('domainInput'),
  addDomain: document.getElementById('addDomain'),
  excludedDomainsList: document.getElementById('excludedDomainsList'),

  // Custom Vocabulary Settings
  hideMasteredWords: document.getElementById('hideMasteredWords'),
  showCustomWords: document.getElementById('showCustomWords'),

  // Mastered Words
  masteredPersianCount: document.getElementById('masteredPersianCount'),
  masteredChineseCount: document.getElementById('masteredChineseCount'),
  masteredPersianList: document.getElementById('masteredPersianList'),
  masteredChineseList: document.getElementById('masteredChineseList'),
  clearMasteredPersian: document.getElementById('clearMasteredPersian'),
  clearMasteredChinese: document.getElementById('clearMasteredChinese'),
  exportMastered: document.getElementById('exportMastered'),
  importMastered: document.getElementById('importMastered'),
  importMasteredFile: document.getElementById('importMasteredFile'),

  // Custom Dictionary - Persian
  persianWord: document.getElementById('persianWord'),
  persianRoot: document.getElementById('persianRoot'),
  persianRootMeaning: document.getElementById('persianRootMeaning'),
  persianWordMeaning: document.getElementById('persianWordMeaning'),
  persianPos: document.getElementById('persianPos'),
  addPersianWord: document.getElementById('addPersianWord'),
  customPersianList: document.getElementById('customPersianList'),
  customPersianCount: document.getElementById('customPersianCount'),

  // Custom Dictionary - Chinese
  chineseCharacter: document.getElementById('chineseCharacter'),
  chinesePinyin: document.getElementById('chinesePinyin'),
  chineseMeaning: document.getElementById('chineseMeaning'),
  chineseRadical: document.getElementById('chineseRadical'),
  chinesePos: document.getElementById('chinesePos'),
  addChineseWord: document.getElementById('addChineseWord'),
  customChineseList: document.getElementById('customChineseList'),
  customChineseCount: document.getElementById('customChineseCount'),

  // Custom Dictionary Actions
  exportCustom: document.getElementById('exportCustom'),
  importCustom: document.getElementById('importCustom'),
  importCustomFile: document.getElementById('importCustomFile'),

  // Buttons
  saveSettings: document.getElementById('saveSettings'),
  resetSettings: document.getElementById('resetSettings'),
  statusMessage: document.getElementById('statusMessage')
};

// Current excluded domains
let excludedDomains = [];

/**
 * Initialize the options page
 */
async function init() {
  await loadSettings();
  await loadVocabulary();
  attachEventListeners();
  setupTabListeners();
  updateChineseSectionVisibility();
  updateHskWordCount();
  updateHighlightPreview();
}

/**
 * Load settings from storage and populate UI
 */
async function loadSettings() {
  const settings = await settingsManager.getAll();

  // Language settings
  elements.activePersian.checked = settings.activePersian;
  elements.activeChinese.checked = settings.activeChinese;

  // HSK level settings
  elements.chineseHskMin.value = settings.chineseHskMin;
  elements.chineseHskMax.value = settings.chineseHskMax;
  elements.minLevelValue.textContent = `HSK ${settings.chineseHskMin}`;
  elements.maxLevelValue.textContent = `HSK ${settings.chineseHskMax}`;

  // Highlight settings
  elements.highlightOpacity.value = settings.highlightOpacity;
  elements.highlightColor.value = settings.highlightColor;
  elements.highlightStyle.value = settings.highlightStyle;
  elements.highlightThickness.value = settings.highlightThickness;
  elements.opacityValue.textContent = `${settings.highlightOpacity}%`;

  // Domain exclusions
  excludedDomains = settings.excludedDomains || [];
  renderExcludedDomains();

  // Custom vocabulary settings
  elements.hideMasteredWords.checked = settings.hideMasteredWords;
  elements.showCustomWords.checked = settings.showCustomWords;
}

/**
 * Attach event listeners to all controls
 */
function attachEventListeners() {
  // Language checkboxes
  elements.activeChinese.addEventListener('change', updateChineseSectionVisibility);

  // HSK level sliders
  elements.chineseHskMin.addEventListener('input', (e) => {
    const value = parseInt(e.target.value);
    elements.minLevelValue.textContent = `HSK ${value}`;

    // Ensure min doesn't exceed max
    if (value > parseInt(elements.chineseHskMax.value)) {
      elements.chineseHskMax.value = value;
      elements.maxLevelValue.textContent = `HSK ${value}`;
    }

    updateHskWordCount();
  });

  elements.chineseHskMax.addEventListener('input', (e) => {
    const value = parseInt(e.target.value);
    elements.maxLevelValue.textContent = `HSK ${value}`;

    // Ensure max doesn't go below min
    if (value < parseInt(elements.chineseHskMin.value)) {
      elements.chineseHskMin.value = value;
      elements.minLevelValue.textContent = `HSK ${value}`;
    }

    updateHskWordCount();
  });

  // Highlight controls
  elements.highlightOpacity.addEventListener('input', (e) => {
    elements.opacityValue.textContent = `${e.target.value}%`;
    updateHighlightPreview();
  });

  elements.highlightColor.addEventListener('input', updateHighlightPreview);
  elements.highlightStyle.addEventListener('change', updateHighlightPreview);
  elements.highlightThickness.addEventListener('change', updateHighlightPreview);

  // Domain controls
  elements.addDomain.addEventListener('click', addDomain);
  elements.domainInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') addDomain();
  });

  // Mastered words controls
  elements.clearMasteredPersian.addEventListener('click', () => clearMasteredWords('persian'));
  elements.clearMasteredChinese.addEventListener('click', () => clearMasteredWords('chinese'));
  elements.exportMastered.addEventListener('click', exportMasteredWords);
  elements.importMastered.addEventListener('click', () => elements.importMasteredFile.click());
  elements.importMasteredFile.addEventListener('change', importMasteredWords);

  // Custom dictionary controls - Persian
  elements.addPersianWord.addEventListener('click', addPersianWord);
  elements.persianWord.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') addPersianWord();
  });

  // Custom dictionary controls - Chinese
  elements.addChineseWord.addEventListener('click', addChineseWord);
  elements.chineseCharacter.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') addChineseWord();
  });

  // Custom dictionary actions
  elements.exportCustom.addEventListener('click', exportCustomDictionary);
  elements.importCustom.addEventListener('click', () => elements.importCustomFile.click());
  elements.importCustomFile.addEventListener('change', importCustomDictionary);

  // Save and reset buttons
  elements.saveSettings.addEventListener('click', saveSettings);
  elements.resetSettings.addEventListener('click', resetSettings);
}

/**
 * Update Chinese section visibility based on checkbox
 */
function updateChineseSectionVisibility() {
  if (elements.activeChinese.checked) {
    elements.chineseSection.classList.remove('disabled');
  } else {
    elements.chineseSection.classList.add('disabled');
  }
}

/**
 * Update word count display based on HSK level range
 */
function updateHskWordCount() {
  const min = parseInt(elements.chineseHskMin.value);
  const max = parseInt(elements.chineseHskMax.value);

  let totalWords = 0;
  for (let level = min; level <= max; level++) {
    totalWords += hskWordCounts[level];
  }

  if (min === max) {
    elements.wordCountDisplay.textContent = `${totalWords.toLocaleString()} words (HSK ${min} only)`;
  } else if (min === 1 && max === 6) {
    elements.wordCountDisplay.textContent = `${totalWords.toLocaleString()} words (Complete HSK)`;
  } else {
    elements.wordCountDisplay.textContent = `${totalWords.toLocaleString()} words (HSK ${min}-${max})`;
  }
}

/**
 * Update highlight preview based on current settings
 */
function updateHighlightPreview() {
  const opacity = elements.highlightOpacity.value / 100;
  const color = elements.highlightColor.value;
  const style = elements.highlightStyle.value;
  const thickness = elements.highlightThickness.value;

  // Convert hex to rgba
  const r = parseInt(color.slice(1, 3), 16);
  const g = parseInt(color.slice(3, 5), 16);
  const b = parseInt(color.slice(5, 7), 16);

  const preview = elements.previewHighlight;

  if (style === 'none') {
    preview.style.textDecoration = 'none';
  } else {
    preview.style.textDecorationLine = 'underline';
    preview.style.textDecorationStyle = style;
    preview.style.textDecorationColor = `rgba(${r}, ${g}, ${b}, ${opacity})`;
    preview.style.textDecorationThickness = `${thickness}px`;
  }
}

/**
 * Add a domain to the exclusion list
 */
function addDomain() {
  const domain = elements.domainInput.value.trim().toLowerCase();

  if (!domain) {
    showStatus('Please enter a domain', 'error');
    return;
  }

  // Basic validation
  if (domain.includes(' ')) {
    showStatus('Domain cannot contain spaces', 'error');
    return;
  }

  // Check for duplicates
  if (excludedDomains.includes(domain)) {
    showStatus('Domain already in the list', 'error');
    return;
  }

  excludedDomains.push(domain);
  renderExcludedDomains();
  elements.domainInput.value = '';
  elements.domainInput.focus();
}

/**
 * Remove a domain from the exclusion list
 */
function removeDomain(domain) {
  excludedDomains = excludedDomains.filter(d => d !== domain);
  renderExcludedDomains();
}

/**
 * Render the excluded domains list
 */
function renderExcludedDomains() {
  if (excludedDomains.length === 0) {
    elements.excludedDomainsList.innerHTML = '';
    return;
  }

  elements.excludedDomainsList.innerHTML = excludedDomains
    .map(domain => `
      <li>
        <code>${domain}</code>
        <button onclick="removeDomain('${domain}')" title="Remove">✕</button>
      </li>
    `)
    .join('');
}

/**
 * Save all settings
 */
async function saveSettings() {
  const settings = {
    // Language settings
    activePersian: elements.activePersian.checked,
    activeChinese: elements.activeChinese.checked,

    // HSK level settings
    chineseHskMin: parseInt(elements.chineseHskMin.value),
    chineseHskMax: parseInt(elements.chineseHskMax.value),

    // Highlight settings
    highlightOpacity: parseInt(elements.highlightOpacity.value),
    highlightColor: elements.highlightColor.value,
    highlightStyle: elements.highlightStyle.value,
    highlightThickness: parseInt(elements.highlightThickness.value),

    // Domain exclusions
    excludedDomains: excludedDomains,

    // Custom vocabulary settings
    hideMasteredWords: elements.hideMasteredWords.checked,
    showCustomWords: elements.showCustomWords.checked,

    // Mark as not first run
    firstRun: false
  };

  // Validate: at least one language must be active
  if (!settings.activePersian && !settings.activeChinese) {
    showStatus('At least one language must be enabled', 'error');
    return;
  }

  await settingsManager.set(settings);
  showStatus('✓ Settings saved successfully!', 'success');

  // Notify content scripts to reload
  chrome.tabs.query({}, (tabs) => {
    tabs.forEach(tab => {
      chrome.tabs.sendMessage(tab.id, { action: 'settingsUpdated' }).catch(() => {
        // Ignore errors for tabs without content scripts
      });
    });
  });
}

/**
 * Reset all settings to defaults
 */
async function resetSettings() {
  if (!confirm('Reset all settings to defaults? This cannot be undone.')) {
    return;
  }

  await settingsManager.reset();
  await loadSettings();
  updateChineseSectionVisibility();
  updateHskWordCount();
  updateHighlightPreview();
  showStatus('✓ Settings reset to defaults', 'success');
}

/**
 * Load vocabulary data and populate UI
 */
async function loadVocabulary() {
  // Load and render mastered words
  await renderMasteredWords('persian');
  await renderMasteredWords('chinese');

  // Load and render custom dictionaries
  await renderCustomWords('persian');
  await renderCustomWords('chinese');
}

/**
 * Setup tab navigation listeners
 */
function setupTabListeners() {
  const tabButtons = document.querySelectorAll('.tab-btn');

  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      const tabName = button.getAttribute('data-tab');
      const tabGroup = button.closest('.setting-group');

      // Deactivate all tabs in this group
      tabGroup.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
      tabGroup.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));

      // Activate selected tab
      button.classList.add('active');
      tabGroup.querySelector(`#${tabName}`).classList.add('active');
    });
  });
}

/**
 * Render mastered words list
 */
async function renderMasteredWords(language) {
  const words = await vocabularyManager.getMasteredWords(language);
  const listElement = language === 'persian' ? elements.masteredPersianList : elements.masteredChineseList;
  const countElement = language === 'persian' ? elements.masteredPersianCount : elements.masteredChineseCount;

  // Update count
  countElement.textContent = words.length;

  // Render list
  if (words.length === 0) {
    const emptyMessage = language === 'persian'
      ? 'No mastered words yet. Hover over any word and click "Mark as Mastered"'
      : 'No mastered words yet. Hover over any character and click "Mark as Mastered"';
    listElement.innerHTML = `<li class="empty-state">${emptyMessage}</li>`;
  } else {
    listElement.innerHTML = words
      .sort()
      .map(word => `
        <li>
          <span class="vocab-word">${word}</span>
          <button class="btn-delete" onclick="removeMasteredWord('${escapeHtml(word)}', '${language}')" title="Remove">✕</button>
        </li>
      `)
      .join('');
  }
}

/**
 * Remove a mastered word
 */
async function removeMasteredWord(word, language) {
  await vocabularyManager.unmarkAsMastered(word, language);
  await renderMasteredWords(language);
  notifyContentScripts();
  showStatus(`Removed "${word}" from mastered words`, 'success');
}

/**
 * Clear all mastered words for a language
 */
async function clearMasteredWords(language) {
  const languageName = language === 'persian' ? 'Persian' : 'Chinese';
  if (!confirm(`Clear all mastered ${languageName} words? This cannot be undone.`)) {
    return;
  }

  await vocabularyManager.clearMasteredWords(language);
  await renderMasteredWords(language);
  notifyContentScripts();
  showStatus(`✓ Cleared all mastered ${languageName} words`, 'success');
}

/**
 * Export mastered words to JSON file
 */
async function exportMasteredWords() {
  const stats = await vocabularyManager.getStats();
  const data = {
    persian: await vocabularyManager.getMasteredWords('persian'),
    chinese: await vocabularyManager.getMasteredWords('chinese'),
    exportDate: new Date().toISOString(),
    stats: stats
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `mastered-words-${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);

  showStatus(`✓ Exported ${stats.masteredWords.persian + stats.masteredWords.chinese} mastered words`, 'success');
}

/**
 * Import mastered words from JSON file
 */
async function importMasteredWords(event) {
  const file = event.target.files[0];
  if (!file) return;

  try {
    const text = await file.text();
    const data = JSON.parse(text);

    // Validate data structure
    if (!data.persian || !data.chinese) {
      showStatus('Invalid file format', 'error');
      return;
    }

    // Import words
    for (const word of data.persian) {
      await vocabularyManager.markAsMastered(word, 'persian');
    }
    for (const word of data.chinese) {
      await vocabularyManager.markAsMastered(word, 'chinese');
    }

    // Refresh UI
    await renderMasteredWords('persian');
    await renderMasteredWords('chinese');
    notifyContentScripts();

    showStatus(`✓ Imported ${data.persian.length + data.chinese.length} mastered words`, 'success');
  } catch (error) {
    showStatus('Failed to import file: ' + error.message, 'error');
  }

  // Reset file input
  event.target.value = '';
}

/**
 * Render custom dictionary words list
 */
async function renderCustomWords(language) {
  const words = await vocabularyManager.getUserDictionary(language);
  const listElement = language === 'persian' ? elements.customPersianList : elements.customChineseList;
  const countElement = language === 'persian' ? elements.customPersianCount : elements.customChineseCount;

  // Update count
  countElement.textContent = words.length;

  // Render list
  if (words.length === 0) {
    listElement.innerHTML = '<li class="empty-state">No custom words yet. Add your first word above!</li>';
  } else {
    listElement.innerHTML = words
      .sort((a, b) => {
        const wordA = language === 'persian' ? a.word : a.character;
        const wordB = language === 'persian' ? b.word : b.character;
        return wordA.localeCompare(wordB);
      })
      .map(word => {
        if (language === 'persian') {
          return `
            <li>
              <div class="vocab-details">
                <strong>${word.word}</strong>
                ${word.root ? `<span class="vocab-meta">Root: ${word.root}</span>` : ''}
                ${word.wordMeaning ? `<span class="vocab-meta">${word.wordMeaning}</span>` : ''}
                <span class="vocab-meta">${word.pos || 'noun'}</span>
              </div>
              <button class="btn-delete" onclick="removeCustomWord('${escapeHtml(word.id)}', 'persian')" title="Delete">✕</button>
            </li>
          `;
        } else {
          return `
            <li>
              <div class="vocab-details">
                <strong>${word.character}</strong>
                ${word.pinyin ? `<span class="vocab-meta">${word.pinyin}</span>` : ''}
                ${word.meaning ? `<span class="vocab-meta">${word.meaning}</span>` : ''}
                ${word.hskLevel > 0 ? `<span class="vocab-meta">HSK ${word.hskLevel}</span>` : ''}
              </div>
              <button class="btn-delete" onclick="removeCustomWord('${escapeHtml(word.id)}', 'chinese')" title="Delete">✕</button>
            </li>
          `;
        }
      })
      .join('');
  }
}

/**
 * Add a Persian word to custom dictionary
 */
async function addPersianWord() {
  const word = elements.persianWord.value.trim();

  if (!word) {
    showStatus('Word is required', 'error');
    return;
  }

  const wordData = {
    word: word,
    root: elements.persianRoot.value.trim(),
    rootMeaning: elements.persianRootMeaning.value.trim(),
    wordMeaning: elements.persianWordMeaning.value.trim(),
    pos: elements.persianPos.value
  };

  await vocabularyManager.addCustomWord('persian', wordData);
  await renderCustomWords('persian');
  notifyContentScripts();

  // Clear form
  elements.persianWord.value = '';
  elements.persianRoot.value = '';
  elements.persianRootMeaning.value = '';
  elements.persianWordMeaning.value = '';
  elements.persianPos.value = 'noun';
  elements.persianWord.focus();

  showStatus(`✓ Added "${word}" to custom dictionary`, 'success');
}

/**
 * Add a Chinese word to custom dictionary
 */
async function addChineseWord() {
  const character = elements.chineseCharacter.value.trim();

  if (!character) {
    showStatus('Character is required', 'error');
    return;
  }

  const wordData = {
    character: character,
    pinyin: elements.chinesePinyin.value.trim(),
    meaning: elements.chineseMeaning.value.trim(),
    radical: elements.chineseRadical.value.trim(),
    pos: elements.chinesePos.value
  };

  await vocabularyManager.addCustomWord('chinese', wordData);
  await renderCustomWords('chinese');
  notifyContentScripts();

  // Clear form
  elements.chineseCharacter.value = '';
  elements.chinesePinyin.value = '';
  elements.chineseMeaning.value = '';
  elements.chineseRadical.value = '';
  elements.chinesePos.value = 'noun';
  elements.chineseCharacter.focus();

  showStatus(`✓ Added "${character}" to custom dictionary`, 'success');
}

/**
 * Remove a custom word
 */
async function removeCustomWord(wordId, language) {
  await vocabularyManager.removeCustomWord(language, wordId);
  await renderCustomWords(language);
  notifyContentScripts();
  showStatus('✓ Word removed from custom dictionary', 'success');
}

/**
 * Export custom dictionary to JSON file
 */
async function exportCustomDictionary() {
  const data = {
    persian: await vocabularyManager.getUserDictionary('persian'),
    chinese: await vocabularyManager.getUserDictionary('chinese'),
    exportDate: new Date().toISOString()
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `custom-dictionary-${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);

  const totalWords = data.persian.length + data.chinese.length;
  showStatus(`✓ Exported ${totalWords} custom words`, 'success');
}

/**
 * Import custom dictionary from JSON file
 */
async function importCustomDictionary(event) {
  const file = event.target.files[0];
  if (!file) return;

  try {
    const text = await file.text();
    const data = JSON.parse(text);

    // Validate data structure
    if (!data.persian || !data.chinese) {
      showStatus('Invalid file format', 'error');
      return;
    }

    // Import words
    let importedCount = 0;
    for (const word of data.persian) {
      await vocabularyManager.addCustomWord('persian', word);
      importedCount++;
    }
    for (const word of data.chinese) {
      await vocabularyManager.addCustomWord('chinese', word);
      importedCount++;
    }

    // Refresh UI
    await renderCustomWords('persian');
    await renderCustomWords('chinese');
    notifyContentScripts();

    showStatus(`✓ Imported ${importedCount} custom words`, 'success');
  } catch (error) {
    showStatus('Failed to import file: ' + error.message, 'error');
  }

  // Reset file input
  event.target.value = '';
}

/**
 * Notify content scripts to reload vocabulary
 */
function notifyContentScripts() {
  chrome.tabs.query({}, (tabs) => {
    tabs.forEach(tab => {
      chrome.tabs.sendMessage(tab.id, { action: 'reloadVocabulary' }).catch(() => {
        // Ignore errors for tabs without content scripts
      });
    });
  });
}

/**
 * Escape HTML to prevent XSS in onclick attributes
 */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML.replace(/'/g, '&apos;').replace(/"/g, '&quot;');
}

/**
 * Show status message
 */
function showStatus(message, type) {
  elements.statusMessage.textContent = message;
  elements.statusMessage.className = `status-message show ${type}`;

  setTimeout(() => {
    elements.statusMessage.classList.remove('show');
  }, 3000);
}

// Make functions available globally for inline onclick
window.removeDomain = removeDomain;
window.removeMasteredWord = removeMasteredWord;
window.removeCustomWord = removeCustomWord;

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
