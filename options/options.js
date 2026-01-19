/**
 * Options Page Script
 * Handles settings UI and user interactions
 */

const settingsManager = new SettingsManager();

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
  attachEventListeners();
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
 * Show status message
 */
function showStatus(message, type) {
  elements.statusMessage.textContent = message;
  elements.statusMessage.className = `status-message show ${type}`;

  setTimeout(() => {
    elements.statusMessage.classList.remove('show');
  }, 3000);
}

// Make removeDomain available globally for inline onclick
window.removeDomain = removeDomain;

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
