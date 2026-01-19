/**
 * Content Script for Multi-Language Learner (Farsi & Chinese)
 * Main script that runs on web pages to detect and highlight words
 */

(async function() {
  'use strict';

  // Initialize settings manager
  const settingsManager = new SettingsManager();

  // Initialize detectors
  const persianDetector = new LanguageDetector();
  const chineseDetector = new ChineseDetector();

  // Initialize matchers
  const persianMatcher = new PersianMatcher();
  const chineseMatcher = new ChineseMatcher();

  // State
  let settings = null;
  let activeLanguages = { persian: false, chinese: false };
  let tooltip = null;
  let currentHighlight = null;
  let translationPopup = null;

  /**
   * Load dictionaries based on detected languages
   */
  async function loadDictionaries(languages) {
    const results = {};

    if (languages.persian) {
      try {
        const response = await fetch(chrome.runtime.getURL('data/farsi-roots.json'));
        const data = await response.json();
        await persianMatcher.initialize(data);
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
        await chineseMatcher.initialize(data);
        results.chinese = true;
        console.log('Language Learner: Chinese dictionary loaded', chineseMatcher.getStats());
      } catch (error) {
        console.error('Language Learner: Failed to load Chinese dictionary', error);
        results.chinese = false;
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

    console.log('Language Learner: Page analysis', {
      persian: persianAnalysis,
      chinese: chineseAnalysis
    });

    return {
      persian: persianAnalysis.isPersian,
      chinese: chineseAnalysis.isChinese
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

    const content = `
      <div class="tooltip-word">${rootInfo.word}</div>

      <div class="tooltip-section">
        <div class="tooltip-label">Root</div>
        <div class="tooltip-value">
          <span class="tooltip-root">${rootInfo.root}</span>
          <span style="margin: 0 4px;">•</span>
          <span>${rootInfo.rootLatin}</span>
          <span class="tooltip-category">${rootInfo.category}</span>
        </div>
      </div>

      <div class="tooltip-section">
        <div class="tooltip-label">Root Meaning</div>
        <div class="tooltip-value">${rootInfo.rootMeaning}</div>
      </div>

      <div class="tooltip-section">
        <div class="tooltip-label">Word Meaning</div>
        <div class="tooltip-value">
          ${rootInfo.wordMeaning}
          <span class="tooltip-pos">${rootInfo.pos}</span>
        </div>
      </div>
    `;

    tooltip.innerHTML = content;
    positionTooltip(targetElement);
  }

  /**
   * Show tooltip for Chinese character/word
   */
  function showChineseTooltip(wordInfo, targetElement) {
    if (!tooltip) tooltip = createTooltip();

    const content = `
      <div class="tooltip-word">${wordInfo.character}</div>

      <div class="tooltip-section">
        <div class="tooltip-label">Pinyin</div>
        <div class="tooltip-value">${wordInfo.pinyin}</div>
      </div>

      <div class="tooltip-section">
        <div class="tooltip-label">Meaning</div>
        <div class="tooltip-value">
          ${wordInfo.meaning}
          <span class="tooltip-pos">${wordInfo.pos}</span>
        </div>
      </div>

      <div class="tooltip-section">
        <div class="tooltip-label">Radical</div>
        <div class="tooltip-value">
          <span class="tooltip-root">${wordInfo.radical}</span>
          <span style="margin: 0 4px;">•</span>
          <span>${wordInfo.radicalMeaning}</span>
          <span class="tooltip-category">HSK ${wordInfo.hskLevel}</span>
        </div>
      </div>
    `;

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
                node.classList.contains('chinese-char-highlight')
            )) return;

            if (node.nodeType === Node.TEXT_NODE) {
              const text = node.textContent;
              if (activeLanguages.persian && persianDetector.isPersian(text)) {
                processPersianTextNode(node);
              } else if (activeLanguages.chinese && chineseDetector.containsChinese(text)) {
                processChineseTextNode(node);
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
      .chinese-char-highlight {
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

    if (!enabledLanguages.persian && !enabledLanguages.chinese) {
      console.log('Language Learner: No languages enabled in settings');
      return;
    }

    // Detect languages on page
    const detectedLanguages = detectLanguages();

    // Only load languages that are both enabled AND detected
    const languagesToLoad = {
      persian: enabledLanguages.persian && detectedLanguages.persian,
      chinese: enabledLanguages.chinese && detectedLanguages.chinese
    };

    if (!languagesToLoad.persian && !languagesToLoad.chinese) {
      console.log('Language Learner: No enabled language content detected on page');
      return;
    }

    // Load appropriate dictionaries
    const loaded = await loadDictionaries(languagesToLoad);
    activeLanguages = loaded;

    if (!loaded.persian && !loaded.chinese) {
      console.error('Language Learner: Failed to load any dictionaries');
      return;
    }

    // Apply custom highlight styles from settings
    applyHighlightStyles();

    // Initialize translation popup with both matchers and detectors
    translationPopup = new TranslationPopup(
      persianMatcher,
      chineseMatcher,
      persianDetector,
      chineseDetector,
      loaded
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
   * Handle settings updates
   */
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'settingsUpdated') {
      console.log('Language Learner: Settings updated, reloading page...');
      window.location.reload();
    }
  });

  // Start when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
