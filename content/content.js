/**
 * Content Script for Multi-Language Learner (Farsi, Chinese & Russian)
 * Main script that runs on web pages to detect and highlight words
 */

(async function() {
  'use strict';

  // Initialize managers
  const settingsManager = new SettingsManager();
  const vocabularyManager = new VocabularyManager();

  // Initialize detectors
  const persianDetector = new LanguageDetector();
  const chineseDetector = new ChineseDetector();
  const russianDetector = new RussianDetector();

  // Initialize matchers
  const persianMatcher = new PersianMatcher();
  const chineseMatcher = new ChineseMatcher();
  const russianMatcher = new RussianMatcher();

  // State
  let settings = null;
  let activeLanguages = { persian: false, chinese: false, russian: false };
  let tooltip = null;
  let currentHighlight = null;
  let translationPopup = null;
  let extensionEnabled = true;
  let toggleBanner = null;

  /**
   * Load dictionaries based on detected languages
   */
  async function loadDictionaries(languages) {
    const results = {};

    if (languages.persian) {
      try {
        const response = await fetch(chrome.runtime.getURL('data/farsi-roots.json'));
        const data = await response.json();
        await persianMatcher.initialize(data, vocabularyManager, settings);
        results.persian = true;
        console.log('Language Learner: Persian dictionary loaded', persianMatcher.getStats());
      } catch (error) {
        console.error('Language Learner: Failed to load Persian dictionary', error);
        results.persian = false;
      }
    }

    if (languages.chinese) {
      try {
        const response = await fetch(chrome.runtime.getURL('data/chinese-hsk.json'));
        const data = await response.json();
        await chineseMatcher.initialize(data, vocabularyManager, settings);
        results.chinese = true;
        console.log('Language Learner: Chinese dictionary loaded', chineseMatcher.getStats());
      } catch (error) {
        console.error('Language Learner: Failed to load Chinese dictionary', error);
        results.chinese = false;
      }
    }

    if (languages.russian) {
      try {
        const response = await fetch(chrome.runtime.getURL('data/russian-roots.json'));
        const data = await response.json();
        await russianMatcher.initialize(data, vocabularyManager, settings);
        results.russian = true;
        console.log('Language Learner: Russian dictionary loaded', russianMatcher.getStats());
      } catch (error) {
        console.error('Language Learner: Failed to load Russian dictionary', error);
        results.russian = false;
      }
    }

    return results;
  }

  /**
   * Detect which languages are present on the page
   */
  function detectLanguages() {
    const persianAnalysis = persianDetector.analyzePage();
    const chineseAnalysis = chineseDetector.analyzePage();
    const russianText = document.body.textContent || '';
    const hasRussian = russianDetector.containsRussian(russianText);

    console.log('Language Learner: Page analysis', {
      persian: persianAnalysis,
      chinese: chineseAnalysis,
      russian: hasRussian
    });

    return {
      persian: persianAnalysis.isPersian,
      chinese: chineseAnalysis.isChinese,
      russian: hasRussian
    };
  }

  /**
   * Create tooltip element
   */
  function createTooltip() {
    const tooltipEl = document.createElement('div');
    tooltipEl.className = 'farsi-root-tooltip'; // Keep same class for consistent styling
    tooltipEl.setAttribute('role', 'tooltip');
    document.body.appendChild(tooltipEl);
    return tooltipEl;
  }

  /**
   * Show tooltip for Persian word
   */
  function showPersianTooltip(rootInfo, targetElement) {
    if (!tooltip) tooltip = createTooltip();

    // Build tooltip sections conditionally
    let sections = `<div class="tooltip-word">${rootInfo.word}</div>`;

    // Show root section only if root has value
    if (rootInfo.root) {
      sections += `
        <div class="tooltip-section">
          <div class="tooltip-label">Root</div>
          <div class="tooltip-value">
            <span class="tooltip-root">${rootInfo.root}</span>
            ${rootInfo.rootLatin ? `<span style="margin: 0 4px;">•</span><span>${rootInfo.rootLatin}</span>` : ''}
            ${rootInfo.category ? `<span class="tooltip-category">${rootInfo.category}</span>` : ''}
          </div>
        </div>
      `;
    }

    // Show root meaning only if it has value
    if (rootInfo.rootMeaning) {
      sections += `
        <div class="tooltip-section">
          <div class="tooltip-label">Root Meaning</div>
          <div class="tooltip-value">${rootInfo.rootMeaning}</div>
        </div>
      `;
    }

    // Show word meaning
    if (rootInfo.wordMeaning) {
      sections += `
        <div class="tooltip-section">
          <div class="tooltip-label">Word Meaning</div>
          <div class="tooltip-value">
            ${rootInfo.wordMeaning}
            <span class="tooltip-pos">${rootInfo.pos}</span>
          </div>
        </div>
      `;
    }

    const content = sections;

    tooltip.innerHTML = content;
    positionTooltip(targetElement);
  }

  /**
   * Show tooltip for Chinese character/word
   */
  function showChineseTooltip(wordInfo, targetElement) {
    if (!tooltip) tooltip = createTooltip();

    // Build tooltip sections conditionally
    let sections = `<div class="tooltip-word">${wordInfo.character}</div>`;

    // Show pinyin if available
    if (wordInfo.pinyin) {
      sections += `
        <div class="tooltip-section">
          <div class="tooltip-label">Pinyin</div>
          <div class="tooltip-value">${wordInfo.pinyin}</div>
        </div>
      `;
    }

    // Show meaning if available
    if (wordInfo.meaning) {
      sections += `
        <div class="tooltip-section">
          <div class="tooltip-label">Meaning</div>
          <div class="tooltip-value">
            ${wordInfo.meaning}
            <span class="tooltip-pos">${wordInfo.pos}</span>
          </div>
        </div>
      `;
    }

    // Show radical section
    if (wordInfo.radical) {
      sections += `
        <div class="tooltip-section">
          <div class="tooltip-label">Radical</div>
          <div class="tooltip-value">
            <span class="tooltip-root">${wordInfo.radical}</span>
            ${wordInfo.radicalMeaning ? `<span style="margin: 0 4px;">•</span><span>${wordInfo.radicalMeaning}</span>` : ''}
            ${wordInfo.hskLevel > 0 ? `<span class="tooltip-category">HSK ${wordInfo.hskLevel}</span>` : ''}
          </div>
        </div>
      `;
    }

    const content = sections;

    tooltip.innerHTML = content;
    positionTooltip(targetElement);
  }

  /**
   * Show tooltip for Russian word
   */
  function showRussianTooltip(wordInfo, targetElement) {
    if (!tooltip) tooltip = createTooltip();

    // Build tooltip sections conditionally
    let sections = `<div class="tooltip-word">${wordInfo.word}</div>`;

    // Show root section if available
    if (wordInfo.root) {
      sections += `
        <div class="tooltip-section">
          <div class="tooltip-label">Root</div>
          <div class="tooltip-value">
            <span class="tooltip-root">${wordInfo.root}</span>
            ${wordInfo.rootLatin ? `<span style="margin: 0 4px;">•</span><span>${wordInfo.rootLatin}</span>` : ''}
          </div>
        </div>
      `;
    }

    // Show root meaning if available
    if (wordInfo.rootMeaning) {
      sections += `
        <div class="tooltip-section">
          <div class="tooltip-label">Root Meaning</div>
          <div class="tooltip-value">${wordInfo.rootMeaning}</div>
        </div>
      `;
    }

    // Show prefixes and suffixes if enabled and available
    if (settings.showRussianAffixes && (wordInfo.prefixes?.length > 0 || wordInfo.suffixes?.length > 0)) {
      const affixParts = [];
      if (wordInfo.prefixes && wordInfo.prefixes.length > 0) {
        const prefixes = wordInfo.prefixes.slice(0, 5).join(', ');
        affixParts.push(`Prefixes: ${prefixes}`);
      }
      if (wordInfo.suffixes && wordInfo.suffixes.length > 0) {
        const suffixes = wordInfo.suffixes.slice(0, 5).join(', ');
        affixParts.push(`Suffixes: ${suffixes}`);
      }

      if (affixParts.length > 0) {
        sections += `
          <div class="tooltip-section">
            <div class="tooltip-label">Common Affixes</div>
            <div class="tooltip-value" style="font-size: 0.9em;">${affixParts.join(' • ')}</div>
          </div>
        `;
      }
    }

    // Show word meaning if available
    if (wordInfo.wordMeaning) {
      sections += `
        <div class="tooltip-section">
          <div class="tooltip-label">Word Meaning</div>
          <div class="tooltip-value">
            ${wordInfo.wordMeaning}
            <span class="tooltip-pos">${wordInfo.pos}</span>
          </div>
        </div>
      `;
    }

    // Show frequency rank if available
    if (wordInfo.frequencyRank > 0) {
      sections += `
        <div class="tooltip-section">
          <div class="tooltip-label">Frequency</div>
          <div class="tooltip-value">
            <span class="tooltip-category">#${wordInfo.frequencyRank} most common</span>
          </div>
        </div>
      `;
    }

    const content = sections;

    tooltip.innerHTML = content;
    positionTooltip(targetElement);
  }

  /**
   * Position tooltip near target element
   */
  function positionTooltip(targetElement) {
    const rect = targetElement.getBoundingClientRect();
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;

    let top = rect.top + scrollTop - tooltip.offsetHeight - 12;
    let left = rect.left + scrollLeft;

    if (top < scrollTop) {
      top = rect.bottom + scrollTop + 12;
      tooltip.style.setProperty('transform-origin', 'top');
    }

    if (left + tooltip.offsetWidth > window.innerWidth + scrollLeft) {
      left = window.innerWidth + scrollLeft - tooltip.offsetWidth - 10;
    }

    tooltip.style.top = `${top}px`;
    tooltip.style.left = `${left}px`;

    requestAnimationFrame(() => {
      tooltip.classList.add('visible');
    });
  }

  /**
   * Hide tooltip
   */
  function hideTooltip() {
    if (tooltip) {
      tooltip.classList.remove('visible');
    }
  }

  /**
   * Process Persian text node
   */
  function processPersianTextNode(textNode) {
    if (!textNode || !textNode.parentNode || !textNode.textContent) return;

    const parent = textNode.parentNode;
    if (parent.classList && (
        parent.classList.contains('farsi-root-highlight') ||
        parent.classList.contains('chinese-char-highlight') ||
        parent.classList.contains('farsi-root-tooltip') ||
        parent.closest('.farsi-root-tooltip')
    )) {
      return;
    }

    const text = textNode.textContent;
    const matches = persianMatcher.extractWords(text);

    if (matches.length === 0) return;

    const fragment = document.createDocumentFragment();
    let lastIndex = 0;

    matches.forEach(match => {
      if (match.start > lastIndex) {
        fragment.appendChild(
          document.createTextNode(text.substring(lastIndex, match.start))
        );
      }

      const span = document.createElement('span');
      span.className = 'farsi-root-highlight';
      span.textContent = match.word;
      span.dataset.language = 'persian';
      span.dataset.wordInfo = JSON.stringify(match.rootInfo);

      span.addEventListener('mouseenter', function() {
        const rootInfo = JSON.parse(this.dataset.wordInfo);
        showPersianTooltip(rootInfo, this);
        currentHighlight = this;
      });

      span.addEventListener('mouseleave', function() {
        hideTooltip();
        currentHighlight = null;
      });

      fragment.appendChild(span);
      lastIndex = match.end;
    });

    if (lastIndex < text.length) {
      fragment.appendChild(document.createTextNode(text.substring(lastIndex)));
    }

    try {
      textNode.parentNode.replaceChild(fragment, textNode);
    } catch (error) {
      console.error('Language Learner: Error processing Persian text', error);
    }
  }

  /**
   * Process Chinese text node
   */
  function processChineseTextNode(textNode) {
    if (!textNode || !textNode.parentNode || !textNode.textContent) return;

    const parent = textNode.parentNode;
    if (parent.classList && (
        parent.classList.contains('farsi-root-highlight') ||
        parent.classList.contains('chinese-char-highlight') ||
        parent.classList.contains('farsi-root-tooltip') ||
        parent.closest('.farsi-root-tooltip')
    )) {
      return;
    }

    const text = textNode.textContent;
    const allMatches = chineseMatcher.extractWords(text);

    // Filter by HSK level based on settings
    const matches = allMatches.filter(match => {
      const hskLevel = match.wordInfo.hskLevel;
      return hskLevel >= settings.chineseHskMin && hskLevel <= settings.chineseHskMax;
    });

    if (matches.length === 0) return;

    const fragment = document.createDocumentFragment();
    let lastIndex = 0;

    matches.forEach(match => {
      if (match.start > lastIndex) {
        fragment.appendChild(
          document.createTextNode(text.substring(lastIndex, match.start))
        );
      }

      const span = document.createElement('span');
      span.className = 'chinese-char-highlight farsi-root-highlight'; // Reuse farsi styles
      span.textContent = match.word;
      span.dataset.language = 'chinese';
      span.dataset.wordInfo = JSON.stringify(match.wordInfo);

      span.addEventListener('mouseenter', function() {
        const wordInfo = JSON.parse(this.dataset.wordInfo);
        showChineseTooltip(wordInfo, this);
        currentHighlight = this;
      });

      span.addEventListener('mouseleave', function() {
        hideTooltip();
        currentHighlight = null;
      });

      fragment.appendChild(span);
      lastIndex = match.end;
    });

    if (lastIndex < text.length) {
      fragment.appendChild(document.createTextNode(text.substring(lastIndex)));
    }

    try {
      textNode.parentNode.replaceChild(fragment, textNode);
    } catch (error) {
      console.error('Language Learner: Error processing Chinese text', error);
    }
  }

  /**
   * Process Russian text node
   */
  function processRussianTextNode(textNode) {
    if (!textNode || !textNode.parentNode || !textNode.textContent) return;

    const parent = textNode.parentNode;
    if (parent.classList && (
        parent.classList.contains('farsi-root-highlight') ||
        parent.classList.contains('chinese-char-highlight') ||
        parent.classList.contains('russian-word-highlight') ||
        parent.classList.contains('farsi-root-tooltip') ||
        parent.closest('.farsi-root-tooltip')
    )) {
      return;
    }

    const text = textNode.textContent;
    const matches = russianMatcher.extractWords(text);

    if (matches.length === 0) return;

    const fragment = document.createDocumentFragment();
    let lastIndex = 0;

    matches.forEach(match => {
      if (match.startIndex > lastIndex) {
        fragment.appendChild(
          document.createTextNode(text.substring(lastIndex, match.startIndex))
        );
      }

      const span = document.createElement('span');
      span.className = 'russian-word-highlight farsi-root-highlight'; // Reuse farsi styles
      span.textContent = match.word;
      span.dataset.language = 'russian';
      span.dataset.wordInfo = JSON.stringify(match.wordInfo);

      span.addEventListener('mouseenter', function() {
        const wordInfo = JSON.parse(this.dataset.wordInfo);
        showRussianTooltip(wordInfo, this);
        currentHighlight = this;
      });

      span.addEventListener('mouseleave', function() {
        hideTooltip();
        currentHighlight = null;
      });

      fragment.appendChild(span);
      lastIndex = match.endIndex;
    });

    if (lastIndex < text.length) {
      fragment.appendChild(document.createTextNode(text.substring(lastIndex)));
    }

    try {
      textNode.parentNode.replaceChild(fragment, textNode);
    } catch (error) {
      console.error('Language Learner: Error processing Russian text', error);
    }
  }

  /**
   * Process all text nodes in document
   */
  function processPage() {
    const textNodes = [];
    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: (node) => {
          const tagName = node.parentElement?.tagName;
          if (tagName === 'SCRIPT' || tagName === 'STYLE' || tagName === 'NOSCRIPT') {
            return NodeFilter.FILTER_REJECT;
          }
          return node.textContent.trim().length > 0 ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP;
        }
      }
    );

    let node;
    while ((node = walker.nextNode())) {
      textNodes.push(node);
    }

    textNodes.forEach(textNode => {
      const text = textNode.textContent;

      // Check if contains Persian
      if (activeLanguages.persian && persianDetector.isPersian(text)) {
        processPersianTextNode(textNode);
      }
      // Check if contains Chinese (only if not already processed as Persian)
      else if (activeLanguages.chinese && chineseDetector.containsChinese(text)) {
        processChineseTextNode(textNode);
      }
      // Check if contains Russian (only if not already processed)
      else if (activeLanguages.russian && russianDetector.containsRussian(text)) {
        processRussianTextNode(textNode);
      }
    });
  }

  /**
   * Set up mutation observer for dynamic content
   */
  function setupMutationObserver() {
    let processingTimeout = null;
    const observer = new MutationObserver(mutations => {
      if (processingTimeout) clearTimeout(processingTimeout);

      processingTimeout = setTimeout(() => {
        mutations.forEach(mutation => {
          mutation.addedNodes.forEach(node => {
            if (node.classList && (
                node.classList.contains('farsi-root-tooltip') ||
                node.classList.contains('farsi-root-highlight') ||
                node.classList.contains('chinese-char-highlight') ||
                node.classList.contains('russian-word-highlight')
            )) return;

            if (node.nodeType === Node.TEXT_NODE) {
              const text = node.textContent;
              if (activeLanguages.persian && persianDetector.isPersian(text)) {
                processPersianTextNode(node);
              } else if (activeLanguages.chinese && chineseDetector.containsChinese(text)) {
                processChineseTextNode(node);
              } else if (activeLanguages.russian && russianDetector.containsRussian(text)) {
                processRussianTextNode(node);
              }
            } else if (node.nodeType === Node.ELEMENT_NODE) {
              processPage();
            }
          });
        });
      }, 100);
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  /**
   * Apply highlight styles from settings
   */
  function applyHighlightStyles() {
    if (!settings) return;

    // Remove existing style element if any
    const existingStyle = document.getElementById('language-learner-highlight-style');
    if (existingStyle) existingStyle.remove();

    // Create style element
    const style = document.createElement('style');
    style.id = 'language-learner-highlight-style';

    // Convert hex to rgba
    const hex = settings.highlightColor;
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    const opacity = settings.highlightOpacity / 100;

    let decorationStyle = 'dotted';
    if (settings.highlightStyle === 'solid') decorationStyle = 'solid';
    else if (settings.highlightStyle === 'wavy') decorationStyle = 'wavy';
    else if (settings.highlightStyle === 'none') decorationStyle = 'none';

    const css = `
      .farsi-root-highlight,
      .chinese-char-highlight,
      .russian-word-highlight {
        ${decorationStyle === 'none' ? 'text-decoration: none !important;' : `
          text-decoration-line: underline !important;
          text-decoration-style: ${decorationStyle} !important;
          text-decoration-color: rgba(${r}, ${g}, ${b}, ${opacity}) !important;
          text-decoration-thickness: ${settings.highlightThickness}px !important;
        `}
      }
    `;

    style.textContent = css;
    document.head.appendChild(style);
  }

  /**
   * Hide all highlights
   */
  function hideHighlights() {
    const highlights = document.querySelectorAll('.farsi-root-highlight, .chinese-char-highlight, .russian-word-highlight');
    highlights.forEach(highlight => {
      highlight.style.display = 'none';
    });

    // Hide tooltip and translation popup
    if (tooltip) {
      tooltip.style.display = 'none';
    }
    if (translationPopup) {
      translationPopup.hide();
    }
  }

  /**
   * Show all highlights
   */
  function showHighlights() {
    const highlights = document.querySelectorAll('.farsi-root-highlight, .chinese-char-highlight, .russian-word-highlight');
    highlights.forEach(highlight => {
      highlight.style.display = '';
    });

    // Restore tooltip visibility
    if (tooltip) {
      tooltip.style.display = '';
    }
  }

  /**
   * Create and show toggle banner
   */
  function showToggleBanner(enabled) {
    // Remove existing banner if any
    if (toggleBanner) {
      toggleBanner.remove();
    }

    // Create banner
    toggleBanner = document.createElement('div');
    toggleBanner.id = 'language-learner-toggle-banner';
    toggleBanner.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${enabled ? '#10b981' : '#ef4444'};
      color: white;
      padding: 12px 20px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      z-index: 2147483647;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      font-size: 14px;
      font-weight: 600;
      animation: slideInRight 0.3s ease-out;
      pointer-events: none;
    `;

    toggleBanner.textContent = enabled
      ? '✓ Language Learner Enabled'
      : '✕ Language Learner Disabled';

    // Add animation
    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideInRight {
        from {
          transform: translateX(400px);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
      @keyframes slideOutRight {
        from {
          transform: translateX(0);
          opacity: 1;
        }
        to {
          transform: translateX(400px);
          opacity: 0;
        }
      }
    `;
    document.head.appendChild(style);

    document.body.appendChild(toggleBanner);

    // Auto-hide after 2 seconds
    setTimeout(() => {
      if (toggleBanner) {
        toggleBanner.style.animation = 'slideOutRight 0.3s ease-in';
        setTimeout(() => {
          if (toggleBanner) {
            toggleBanner.remove();
            toggleBanner = null;
          }
        }, 300);
      }
    }, 2000);
  }

  /**
   * Toggle extension on/off
   */
  function toggleExtension(enabled) {
    extensionEnabled = enabled;

    if (enabled) {
      showHighlights();
    } else {
      hideHighlights();
    }

    showToggleBanner(enabled);
    console.log(`Language Learner: Extension ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Initialize extension
   */
  async function init() {
    // Load settings
    settings = await settingsManager.getAll();

    // Check if current domain is excluded
    const isExcluded = await settingsManager.isCurrentDomainExcluded();
    if (isExcluded) {
      console.log('Language Learner: Domain is excluded in settings');
      return;
    }

    // Check which languages are enabled in settings
    const enabledLanguages = await settingsManager.getActiveLanguages();

    if (!enabledLanguages.persian && !enabledLanguages.chinese && !enabledLanguages.russian) {
      console.log('Language Learner: No languages enabled in settings');
      return;
    }

    // Detect languages on page
    const detectedLanguages = detectLanguages();

    // Only load languages that are both enabled AND detected
    const languagesToLoad = {
      persian: enabledLanguages.persian && detectedLanguages.persian,
      chinese: enabledLanguages.chinese && detectedLanguages.chinese,
      russian: enabledLanguages.russian && detectedLanguages.russian
    };

    if (!languagesToLoad.persian && !languagesToLoad.chinese && !languagesToLoad.russian) {
      console.log('Language Learner: No enabled language content detected on page');
      return;
    }

    // Load appropriate dictionaries
    const loaded = await loadDictionaries(languagesToLoad);
    activeLanguages = loaded;

    if (!loaded.persian && !loaded.chinese && !loaded.russian) {
      console.error('Language Learner: Failed to load any dictionaries');
      return;
    }

    // Apply custom highlight styles from settings
    applyHighlightStyles();

    // Initialize translation popup with all matchers and detectors
    translationPopup = new TranslationPopup(
      persianMatcher,
      chineseMatcher,
      russianMatcher,
      persianDetector,
      chineseDetector,
      russianDetector,
      loaded,
      vocabularyManager
    );

    // Process page
    processPage();

    // Set up observer for dynamic content
    setupMutationObserver();

    console.log('Language Learner: Initialized with languages:', activeLanguages);
    console.log('Language Learner: Settings:', {
      highlightOpacity: settings.highlightOpacity,
      chineseHskRange: `${settings.chineseHskMin}-${settings.chineseHskMax}`
    });
  }

  /**
   * Handle messages from background script
   */
  chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
    if (message.action === 'settingsUpdated') {
      console.log('Language Learner: Settings updated, reloading page...');
      window.location.reload();
    }

    if (message.action === 'toggleExtension') {
      toggleExtension(message.enabled);
      sendResponse({ success: true });
    }

    if (message.action === 'markAsMastered') {
      try {
        await vocabularyManager.markAsMastered(message.word, message.language);
        // Reload custom vocabulary in matchers
        if (message.language === 'persian' && activeLanguages.persian) {
          await persianMatcher.reloadCustomVocabulary();
        } else if (message.language === 'chinese' && activeLanguages.chinese) {
          await chineseMatcher.reloadCustomVocabulary();
        } else if (message.language === 'russian' && activeLanguages.russian) {
          await russianMatcher.reloadCustomVocabulary();
        }
        sendResponse({ success: true });
      } catch (error) {
        console.error('Language Learner: Failed to mark as mastered', error);
        sendResponse({ success: false, error: error.message });
      }
    }

    if (message.action === 'unmarkAsMastered') {
      try {
        await vocabularyManager.unmarkAsMastered(message.word, message.language);
        // Reload custom vocabulary in matchers
        if (message.language === 'persian' && activeLanguages.persian) {
          await persianMatcher.reloadCustomVocabulary();
        } else if (message.language === 'chinese' && activeLanguages.chinese) {
          await chineseMatcher.reloadCustomVocabulary();
        } else if (message.language === 'russian' && activeLanguages.russian) {
          await russianMatcher.reloadCustomVocabulary();
        }
        sendResponse({ success: true });
      } catch (error) {
        console.error('Language Learner: Failed to unmark as mastered', error);
        sendResponse({ success: false, error: error.message });
      }
    }

    if (message.action === 'reloadVocabulary') {
      try {
        // Reload custom vocabulary in all matchers
        if (activeLanguages.persian) {
          await persianMatcher.reloadCustomVocabulary();
        }
        if (activeLanguages.chinese) {
          await chineseMatcher.reloadCustomVocabulary();
        }
        if (activeLanguages.russian) {
          await russianMatcher.reloadCustomVocabulary();
        }
        // Reprocess page
        processPage();
        sendResponse({ success: true });
      } catch (error) {
        console.error('Language Learner: Failed to reload vocabulary', error);
        sendResponse({ success: false, error: error.message });
      }
    }

    return true; // Keep message channel open for async response
  });

  // Start when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
